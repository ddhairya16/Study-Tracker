import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

export default function TopicChip({ topic, subjectId, updateTopic, deleteTopic, color }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(topic.name);

  const handleSave = () => {
    if (editValue.trim() && editValue !== topic.name) {
      updateTopic(subjectId, topic.id, editValue.trim());
    } else {
      setEditValue(topic.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditValue(topic.name);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="topic-chip editing" style={{ borderColor: color }}>
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="topic-input"
        />
        <button onMouseDown={e => e.preventDefault()} onClick={handleSave} className="topic-action-btn" style={{ color }}>
          <Check size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="topic-chip" onClick={() => setIsEditing(true)}>
      <span className="topic-name">{topic.name}</span>
      <button 
        className="topic-action-btn delete-btn" 
        onClick={(e) => {
          e.stopPropagation();
          deleteTopic(subjectId, topic.id);
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        .topic-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 4px 8px 4px 12px;
          font-size: 13px;
          color: var(--text-primary);
          cursor: pointer;
          transition: var(--transition-all-standard);
        }
        .topic-chip:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        .topic-chip.editing {
          padding: 2px 6px 2px 10px;
          background: var(--bg-base);
        }
        .topic-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          width: 80px;
        }
        .topic-action-btn {
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          padding: 2px;
          border-radius: 50%;
          transition: background 200ms var(--ease-standard), color 200ms var(--ease-standard);
        }
        .topic-action-btn.delete-btn:hover {
          background: rgba(255, 77, 77, 0.2);
          color: #ff4d4d;
        }
      `}</style>
    </div>
  );
}
