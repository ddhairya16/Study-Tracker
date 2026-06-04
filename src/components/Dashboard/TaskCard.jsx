import React from 'react';
import { useStore } from '../../store/useStore';
import { CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

export default function TaskCard({ event }) {
  const { subjects, toggleEventCompletion } = useStore();
  
  const subject = subjects.find(s => s.id === event.subjectId);
  const topic = subject?.topics.find(t => t.id === event.topicId);
  
  const startTime = new Date(event.start);
  const endTime = new Date(event.end);
  const timeString = `${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`;

  return (
    <div className={`task-card card glass ${event.completed ? 'completed' : ''}`}>
      <button 
        className="checkbox-btn" 
        onClick={() => toggleEventCompletion(event.id)}
      >
        {event.completed ? (
          <CheckCircle2 size={24} className="checked" />
        ) : (
          <Circle size={24} className="unchecked" />
        )}
      </button>

      <div className="task-content">
        <div className="task-header">
          <div className="task-subject">
            <div className="color-dot" style={{ backgroundColor: event.color }} />
            <span>{subject?.name || 'Unknown Subject'}</span>
          </div>
          <div className="task-time">{timeString}</div>
        </div>
        <div className="task-title">
          {event.title}
        </div>
      </div>

      <style>{`
        .task-card {
          padding: 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 300ms var(--ease-spring);
        }
        .task-card.completed {
          opacity: 0.5;
        }
        .task-card.completed .task-title {
          text-decoration: line-through;
          color: var(--text-muted);
        }
        
        .checkbox-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 200ms var(--ease-standard), transform 200ms var(--ease-spring);
        }
        .checkbox-btn:hover {
          color: var(--text-primary);
          transform: scale(1.1);
        }
        .checkbox-btn .checked {
          color: var(--accent-vivid);
        }

        .task-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .task-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .task-subject {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .task-time {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-disabled);
          font-family: "SF Mono", "JetBrains Mono", monospace;
        }
        .task-title {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          transition: color 200ms var(--ease-standard);
        }
      `}</style>
    </div>
  );
}
