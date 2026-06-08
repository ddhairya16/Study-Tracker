import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Edit2, Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import ProgressRing from './ProgressRing';
import ErrorBoundary from './ErrorBoundary';
import { format } from 'date-fns';
import { getFileHandle } from '../../lib/fileHandleStore';
import { openPdfFromFile } from '../../lib/pdfLoader';
import PDFViewer from '../Library/PDFViewer';

const MODES = {
  POMODORO: 'Pomodoro',
  COUNTDOWN: 'Countdown',
  STOPWATCH: 'Stopwatch'
};

export default function TimerView() {
  const { subjects, settings, pdfs, updatePdf, timerSession, setTimerSession, addSession } = useStore();
  
  const { 
    isRunning, mode, timeLeft, totalDuration, sessionType, pomodoroCount, 
    subjectId, topicId, loggedStopwatchMs 
  } = timerSession;

  const [displayedMode, setDisplayedMode] = useState(mode);
  const [showMs, setShowMs] = useState(false);
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);
  const [countdownInput, setCountdownInput] = useState('');

  // Focus Session Split View
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);
  const [focusPdfId, setFocusPdfId] = useState('');
  const [focusPdfDoc, setFocusPdfDoc] = useState(null);
  const [splitPercent, setSplitPercent] = useState(30);
  const [selectedTimerMode, setSelectedTimerMode] = useState(null);
  const [countdownMinutes, setCountdownMinutes] = useState(30);

  // Sync displayed mode to active timer if navigating back
  useEffect(() => {
    if (isRunning) {
      setDisplayedMode(mode);
    }
  }, [isRunning, mode]);

  const handleModeTabClick = (newMode) => {
    setDisplayedMode(newMode);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const formatStopwatch = (ms) => {
    if (Number.isNaN(ms) || ms == null || ms < 0) ms = 0;
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60).toString().padStart(2, '0');
    const s = (totalSecs % 60).toString().padStart(2, '0');
    if (!showMs) return `${m}:${s}`;
    const cs = Math.floor((ms % 1000) / 10).toString().padStart(2, '0');
    return (
      <div className="stopwatch-multiline">
        <div>{m}:{s}</div>
        <div className="ms-text">.{cs}</div>
      </div>
    );
  };

  const commitCountdownEdit = () => {
    setIsEditingCountdown(false);
    const parts = countdownInput.split(':');
    let mins = 0, secs = 0;
    if (parts.length === 2) {
      mins = parseInt(parts[0], 10) || 0;
      secs = parseInt(parts[1], 10) || 0;
    } else {
      mins = parseInt(countdownInput, 10) || 0;
    }
    mins = Math.min(Math.max(mins, 0), 999);
    secs = Math.min(Math.max(secs, 0), 59);
    const total = mins * 60 + secs;
    if (total > 0) {
      setTimerSession({
        timeLeft: total,
        totalDuration: total
      });
    }
  };

  const startFocusSession = async () => {
    if (focusPdfId) {
      try {
        const handle = await getFileHandle(focusPdfId);
        if (handle) {
          let perm = await handle.queryPermission({ mode: 'read' });
          if (perm === 'prompt') perm = await handle.requestPermission({ mode: 'read' });
          if (perm === 'granted') {
            const file = await handle.getFile();
            const { doc } = await openPdfFromFile(file);
            setFocusPdfDoc(doc);
          }
        }
      } catch (err) {
        console.warn("Failed to load PDF for focus session", err);
      }
    }
    setIsFocusModalOpen(false);
    setIsFocusSessionActive(true);
    if (isRunning && mode !== selectedTimerMode) {
      if (!window.confirm("A timer is already running. Stop it and start a new Focus Session?")) {
        return;
      }
    }
    setDisplayedMode(selectedTimerMode);
    
    let duration = 0;
    if (selectedTimerMode === MODES.POMODORO) duration = settings.focusDuration * 60;
    else if (selectedTimerMode === MODES.COUNTDOWN) duration = countdownMinutes * 60;
    
    setTimerSession({
      mode: selectedTimerMode,
      isRunning: true,
      lastTickAt: Date.now(),
      timeLeft: duration,
      totalDuration: duration,
      sessionType: 'focus'
    });
  };

  const endFocusSession = () => {
    setIsFocusSessionActive(false);
    setFocusPdfDoc(null);
    setTimerSession({ isRunning: false });
  };

  // Determine what to show. If displayedMode !== mode, show a reset/inactive view for that mode.
  const isViewingActiveMode = displayedMode === mode;
  const displayTimeLeft = isViewingActiveMode ? timeLeft : (displayedMode === MODES.COUNTDOWN ? 10 * 60 : (displayedMode === MODES.POMODORO ? settings.focusDuration * 60 : 0));
  const displayTotal = isViewingActiveMode ? totalDuration : displayTimeLeft;
  const progress = displayedMode === MODES.STOPWATCH ? 1 : (displayTotal > 0 ? displayTimeLeft / displayTotal : 0);
  
  const currentSubject = subjects.find(s => s.id === subjectId);
  const availableTopics = currentSubject ? currentSubject.topics : [];
  const ringColor = (displayedMode === MODES.POMODORO && sessionType !== 'focus' && isViewingActiveMode) ? '#4caf7d' : 'var(--accent-vivid)';
  const activePdfMeta = pdfs.find(p => p.id === focusPdfId);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    const handleMouseMove = (moveEvent) => {
      const newPercent = (moveEvent.clientX / window.innerWidth) * 100;
      setSplitPercent(Math.min(Math.max(newPercent, 20), 80));
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  }, []);

  const toggleTimer = () => {
    if (isRunning) {
      if (!isViewingActiveMode) {
        if (window.confirm("A timer is already running. Stop it and start a new one?")) {
          setTimerSession({
            mode: displayedMode,
            isRunning: true,
            timeLeft: displayTimeLeft,
            totalDuration: displayTotal,
            sessionType: displayedMode === MODES.POMODORO ? 'focus' : 'focus',
            lastTickAt: Date.now()
          });
        }
      } else {
        // Just pause current
        setTimerSession({ isRunning: false });
        if (mode === MODES.STOPWATCH && subjectId && topicId) {
          const unloggedMs = timeLeft - loggedStopwatchMs;
          if (unloggedMs >= 1000) {
            addSession({
              date: format(new Date(), 'yyyy-MM-dd'),
              subjectId, topicId,
              duration: Math.floor(unloggedMs / 1000),
              mode: 'stopwatch'
            });
            setTimerSession({ loggedStopwatchMs: timeLeft });
          }
        }
      }
    } else {
      // Starting from stopped
      if (!isViewingActiveMode) {
        setTimerSession({
          mode: displayedMode,
          isRunning: true,
          timeLeft: displayTimeLeft,
          totalDuration: displayTotal,
          sessionType: displayedMode === MODES.POMODORO ? 'focus' : 'focus',
          lastTickAt: Date.now()
        });
      } else {
        setTimerSession({ isRunning: true, lastTickAt: Date.now() });
      }
    }
  };

  const resetTimer = () => {
    if (isRunning && !isViewingActiveMode) {
      if (!window.confirm("A timer is already running. Stop it and reset this one?")) return;
    }
    setTimerSession({ isRunning: false, mode: displayedMode });
    if (displayedMode === MODES.POMODORO) {
      let duration = settings.focusDuration * 60;
      if (sessionType === 'shortBreak' && isViewingActiveMode) duration = settings.shortBreakDuration * 60;
      else if (sessionType === 'longBreak' && isViewingActiveMode) duration = settings.longBreakDuration * 60;
      setTimerSession({ timeLeft: duration, totalDuration: duration });
    } else if (displayedMode === MODES.COUNTDOWN) {
      setTimerSession({ timeLeft: displayTotal });
    } else {
      setTimerSession({ timeLeft: 0, loggedStopwatchMs: 0 });
    }
  };

  const TimerContent = (
    <div style={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 28,
        padding: '32px 0',
        width: '100%',
        maxWidth: 520,
      }}>
        <div style={{ position: 'relative', display: 'inline-flex', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 999, padding: 3, marginBottom: 24 }}>
        <motion.div
          layout
          layoutId="timer-mode-pill"
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          style={{
            position: 'absolute',
            top: 3,
            left: `calc(${Object.values(MODES).indexOf(displayedMode)} * (100% / 3) + 3px)`,
            width: 'calc(100% / 3 - 6px)',
            height: 'calc(100% - 6px)',
            background: 'rgba(255,255,255,0.13)',
            borderRadius: 999,
          }}
        />
        {Object.values(MODES).map(m => (
          <button 
            key={m} 
            onClick={() => handleModeTabClick(m)}
            style={{
              position: 'relative',
              zIndex: 1,
              height: 32,
              padding: '0 20px',
              border: 'none',
              background: 'transparent',
              color: displayedMode === m ? '#fff' : 'rgba(255,255,255,0.45)',
              fontWeight: displayedMode === m ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              borderRadius: 999,
              transition: 'color 200ms',
              whiteSpace: 'nowrap',
            }}
          >
            {m}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={displayedMode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="timer-main"
        >
        <ProgressRing radius={isFocusSessionActive ? 120 : 170} stroke={8} progress={progress} color={ringColor}>
          {displayedMode === MODES.STOPWATCH ? (
            <div className="time-display">{formatStopwatch(displayTimeLeft)}</div>
          ) : isEditingCountdown ? (
            <input 
              autoFocus
              className="time-input"
              value={countdownInput}
              onChange={(e) => setCountdownInput(e.target.value)}
              onBlur={commitCountdownEdit}
              onKeyDown={(e) => e.key === 'Enter' && commitCountdownEdit()}
              placeholder="MM:SS"
            />
          ) : (
            <div 
              className={`time-display ${displayedMode === MODES.COUNTDOWN && (!isRunning || !isViewingActiveMode) ? 'editable' : ''}`}
              onClick={() => {
                if (displayedMode === MODES.COUNTDOWN && (!isRunning || !isViewingActiveMode)) {
                  setCountdownInput(formatTime(displayTimeLeft));
                  setIsEditingCountdown(true);
                }
              }}
            >
              {formatTime(displayTimeLeft)}
            </div>
          )}

          {displayedMode === MODES.COUNTDOWN && (!isRunning || !isViewingActiveMode) && !isEditingCountdown && (
            <div className="edit-hint"><Edit2 size={12} /> Click to set time</div>
          )}
          
          {displayedMode === MODES.STOPWATCH && (
            <div className="ms-toggle-wrapper">
              <label className="ms-toggle">
                <input type="checkbox" checked={showMs} onChange={(e) => setShowMs(e.target.checked)} />
                <span className="slider"></span>
              </label>
              <span className="ms-label">Show ms</span>
            </div>
          )}

          {displayedMode === MODES.POMODORO && (
            <div className="pomodoro-indicator">
              {isViewingActiveMode ? (sessionType === 'focus' ? 'Focus' : sessionType === 'shortBreak' ? 'Short Break' : 'Long Break') : 'Focus'}
            </div>
          )}
        </ProgressRing>

        <div className="controls">
          <button className="control-btn" onClick={toggleTimer}>
            {isRunning && isViewingActiveMode ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button className="control-btn secondary" onClick={resetTimer}>
            <RotateCcw size={24} />
          </button>
        </div>
        
        {displayedMode === MODES.POMODORO && (
          <div className="pomodoro-count">🍅 x {isViewingActiveMode ? pomodoroCount : 0}</div>
        )}
        </motion.div>
      </AnimatePresence>

      <div className="session-context glass">
        <select value={subjectId} onChange={(e) => {
          setTimerSession({ subjectId: e.target.value, topicId: '' });
        }} className="context-select">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        
        <select value={topicId} onChange={(e) => setTimerSession({ topicId: e.target.value })} disabled={!subjectId} className="context-select">
          <option value="">Select Topic</option>
          {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!isFocusSessionActive ? (
        <button className="btn-primary focus-btn" onClick={() => setIsFocusModalOpen(true)}>
          <Zap size={16} /> Start Focus Session
        </button>
      ) : (
        <button className="btn-ghost focus-btn" onClick={endFocusSession} style={{ marginTop: 16 }}>
          End Focus Session
        </button>
      )}
      </div>
    </div>
  );

  return (
    <ErrorBoundary>
      {isFocusSessionActive ? (
        <div style={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
          <div style={{ width: `${splitPercent}%`, height: '100%', overflowY: 'auto', borderRight: '1px solid var(--border-subtle)' }}>
            {TimerContent}
          </div>
          <div 
            onMouseDown={handleMouseDown}
            style={{ width: '4px', cursor: 'col-resize', background: 'var(--border-subtle)', flexShrink: 0, zIndex: 10 }}
          />
          <div style={{ width: `calc(${100 - splitPercent}% - 4px)`, height: '100%', position: 'relative' }}>
            {focusPdfDoc ? (
              <PDFViewer 
                doc={focusPdfDoc} 
                pdf={activePdfMeta} 
                onClose={(page) => {
                  updatePdf(focusPdfId, { lastPage: page });
                  setFocusPdfDoc(null);
                }} 
              />
            ) : (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'var(--text-muted)' }}>
                No PDF Selected
              </div>
            )}
          </div>
        </div>
      ) : TimerContent}

      {isFocusModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content card">
            <div className="modal-header">
              <h2 className="text-xl">Start Focus Session</h2>
              <button className="icon-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setIsFocusModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Subject</label>
                <select className="form-input" value={subjectId} onChange={e => setTimerSession({ subjectId: e.target.value, topicId: '' })}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label>Topic</label>
                <select className="form-input" value={topicId} onChange={e => setTimerSession({ topicId: e.target.value })} disabled={!subjectId}>
                  <option value="">Select Topic</option>
                  {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label>Reference PDF (Optional)</label>
                <select className="form-input" value={focusPdfId} onChange={e => setFocusPdfId(e.target.value)}>
                  <option value="">None</option>
                  {pdfs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              
              <div>
                <label>Timer mode</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { value: 'Pomodoro', label: '🍅 Pomodoro', desc: '25 min focus' },
                    { value: 'Countdown', label: '⏳ Countdown', desc: 'Custom duration' },
                    { value: 'Stopwatch', label: '⏱ Stopwatch', desc: 'Open-ended' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTimerMode(option.value)}
                      style={{
                        flex: 1,
                        padding: '10px 8px',
                        borderRadius: 8,
                        border: selectedTimerMode === option.value
                          ? '2px solid var(--accent-vivid)'
                          : '1px solid var(--border-subtle)',
                        background: selectedTimerMode === option.value
                          ? 'rgba(0,212,255,0.08)'
                          : 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 150ms',
                      }}
                    >
                      <div style={{ fontSize: 16, marginBottom: 4 }}>{option.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{option.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedTimerMode === 'Countdown' && (
                <div>
                  <label>Duration</label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      className="form-input"
                      min={1} max={999}
                      value={countdownMinutes}
                      onChange={e => setCountdownMinutes(Number(e.target.value))}
                      style={{ width: 80 }}
                    />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>minutes</span>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-ghost" onClick={() => setIsFocusModalOpen(false)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={startFocusSession} 
                disabled={!subjectId || !topicId || !selectedTimerMode}
                style={{ opacity: (!subjectId || !topicId || !selectedTimerMode) ? 0.4 : 1 }}
              >
                Begin Session
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .timer-view {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          padding: 32px;
          box-sizing: border-box;
          overflow-y: auto;
        }
        .timer-view.break-mode {
          background-color: rgba(39, 201, 63, 0.05);
          border-radius: 20px;
        }
        .timer-view.in-split {
          gap: 24px;
        }

        .mode-selector {
          display: inline-flex;
          align-items: center;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 999px;
          padding: 3px;
          gap: 2px;
        }

        .mode-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          padding: 0 16px;
          border-radius: 999px;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.5);
          font-size: 14px;
          font-weight: 500;
          line-height: 1;
          cursor: pointer;
          transition: background 150ms, color 150ms;
          white-space: nowrap;
        }

        .mode-btn:hover:not(.active) {
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.05);
        }

        .mode-btn.active {
          background: rgba(255,255,255,0.12);
          color: #ffffff;
        }

        .timer-main {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .time-display {
          font-family: "SF Mono", "JetBrains Mono", monospace;
          font-size: 48px;
          font-weight: 700;
          letter-spacing: -2px;
          color: var(--text-primary);
          line-height: 1;
          transition: color 0.2s;
          text-align: center;
          width: 100%;
        }
        
        .time-display.editable {
          cursor: pointer;
        }
        
        .time-display.editable:hover {
          color: var(--accent-vivid);
        }
        
        .stopwatch-multiline {
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
        }
        
        .ms-text {
          font-size: 0.55em;
          opacity: 0.8;
          margin-top: 4px;
        }

        .time-input {
          font-family: "SF Mono", "JetBrains Mono", monospace;
          font-size: 48px;
          font-weight: 700;
          letter-spacing: -2px;
          color: var(--text-primary);
          line-height: 1;
          background: transparent;
          border: none;
          width: 100%;
          text-align: center;
          outline: none;
          border-bottom: 2px solid var(--accent-vivid);
        }

        .edit-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 8px;
        }
        
        .pomodoro-indicator {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .ms-toggle-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 12px;
        }

        .ms-label {
          font-size: 12px;
          color: var(--text-muted);
        }

        .ms-toggle {
          position: relative;
          display: inline-block;
          width: 32px;
          height: 18px;
        }

        .ms-toggle input { opacity: 0; width: 0; height: 0; }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(255, 255, 255, 0.1);
          transition: .4s;
          border-radius: 18px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px; width: 14px;
          left: 2px; bottom: 2px;
          background-color: var(--text-muted);
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .slider { background-color: var(--accent-vivid); }
        input:checked + .slider:before { transform: translateX(14px); background-color: var(--bg-base); }

        .controls {
          display: flex;
          align-items: center;
          gap: 24px;
        }
        .control-btn {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: transform 200ms var(--ease-spring), opacity 200ms var(--ease-standard);
        }
        .control-btn:hover { opacity: 0.9; transform: scale(1.05); }
        .control-btn:active { transform: scale(0.95); }
        .control-btn.secondary {
          width: 48px; height: 48px;
          background: var(--bg-card);
          color: var(--text-primary);
          border: var(--border-glass);
        }

        .pomodoro-count {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .session-context {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 24px;
          border-radius: 16px;
          width: 100%;
          max-width: 320px;
        }
        
        .timer-view:not(.in-split) .session-context {
          flex-direction: row;
          max-width: 500px;
        }

        .context-select {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 16px;
          outline: none;
          cursor: pointer;
          width: 100%;
        }
        .context-select option {
          background: var(--bg-panel);
          color: var(--text-primary);
        }

        .focus-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          font-size: 14px;
        }

        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          width: 400px;
          padding: 24px;
          border-radius: 16px;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px;
        }
        .form-input {
          width: 100%;
          padding: 10px 12px;
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          color: var(--text-primary);
          margin-top: 6px;
        }
      `}</style>
    </ErrorBoundary>
  );
}
