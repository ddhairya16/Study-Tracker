import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KeyboardShortcutsModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl+1', action: 'Dashboard' },
    { key: 'Ctrl+2', action: 'Calendar' },
    { key: 'Ctrl+3', action: 'Timer' },
    { key: 'Ctrl+4', action: 'Statistics' },
    { key: 'Ctrl+5', action: 'Curriculum' },
    { key: 'Ctrl+6', action: 'Notes' },
    { key: 'Ctrl+7', action: 'Library (PDF)' },
    { key: 'Space', action: 'Start / Pause timer' },
    { key: 'Ctrl+R', action: 'Reset timer' },
    { key: 'Ctrl+B', action: 'Toggle sidebar' },
    { key: 'Ctrl+F', action: 'Search in PDF' },
    { key: 'Escape', action: 'Close panel or modal' },
    { key: '?', action: 'Show this help menu' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        className="modal-content glass"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="shortcuts-header">
          <h3>Keyboard Shortcuts</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="shortcuts-grid">
          {shortcuts.map((s, i) => (
            <div key={i} className="shortcut-row">
              <span className="shortcut-action">{s.action}</span>
              <kbd className="shortcut-key">{s.key}</kbd>
            </div>
          ))}
        </div>
      </motion.div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }

        .modal-content {
          width: 100%;
          padding: 32px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .shortcuts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .shortcuts-header h3 {
          margin: 0;
          font-size: 20px;
          color: var(--text-primary);
        }

        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 24px;
          cursor: pointer;
        }
        .close-btn:hover {
          color: var(--text-primary);
        }

        .shortcuts-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .shortcut-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-subtle);
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
        }

        .shortcut-action {
          color: var(--text-primary);
          font-size: 14px;
          font-weight: 500;
        }

        .shortcut-key {
          background: var(--bg-card);
          color: var(--accent-vivid);
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 12px;
          border: 1px solid var(--border-subtle);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
