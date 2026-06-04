import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TopicChip from './TopicChip';
import { Plus, GripVertical, Trash2, Edit2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function SubjectCard({ subject }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id });
  const { updateSubject, deleteSubject, addTopic, updateTopic, deleteTopic, events } = useStore();
  
  const totalTopicsCount = subject.topics.length;
  
  const [isAddingTopic, setIsAddingTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editSubjectName, setEditSubjectName] = useState(subject.name);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const handleAddTopic = () => {
    if (newTopicName.trim()) {
      addTopic(subject.id, { id: `top-${Date.now()}`, name: newTopicName.trim() });
      setNewTopicName('');
    }
    setIsAddingTopic(false);
  };

  const handleSubjectSave = () => {
    if (editSubjectName.trim() && editSubjectName !== subject.name) {
      updateSubject(subject.id, { name: editSubjectName.trim() });
    } else {
      setEditSubjectName(subject.name);
    }
    setIsEditingSubject(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="subject-card card glass">
      <div className="subject-header">
        <div className="drag-handle" {...attributes} {...listeners}>
          <GripVertical size={18} />
        </div>
        
        <div className="subject-title-container">
          <div className="color-swatch" style={{ backgroundColor: subject.color }} />
          {isEditingSubject ? (
            <input 
              autoFocus
              className="subject-title-input"
              value={editSubjectName}
              onChange={e => setEditSubjectName(e.target.value)}
              onBlur={handleSubjectSave}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubjectSave();
                if (e.key === 'Escape') {
                  setEditSubjectName(subject.name);
                  setIsEditingSubject(false);
                }
              }}
            />
          ) : (
            <h3 className="subject-title" onClick={() => setIsEditingSubject(true)}>
              {subject.name}
            </h3>
          )}
        </div>


        
        <div className="subject-actions">
          <button className="icon-btn danger" onClick={() => {
            if (window.confirm(`Delete subject "${subject.name}"?`)) {
              deleteSubject(subject.id);
            }
          }}>
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="topics-container">
        {subject.topics.map(topic => (
          <TopicChip 
            key={topic.id} 
            topic={topic} 
            subjectId={subject.id}
            color={subject.color}
            updateTopic={updateTopic}
            deleteTopic={deleteTopic}
          />
        ))}
        
        {isAddingTopic ? (
          <div className="topic-chip editing" style={{ borderColor: subject.color }}>
            <input
              autoFocus
              className="topic-input"
              value={newTopicName}
              onChange={e => setNewTopicName(e.target.value)}
              onBlur={handleAddTopic}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddTopic();
                if (e.key === 'Escape') setIsAddingTopic(false);
              }}
              placeholder="Topic name"
            />
          </div>
        ) : (
          <button className="add-topic-btn" onClick={() => setIsAddingTopic(true)}>
            <Plus size={14} /> Add Topic
          </button>
        )}
      </div>

      <style>{`
        .subject-card {
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }
        .subject-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .drag-handle {
          color: var(--text-disabled);
          cursor: grab;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .drag-handle:active {
          cursor: grabbing;
        }
        .subject-title-container {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .color-swatch {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .subject-title {
          font-size: 16px;
          font-weight: 600;
          cursor: text;
        }
        .subject-title-input {
          background: rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.2);
          color: var(--text-primary);
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 16px;
          font-weight: 600;
          width: 100%;
          outline: none;
        }
        .subject-actions {
          opacity: 0;
          transition: opacity 200ms var(--ease-standard);
        }
        .subject-card:hover .subject-actions {
          opacity: 1;
        }
        .icon-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          display: flex;
          transition: all 200ms var(--ease-standard);
        }
        .icon-btn:hover {
          background: var(--glass-bg);
          color: var(--text-primary);
        }
        .icon-btn.danger:hover {
          background: rgba(255, 77, 77, 0.1);
          color: #ff4d4d;
        }
        .topics-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .add-topic-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: transparent;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 4px 10px;
          font-size: 13px;
          color: var(--text-muted);
          cursor: pointer;
          transition: var(--transition-all-standard);
        }
        .add-topic-btn:hover {
          border-color: rgba(255, 255, 255, 0.4);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}
