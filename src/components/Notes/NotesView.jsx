import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { ChevronDown, ChevronRight, FolderPlus, FilePlus, FileText, FolderTree, Printer } from 'lucide-react';
import { format } from 'date-fns';
import TipTapEditor from './TipTapEditor';
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';

function DroppableZone({ id, children, className }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? 'drag-over' : ''}`}>
      {children}
    </div>
  );
}

function DraggableNote({ note, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: note.id,
    data: { note }
  });
  
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 999 : undefined,
    opacity: isDragging ? 0.5 : 1
  } : undefined;

  // We wrap the click in a handler that stops propagation to avoid triggering parent folders if clicked
  const handleClick = (e) => {
    e.stopPropagation();
    onClick();
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes}
      className={`tree-note ${isActive ? 'active' : ''}`}
      onClick={handleClick}
    >
      <FileText size={14} />
      <span className="tree-label note-label">{note.title || 'Untitled'}</span>
    </div>
  );
}

export default function NotesView() {
  const { subjects, noteFolders, notes, addNoteFolder, addNote, updateNote, settings, updateSettings, addRecentItem } = useStore();
  
  const [expandedSubjects, setExpandedSubjects] = useState([null, ...subjects.map(s => s.id)]);
  const [expandedFolders, setExpandedFolders] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [showMovePopover, setShowMovePopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // One-time migration
  useEffect(() => {
    if (!settings.notesMigratedV2) {
      notes.forEach(note => {
        updateNote(note.id, { body: '' });
      });
      updateSettings({ notesMigratedV2: true });
    }
  }, [settings.notesMigratedV2, notes, updateNote, updateSettings]);

  const activeNote = notes.find(n => n.id === activeNoteId);
  const [localNoteBody, setLocalNoteBody] = useState('');
  const [localNoteTitle, setLocalNoteTitle] = useState('');
  
  const saveTimeoutRef = useRef(null);
  const showSavedTimeoutRef = useRef(null);
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (!activeNoteId) return;
    const note = notes.find(n => n.id === activeNoteId);
    if (!note) return;
    setLocalNoteBody(note.body);
    setLocalNoteTitle(note.title);
  }, [activeNoteId, notes]);

  const handleBodyChange = (jsonStr) => {
    setLocalNoteBody(jsonStr);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(activeNoteId, { body: jsonStr });
      setShowSaved(true);
      if (showSavedTimeoutRef.current) clearTimeout(showSavedTimeoutRef.current);
      showSavedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    }, 500);
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setLocalNoteTitle(val);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(activeNoteId, { title: val });
      setShowSaved(true);
      if (showSavedTimeoutRef.current) clearTimeout(showSavedTimeoutRef.current);
      showSavedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
    }, 500);
  };

  const toggleSubject = (id) => {
    setExpandedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleFolder = (id) => {
    setExpandedFolders(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const handleAddFolder = (subjectId, e) => {
    e.stopPropagation();
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const id = 'fld-' + Date.now();
      addNoteFolder({ id, subjectId, name: folderName });
      setExpandedFolders(prev => [...prev, id]);
      if (!expandedSubjects.includes(subjectId)) {
        setExpandedSubjects(prev => [...prev, subjectId]);
      }
    }
  };

  const handleAddNote = (folderId, subjectId, e) => {
    e.stopPropagation();
    const id = 'note-' + Date.now();
    addNote({ 
      id, 
      subjectId, 
      folderId, 
      title: 'Untitled Note', 
      body: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveNoteId(id);
    if (folderId && !expandedFolders.includes(folderId)) {
      setExpandedFolders(prev => [...prev, folderId]);
    } else if (!folderId && !expandedSubjects.includes(subjectId)) {
      setExpandedSubjects(prev => [...prev, subjectId]);
    }
  };

  const handleMoveNote = (newSubjectId, newFolderId) => {
    if (activeNoteId) {
      updateNote(activeNoteId, { subjectId: newSubjectId, folderId: newFolderId });
      setShowMovePopover(false);
      if (!expandedSubjects.includes(newSubjectId)) {
        setExpandedSubjects(prev => [...prev, newSubjectId]);
      }
      if (newFolderId && !expandedFolders.includes(newFolderId)) {
        setExpandedFolders(prev => [...prev, newFolderId]);
      }
    }
  };

  const printNote = () => {
    if (!activeNote) return;
    
    // We need to parse TipTap JSON to HTML, or get it from TipTapEditor somehow.
    // However, TipTapEditor only exposes JSON. The easiest way is to query the DOM of the editor.
    const editorDom = document.querySelector('.tiptap.ProseMirror');
    const content = editorDom ? editorDom.innerHTML : '';
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${activeNote.title || 'Note'}</title>
          <style>
            body { font-family: Inter, sans-serif; max-width: 800px; margin: 40px auto; color: #000; }
            h1 { font-size: 24px; margin-bottom: 24px; }
            p { margin-bottom: 1em; line-height: 1.5; }
            ul, ol { margin-bottom: 1em; padding-left: 20px; }
          </style>
        </head>
        <body>
          <h1>${activeNote.title || 'Untitled Note'}</h1>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    // Use timeout to let styles apply
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };

  const generalSubject = { id: null, name: 'General' };
  const allSubjects = [generalSubject, ...subjects];

  const searchRegex = searchQuery ? new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

  const extractText = (node) => {
    return node.text ?? (node.content?.map(extractText).join('') ?? '');
  };

  const doesNoteMatch = (note) => {
    if (!searchRegex) return true;
    if (searchRegex.test(note.title)) return true;
    try {
      const parsed = typeof note.body === 'string' ? JSON.parse(note.body) : note.body;
      if (parsed && parsed.content) {
        const text = parsed.content.map(extractText).join(' ');
        if (searchRegex.test(text)) return true;
      }
    } catch(e) {}
    return false;
  };

  const filteredNotes = notes.filter(doesNoteMatch);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const noteId = active.id;
    let targetSubjectId = null;
    let targetFolderId = null;

    if (over.id.startsWith('root:')) {
      const parts = over.id.split(':');
      if (parts[1] !== 'general') {
        targetSubjectId = parts[1];
      }
      targetFolderId = null;
    } else if (over.id.startsWith('folder:')) {
      const fId = over.id.split(':')[1];
      const targetFolder = noteFolders.find(f => f.id === fId);
      if (targetFolder) {
        targetSubjectId = targetFolder.subjectId;
        targetFolderId = fId;
      }
    }

    if (targetSubjectId !== undefined) {
      updateNote(noteId, { subjectId: targetSubjectId, folderId: targetFolderId });
      if (!expandedSubjects.includes(targetSubjectId)) {
        setExpandedSubjects(prev => [...prev, targetSubjectId]);
      }
      if (targetFolderId && !expandedFolders.includes(targetFolderId)) {
        setExpandedFolders(prev => [...prev, targetFolderId]);
      }
    }
  };

  return (
    <div className="notes-view">
      <div className="notes-sidebar glass">
        <div className="sidebar-title">Notebook</div>
        
        <div className="notes-search">
          <input 
            type="text" 
            placeholder="🔎 Search notes..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="tree-container">
            {allSubjects.map(subject => {
              const subjectFolders = noteFolders.filter(f => f.subjectId === subject.id);
              const subjectRootNotes = filteredNotes.filter(n => n.subjectId === subject.id && !n.folderId);
              
              const subjectHasMatches = subjectRootNotes.length > 0 || subjectFolders.some(f => filteredNotes.some(n => n.folderId === f.id));
              
              if (searchQuery && !subjectHasMatches) return null;

              const isGeneral = !subject.id;
              const isSubjExpanded = expandedSubjects.includes(subject.id) || !!searchQuery;
              const dropId = isGeneral ? 'root:general' : `root:${subject.id}`;
              
              return (
                <DroppableZone key={subject.id || 'general'} id={dropId} className="tree-subject">
                  <div className="tree-header" onClick={() => toggleSubject(subject.id)}>
                    {isSubjExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <span className="tree-label subject-label">{subject.name}</span>
                    <button className="icon-btn" onClick={(e) => handleAddNote(null, subject.id, e)} title="New Note">
                      <FilePlus size={14} />
                    </button>
                    <button className="icon-btn" onClick={(e) => handleAddFolder(subject.id, e)} title="New Folder">
                      <FolderPlus size={14} />
                    </button>
                  </div>
                  
                  {isSubjExpanded && (
                    <div className="tree-children">
                      {subjectRootNotes.map(note => (
                        <DraggableNote 
                          key={note.id} 
                          note={note} 
                          isActive={activeNoteId === note.id} 
                          onClick={() => setActiveNoteId(note.id)} 
                        />
                      ))}
                      {subjectFolders.map(folder => {
                        const folderNotes = filteredNotes.filter(n => n.folderId === folder.id);
                        if (searchQuery && folderNotes.length === 0) return null;

                        const isFldExpanded = expandedFolders.includes(folder.id) || !!searchQuery;
                        
                        return (
                          <DroppableZone key={folder.id} id={`folder:${folder.id}`} className="tree-folder">
                            <div className="tree-header" onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}>
                              {isFldExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              <span className="tree-label folder-label">{folder.name}</span>
                              <button className="icon-btn" onClick={(e) => handleAddNote(folder.id, subject.id, e)} title="New Note">
                                <FilePlus size={14} />
                              </button>
                            </div>
                            
                            {isFldExpanded && (
                              <div className="tree-children">
                                {folderNotes.map(note => (
                                  <DraggableNote 
                                    key={note.id} 
                                    note={note} 
                                    isActive={activeNoteId === note.id} 
                                    onClick={() => setActiveNoteId(note.id)} 
                                  />
                                ))}
                              </div>
                            )}
                          </DroppableZone>
                        );
                      })}
                    </div>
                  )}
                </DroppableZone>
              );
            })}
          </div>
        </DndContext>
      </div>

      <div className="notes-editor glass">
        {activeNote ? (
          <div className="editor-container">
            <div className="editor-header">
              <div className="header-top-row">
                <input 
                  className="note-title-input" 
                  value={localNoteTitle} 
                  onChange={handleTitleChange} 
                  placeholder="Note Title" 
                />
                <div className="note-actions">
                  <button className="icon-btn action-btn" onClick={printNote} title="Print Note">
                    <Printer size={18} />
                  </button>
                  <button className="icon-btn action-btn" onClick={() => setShowMovePopover(!showMovePopover)} title="Move Note">
                    <FolderTree size={18} />
                  </button>
                  {showMovePopover && (
                    <div className="move-popover glass">
                      <div className="popover-title">Move to...</div>
                      <div className="popover-list">
                        {allSubjects.map(s => {
                          const folders = noteFolders.filter(f => f.subjectId === s.id);
                          return (
                            <div key={s.id || 'general'} className="popover-subject-group">
                              <div 
                                className={`popover-subject ${activeNote.subjectId === s.id && !activeNote.folderId ? 'current' : 'selectable'}`}
                                onClick={() => handleMoveNote(s.id, null)}
                              >
                                {s.name}
                              </div>
                              {folders.map(f => (
                                <div 
                                  key={f.id} 
                                  className={`popover-folder ${activeNote.folderId === f.id ? 'current' : ''}`}
                                  onClick={() => handleMoveNote(s.id, f.id)}
                                >
                                  {f.name}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="note-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                Last edited {format(new Date(activeNote.updatedAt), 'MMM d, HH:mm')}
                <AnimatePresence>
                  {showSaved && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      style={{ fontSize: 11, color: 'var(--text-muted)' }}
                    >
                      ✓ Saved
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </div>
            
            <TipTapEditor content={localNoteBody} onChange={handleBodyChange} />
          </div>
        ) : (
          <div className="empty-state">
            <FileText size={40} style={{ opacity: 0.2 }} />
            <p className="text-muted">Select a note or create a new one</p>
          </div>
        )}
      </div>

      <style>{`
        .notes-view {
          display: flex;
          height: 100%;
          gap: 16px;
        }

        .notes-sidebar {
          width: 280px;
          display: flex;
          flex-direction: column;
          border-radius: 12px;
          padding: 16px;
          flex-shrink: 0;
        }

        .sidebar-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }

        .notes-search input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-subtle);
          padding: 8px 12px;
          border-radius: 8px;
          color: var(--text-primary);
          outline: none;
          margin-bottom: 16px;
          font-size: 13px;
        }
        .notes-search input::placeholder {
          color: var(--text-disabled);
        }

        .tree-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }

        .tree-subject, .tree-folder {
          display: flex;
          flex-direction: column;
          border-radius: 8px;
          transition: background-color 0.2s;
        }

        .drag-over {
          background-color: rgba(0, 212, 255, 0.05);
          box-shadow: inset 0 0 0 1px var(--accent-vivid);
        }

        .tree-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          cursor: pointer;
          border-radius: 6px;
          color: var(--text-muted);
          transition: background 0.2s, color 0.2s;
        }

        .tree-header:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .tree-label {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .subject-label {
          font-weight: 600;
          font-size: 14px;
        }

        .folder-label {
          font-weight: 500;
          font-size: 13px;
        }

        .note-label {
          font-size: 13px;
        }

        .tree-children {
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .icon-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, color 0.2s;
          padding: 2px;
          display: flex;
        }

        .tree-header:hover .icon-btn {
          opacity: 1;
        }
        
        .icon-btn:hover {
          color: var(--accent-vivid);
        }

        .tree-note {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          cursor: pointer;
          border-radius: 6px;
          color: var(--text-muted);
          transition: background 0.2s, color 0.2s;
        }

        .tree-note:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .tree-note.active {
          background: rgba(0, 212, 255, 0.1);
          color: var(--text-primary);
        }

        .notes-editor {
          flex: 1;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 24px;
          gap: 16px;
        }

        .editor-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .header-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .note-title-input {
          background: transparent;
          border: none;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
          outline: none;
          flex: 1;
        }
        
        .note-title-input::placeholder {
          color: var(--text-disabled);
        }

        .note-actions {
          position: relative;
        }

        .action-btn {
          opacity: 1;
          padding: 8px;
          color: var(--text-primary);
          background: var(--bg-hover);
        }

        .action-btn:hover {
          background: var(--bg-active);
        }

        .move-popover {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          width: 240px;
          border-radius: 12px;
          padding: 16px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        }

        .popover-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .popover-list {
          max-height: 300px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .popover-subject-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .popover-subject {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .popover-subject.selectable:hover {
          background: rgba(255,255,255,0.1);
        }

        .popover-subject.current {
          background: rgba(0, 212, 255, 0.1);
          color: var(--accent-vivid);
        }

        .popover-folder {
          font-size: 13px;
          padding: 6px 8px 6px 24px;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .popover-folder:hover {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
        }

        .popover-folder.current {
          background: rgba(0, 212, 255, 0.1);
          color: var(--accent-vivid);
        }

        .note-meta {
          font-size: 12px;
          color: var(--text-disabled);
        }
      `}</style>
    </div>
  );
}
