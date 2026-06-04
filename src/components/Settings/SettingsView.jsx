import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const PRESET_COLORS = [
  '#e8f4ff', // Default Ice Blue
  '#00d4ff', // Vivid Blue
  '#4caf7d', // Mint Green
  '#ffeb3b', // Bright Yellow
  '#ff9800', // Orange
  '#f44336', // Red
  '#9c27b0', // Purple
  '#ff4081'  // Pink
];

export default function SettingsView() {
  const store = useStore();
  const { settings, updateSettings, clearData } = store;
  const [showClearModal, setShowClearModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState(null);

  const handleTimerChange = (field, value) => {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      updateSettings({ [field]: num });
    }
  };

  const confirmClearData = () => {
    clearData();
    setShowClearModal(false);
  };

  const exportJSON = () => {
    const dataToExport = {
      subjects: store.subjects,
      events: store.events,
      sessions: store.sessions,
      profile: store.profile,
      settings: store.settings,
      notes: store.notes,
      noteFolders: store.noteFolders,
      pdfs: store.pdfs || []
    };
    const jsonStr = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studytracker-export-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    let csv = 'Date,Subject,Topic,Duration (minutes),Mode\n';
    store.sessions.forEach(s => {
      const subject = store.subjects.find(sub => sub.id === s.subjectId)?.name || 'Unknown';
      const topic = store.subjects.find(sub => sub.id === s.subjectId)?.topics.find(t => t.id === s.topicId)?.name || 'Unknown';
      const durationMins = Math.floor(s.duration / 60);
      csv += `${s.date},"${subject}","${topic}",${durationMins},${s.mode}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studytracker-sessions-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.subjects && json.sessions) {
          setImportData(json);
          setShowImportModal(true);
        } else {
          alert('Invalid file format. Missing required fields.');
        }
      } catch (err) {
        alert('Error parsing JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const confirmImport = () => {
    if (importData) {
      useStore.setState((state) => ({
        ...state,
        subjects: importData.subjects || state.subjects,
        events: importData.events || state.events,
        sessions: importData.sessions || state.sessions,
        profile: importData.profile || state.profile,
        settings: importData.settings || state.settings,
        notes: importData.notes || state.notes,
        noteFolders: importData.noteFolders || state.noteFolders,
        pdfs: importData.pdfs || state.pdfs
      }));
    }
    setShowImportModal(false);
    setImportData(null);
  };

  return (
    <div className="settings-view">
      <div className="settings-section glass">
        <h2>Appearance</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Theme</label>
            <div className="segmented-control">
              {['dark', 'light', 'system'].map(theme => (
                <button
                  key={theme}
                  className={`seg-btn ${settings.theme === theme || (!settings.theme && theme === 'dark') ? 'active' : ''}`}
                  onClick={() => updateSettings({ theme })}
                >
                  {theme.charAt(0).toUpperCase() + theme.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="setting-item">
            <label>Date Format</label>
            <div className="segmented-control">
              {['MM/DD/YYYY', 'DD/MM/YYYY'].map(fmt => (
                <button
                  key={fmt}
                  className={`seg-btn ${settings.dateFormat === fmt || (!settings.dateFormat && fmt === 'MM/DD/YYYY') ? 'active' : ''}`}
                  onClick={() => updateSettings({ dateFormat: fmt })}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section glass">
        <h2>Timer Defaults (minutes)</h2>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Pomodoro Focus</label>
            <input 
              type="number" 
              value={settings.focusDuration} 
              onChange={(e) => handleTimerChange('focusDuration', e.target.value)}
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>Short Break</label>
            <input 
              type="number" 
              value={settings.shortBreakDuration} 
              onChange={(e) => handleTimerChange('shortBreakDuration', e.target.value)}
              className="setting-input"
            />
          </div>
          <div className="setting-item">
            <label>Long Break</label>
            <input 
              type="number" 
              value={settings.longBreakDuration} 
              onChange={(e) => handleTimerChange('longBreakDuration', e.target.value)}
              className="setting-input"
            />
          </div>
        </div>
      </div>

      <div className="settings-section glass">
        <h2>Theme Accent</h2>
        <div className="color-swatches">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              className={`color-swatch ${settings.themeAccent === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => updateSettings({ themeAccent: color })}
            />
          ))}
        </div>
      </div>

      <div className="settings-section glass">
        <h2>Data Management</h2>
        <div className="data-actions">
          <button className="ghost-btn" onClick={exportJSON}>Export as JSON</button>
          <button className="ghost-btn" onClick={exportCSV}>Export as CSV</button>
          <label className="ghost-btn file-upload-btn">
            Import JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div className="settings-section glass danger-zone">
        <h2>Danger Zone</h2>
        <p>This will permanently delete all subjects, events, notes, and sessions. This action cannot be undone.</p>
        <button className="danger-btn" onClick={() => setShowClearModal(true)}>
          Clear All Data
        </button>
      </div>

      <AnimatePresence>
        {showClearModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Are you absolutely sure?</h3>
              <p>This will wipe all data from your local storage. You cannot recover it.</p>
              <div className="modal-actions">
                <button className="ghost-btn" onClick={() => setShowClearModal(false)}>Cancel</button>
                <button className="danger-btn" onClick={confirmClearData}>Yes, clear everything</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportModal && (
          <div className="modal-overlay">
            <motion.div 
              className="modal-content glass"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <h3>Import Data</h3>
              <p>This will merge imported data with your existing data. Continue?</p>
              <div className="modal-actions">
                <button className="ghost-btn" onClick={() => setShowImportModal(false)}>Cancel</button>
                <button className="primary-btn" onClick={confirmImport}>Yes, import data</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .settings-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
          max-width: 800px;
          margin: 0 auto;
        }

        .settings-section {
          padding: 32px;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        h2 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .setting-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .setting-item label {
          font-size: 14px;
          color: var(--text-muted);
        }

        .setting-input {
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .setting-input:focus {
          border-color: var(--accent-vivid);
        }

        .color-swatches {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .color-swatch {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .color-swatch:hover {
          transform: scale(1.1);
        }

        .color-swatch.selected {
          border-color: var(--text-primary);
          transform: scale(1.1);
          box-shadow: 0 0 12px currentColor;
        }

        .danger-zone h2 {
          color: #e74c3c;
        }

        .danger-zone p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .danger-btn {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
          border: 1px solid rgba(231, 76, 60, 0.2);
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          align-self: flex-start;
          transition: all 0.2s;
        }

        .danger-btn:hover {
          background: rgba(231, 76, 60, 0.2);
          border-color: rgba(231, 76, 60, 0.4);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          width: 100%;
          max-width: 400px;
          padding: 32px;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-content h3 {
          margin: 0;
          font-size: 20px;
          color: var(--text-primary);
        }

        .modal-content p {
          margin: 0;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 16px;
        }

        .ghost-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .ghost-btn:hover {
          background: var(--bg-hover);
        }

        .primary-btn {
          background: var(--accent-vivid);
          color: #000;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
        }

        .data-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .file-upload-btn {
          display: inline-block;
          text-align: center;
        }

        .segmented-control {
          display: flex;
          gap: 8px;
          background: var(--bg-subtle);
          padding: 4px;
          border-radius: 12px;
          width: fit-content;
        }

        .seg-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }

        .seg-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}
