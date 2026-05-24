import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarToolbar({ title, view, onNavigate, onViewChange }) {
  return (
    <div className="calendar-toolbar">
      <div className="toolbar-left">
        <button className="toolbar-btn" onClick={() => onNavigate('PREV')}>
          <ChevronLeft size={20} />
        </button>
        <button className="toolbar-btn text-btn" onClick={() => onNavigate('TODAY')}>
          Today
        </button>
        <button className="toolbar-btn" onClick={() => onNavigate('NEXT')}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="toolbar-center">
        <h2 className="calendar-title">{title}</h2>
      </div>

      <div className="toolbar-right">
        <div className="segmented-control">
          <button 
            className={`segment ${view === 'dayGridMonth' ? 'active' : ''}`}
            onClick={() => onViewChange('dayGridMonth')}
          >
            Month
          </button>
          <button 
            className={`segment ${view === 'timeGridWeek' ? 'active' : ''}`}
            onClick={() => onViewChange('timeGridWeek')}
          >
            Week
          </button>
          <button 
            className={`segment ${view === 'timeGridDay' ? 'active' : ''}`}
            onClick={() => onViewChange('timeGridDay')}
          >
            Day
          </button>
        </div>
      </div>

      <style>{`
        .calendar-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 0 24px 0;
        }
        .toolbar-left, .toolbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }
        .toolbar-right {
          justify-content: flex-end;
        }
        .toolbar-center {
          flex: 2;
          text-align: center;
        }
        .calendar-title {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .toolbar-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          color: var(--text-muted);
          padding: 6px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }
        .toolbar-btn.text-btn {
          padding: 6px 12px;
          font-size: 14px;
          font-weight: 500;
        }
        .toolbar-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }
        .toolbar-btn:active {
          transform: scale(0.97);
        }
        .segmented-control {
          display: flex;
          background: var(--bg-card);
          border: 1px solid var(--border-glass);
          border-radius: 8px;
          padding: 4px;
        }
        .segment {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 6px;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }
        .segment:hover {
          color: var(--text-primary);
        }
        .segment.active {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}
