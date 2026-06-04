import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { PenLine } from 'lucide-react';
import '@excalidraw/excalidraw/index.css';

const STORAGE_KEY = 'studytracker_v1_whiteboard_';

function BoardItemInline({ board, isActive, onSelect, onRename, onDelete }) {
  return (
    <div 
      className={`board-item ${isActive ? 'active' : ''}`} 
      onClick={onSelect}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
        background: isActive ? 'var(--bg-hover)' : 'transparent',
        borderRadius: 6,
        cursor: 'pointer'
      }}
    >
      <span style={{ fontSize: 13, color: isActive ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: isActive ? 500 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {board.name}
      </span>
      <div className="wb-actions" onClick={e => e.stopPropagation()}>
         <button onClick={() => {
            const newName = prompt("Rename whiteboard:", board.name);
            if (newName) onRename(newName);
         }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}>
           ✏️
         </button>
         <button onClick={() => {
            if(confirm("Delete this whiteboard?")) onDelete();
         }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 2, marginLeft: 4 }}>
           🗑️
         </button>
      </div>
      <style>{`
        .wb-actions { opacity: 0; transition: opacity 150ms; display: flex; }
        .board-item:hover .wb-actions { opacity: 1; }
      `}</style>
    </div>
  );
}

export default function WhiteboardView() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [boards, setBoards] = useState(() => {
    try { return JSON.parse(localStorage.getItem('studytracker_v1_boards') || '[]'); }
    catch { return []; }
  });
  const [activeBoardId, setActiveBoardId] = useState(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    if (boards.length > 0 && !activeBoardId) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards]);

  useEffect(() => {
    if (!excalidrawAPI || !activeBoardId) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY + activeBoardId);
      if (saved) {
        const { elements, appState } = JSON.parse(saved);
        excalidrawAPI.updateScene({
          elements: elements ?? [],
          appState: { ...(appState ?? {}), collaborators: new Map() },
        });
      } else {
        // New empty board
        excalidrawAPI.updateScene({ elements: [] });
      }
    } catch (e) {
      excalidrawAPI.updateScene({ elements: [] });
    }
  }, [activeBoardId, excalidrawAPI]);

  const handleChange = useCallback((elements, appState) => {
    if (!activeBoardId) return;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY + activeBoardId, JSON.stringify({ elements, appState }));
    }, 800);
  }, [activeBoardId]);

  async function switchBoard(newBoardId) {
    clearTimeout(saveTimerRef.current);
    
    if (activeBoardId && excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      localStorage.setItem(
        STORAGE_KEY + activeBoardId,
        JSON.stringify({ elements, appState })
      );
    }
    
    setActiveBoardId(newBoardId);
  }

  function createBoard() {
    const name = `Board ${boards.length + 1}`;
    const id = crypto.randomUUID();
    const newBoards = [...boards, { id, name, createdAt: new Date().toISOString() }];
    setBoards(newBoards);
    localStorage.setItem('studytracker_v1_boards', JSON.stringify(newBoards));
    switchBoard(id);
  }

  function deleteBoard(id) {
    const remaining = boards.filter(b => b.id !== id);
    setBoards(remaining);
    localStorage.setItem('studytracker_v1_boards', JSON.stringify(remaining));
    localStorage.removeItem(STORAGE_KEY + id);
    if (activeBoardId === id) {
      setActiveBoardId(remaining[0]?.id ?? null);
    }
  }

  function renameBoard(id, name) {
    const updated = boards.map(b => b.id === id ? { ...b, name } : b);
    setBoards(updated);
    localStorage.setItem('studytracker_v1_boards', JSON.stringify(updated));
  }

  return (
    <div className="whiteboard-view" style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <div className="whiteboard-sidebar" style={{ width: 200, flexShrink: 0, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
        <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Whiteboards</span>
          <button onClick={createBoard} style={{ background: 'var(--accent-vivid)', border: 'none', borderRadius: 6, color: '#000', padding: '3px 8px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+</button>
        </div>
        <div className="whiteboard-board-list" style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {boards.map(board => (
            <BoardItemInline
              key={board.id}
              board={board}
              isActive={board.id === activeBoardId}
              onSelect={() => switchBoard(board.id)}
              onRename={(name) => renameBoard(board.id, name)}
              onDelete={() => deleteBoard(board.id)}
            />
          ))}
          {boards.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 20 }}>
              No boards yet.
              <br />
              <button onClick={createBoard} className="btn-ghost" style={{ marginTop: 8 }}>Create one</button>
            </div>
          )}
        </div>
      </div>

      <div className="whiteboard-canvas" style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0, height: '100%' }}>
        {activeBoardId ? (
          <Excalidraw
            excalidrawAPI={(api) => setExcalidrawAPI(api)}
            onChange={handleChange}
            theme="dark"
            key={activeBoardId}
          />
        ) : (
          <div className="empty-state">
            <PenLine size={40} style={{ opacity: 0.2 }} />
            <h3 className="text-md">Select or create a whiteboard</h3>
            <p className="text-sm text-muted">Use whiteboards for sketching and mindmaps.</p>
            <button onClick={createBoard} className="btn-primary" style={{ marginTop: 8 }}>New Whiteboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
