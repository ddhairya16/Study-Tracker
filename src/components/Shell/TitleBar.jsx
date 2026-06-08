import React from 'react';
import { Minus, Square, X } from 'lucide-react';

export default function TitleBar() {
  return (
    <div style={styles.titleBar}>
      <div style={styles.title}>StudyTracker</div>
      <div style={styles.windowControls}>
        <button style={styles.controlBtn} className="win-btn" onClick={() => window.electronAPI?.minimize()}>
          <Minus size={16} />
        </button>
        <button style={styles.controlBtn} className="win-btn" onClick={() => window.electronAPI?.maximize()}>
          <Square size={14} />
        </button>
        <button style={{...styles.controlBtn}} className="win-btn close-btn" onClick={() => window.electronAPI?.close()}>
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
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    background: 'var(--bg-panel)',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
    WebkitAppRegion: 'drag',
    userSelect: 'none',
  },
  title: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
    pointerEvents: 'none',
  },
  windowControls: {
    position: 'absolute',
    right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    WebkitAppRegion: 'no-drag',
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
