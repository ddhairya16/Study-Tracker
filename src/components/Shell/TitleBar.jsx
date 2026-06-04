import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  return (
    <div style={styles.titleBar}>
      <div style={styles.title}>StudyTracker</div>
      <div style={styles.windowControls}>
        <button style={styles.controlBtn} className="win-btn">
          <Minus size={16} />
        </button>
        <button style={styles.controlBtn} className="win-btn">
          <Square size={14} />
        </button>
        <button style={{...styles.controlBtn}} className="win-btn close-btn">
          <X size={16} />
        </button>
      </div>

      <style>{`
        .win-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          transition: background-color 200ms var(--ease-standard), color 200ms var(--ease-standard);
        }
        .win-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        .win-btn.close-btn:hover {
          background-color: #e74c3c;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
}

const styles = {
  titleBar: {
    height: '40px',
    backgroundColor: 'var(--bg-panel)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 0 0 16px',
    WebkitAppRegion: 'drag',
    userSelect: 'none',
    position: 'relative'
  },
  title: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-muted)',
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)'
  },
  windowControls: {
    display: 'flex',
    height: '100%',
    WebkitAppRegion: 'no-drag',
    marginLeft: 'auto'
  },
  controlBtn: {
    width: '46px',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  }
};
