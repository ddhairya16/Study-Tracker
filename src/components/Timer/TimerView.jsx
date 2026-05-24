import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Edit2, Zap, X } from 'lucide-react';
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
  const { subjects, addSession, settings, pdfs, updatePdf } = useStore();
  
  const [mode, setMode] = useState(MODES.POMODORO);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [initialTime, setInitialTime] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroState, setPomodoroState] = useState('focus'); // focus, shortBreak, longBreak
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Stopwatch state
  const [elapsedMs, setElapsedMs] = useState(0);
  const [loggedStopwatchMs, setLoggedStopwatchMs] = useState(0);
  const [showMs, setShowMs] = useState(false);
  const startTimeRef = useRef(null);

  // Countdown editing
  const [isEditingCountdown, setIsEditingCountdown] = useState(false);
  const [countdownInput, setCountdownInput] = useState('');

  // Focus Session Split View
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isFocusSessionActive, setIsFocusSessionActive] = useState(false);
  const [focusPdfId, setFocusPdfId] = useState('');
  const [focusPdfDoc, setFocusPdfDoc] = useState(null);
  const [splitPercent, setSplitPercent] = useState(30);

  const audioCtxRef = useRef(null);
  const intervalRef = useRef(null);

  const playTempleBell = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    const now = ctx.currentTime;
    const fundamental = ctx.createOscillator();
    const fundamentalGain = ctx.createGain();
    fundamental.type = 'sine';
    fundamental.frequency.setValueAtTime(110, now);
    fundamental.frequency.exponentialRampToValueAtTime(100, now + 0.05);
    fundamentalGain.gain.setValueAtTime(0, now);
    fundamentalGain.gain.linearRampToValueAtTime(0.7, now + 0.01);
    fundamentalGain.gain.exponentialRampToValueAtTime(0.001, now + 6);
    fundamental.connect(fundamentalGain);
    fundamentalGain.connect(ctx.destination);
    fundamental.start(now);
    fundamental.stop(now + 6);

    const partial2 = ctx.createOscillator();
    const partial2Gain = ctx.createGain();
    partial2.type = 'sine';
    partial2.frequency.setValueAtTime(275, now);
    partial2Gain.gain.setValueAtTime(0, now);
    partial2Gain.gain.linearRampToValueAtTime(0.4, now + 0.01);
    partial2Gain.gain.exponentialRampToValueAtTime(0.001, now + 4);
    partial2.connect(partial2Gain);
    partial2Gain.connect(ctx.destination);
    partial2.start(now);
    partial2.stop(now + 4);

    const partial3 = ctx.createOscillator();
    const partial3Gain = ctx.createGain();
    partial3.type = 'sine';
    partial3.frequency.setValueAtTime(550, now);
    partial3Gain.gain.setValueAtTime(0, now);
    partial3Gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    partial3Gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
    partial3.connect(partial3Gain);
    partial3Gain.connect(ctx.destination);
    partial3.start(now);
    partial3.stop(now + 2.5);

    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    noiseSource.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSource.start(now);
  };

  const handleSessionCompleteRef = useRef();
  useEffect(() => {
    handleSessionCompleteRef.current = handleSessionComplete;
  });

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning) {
      if (mode === MODES.STOPWATCH) {
        intervalRef.current = setInterval(() => {
          setElapsedMs(Date.now() - startTimeRef.current);
        }, showMs ? 10 : 1000);
      } else {
        intervalRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              setIsRunning(false);
              if (handleSessionCompleteRef.current) handleSessionCompleteRef.current();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, mode, showMs]);

  const handleSessionComplete = () => {
    playTempleBell();
    if (subjectId && topicId && (mode === MODES.POMODORO || mode === MODES.COUNTDOWN)) {
      addSession({
        date: format(new Date(), 'yyyy-MM-dd'),
        subjectId,
        topicId,
        duration: initialTime,
        mode
      });
    }

    if (mode === MODES.POMODORO) {
      if (pomodoroState === 'focus') {
        const newCount = pomodoroCount + 1;
        setPomodoroCount(newCount);
        if (newCount % 4 === 0) {
          setPomodoroState('longBreak');
          setTimeLeft(settings.longBreakDuration * 60);
          setInitialTime(settings.longBreakDuration * 60);
        } else {
          setPomodoroState('shortBreak');
          setTimeLeft(settings.shortBreakDuration * 60);
          setInitialTime(settings.shortBreakDuration * 60);
        }
      } else {
        setPomodoroState('focus');
        setTimeLeft(settings.focusDuration * 60);
        setInitialTime(settings.focusDuration * 60);
      }
      setIsRunning(true);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setIsRunning(false);
    if (newMode === MODES.POMODORO) {
      setTimeLeft(settings.focusDuration * 60);
      setInitialTime(settings.focusDuration * 60);
      setPomodoroState('focus');
    } else if (newMode === MODES.COUNTDOWN) {
      setTimeLeft(10 * 60);
      setInitialTime(10 * 60);
    } else {
      setElapsedMs(0);
    }
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
      setTimeLeft(total);
      setInitialTime(total);
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
    setMode(MODES.POMODORO);
    setIsRunning(true);
  };

  const endFocusSession = () => {
    setIsFocusSessionActive(false);
    setFocusPdfDoc(null);
    setIsRunning(false);
  };

  const progress = mode === MODES.STOPWATCH ? 1 : (initialTime > 0 ? timeLeft / initialTime : 0);
  const currentSubject = subjects.find(s => s.id === subjectId);
  const availableTopics = currentSubject ? currentSubject.topics : [];
  const ringColor = (mode === MODES.POMODORO && pomodoroState !== 'focus') ? '#4caf7d' : 'var(--accent-vivid)';
  const activePdfMeta = pdfs.find(p => p.id === focusPdfId);

  // Handle Divider Drag
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

  const TimerContent = (
    <div className={`timer-view ${pomodoroState !== 'focus' && mode === MODES.POMODORO ? 'break-mode' : ''} ${isFocusSessionActive ? 'in-split' : ''}`}>
      <div className="mode-selector">
        {Object.values(MODES).map(m => (
          <button 
            key={m} 
            className={`mode-btn ${mode === m ? 'active' : ''}`}
            onClick={() => handleModeChange(m)}
          >
            {m}
          </button>
        ))}
      </div>

      <div className="timer-main">
        <ProgressRing radius={isFocusSessionActive ? 120 : 170} stroke={8} progress={progress} color={ringColor}>
          {mode === MODES.STOPWATCH ? (
            <div className="time-display">{formatStopwatch(elapsedMs)}</div>
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
              className={`time-display ${mode === MODES.COUNTDOWN && !isRunning ? 'editable' : ''}`}
              onClick={() => {
                if (mode === MODES.COUNTDOWN && !isRunning) {
                  setCountdownInput(formatTime(timeLeft));
                  setIsEditingCountdown(true);
                }
              }}
            >
              {formatTime(timeLeft)}
            </div>
          )}

          {mode === MODES.COUNTDOWN && !isRunning && !isEditingCountdown && (
            <div className="edit-hint"><Edit2 size={12} /> Click to set time</div>
          )}
          
          {mode === MODES.STOPWATCH && (
            <div className="ms-toggle-wrapper">
              <label className="ms-toggle">
                <input type="checkbox" checked={showMs} onChange={(e) => setShowMs(e.target.checked)} />
                <span className="slider"></span>
              </label>
              <span className="ms-label">Show ms</span>
            </div>
          )}

          {mode === MODES.POMODORO && (
            <div className="pomodoro-indicator">
              {pomodoroState === 'focus' ? 'Focus' : pomodoroState === 'shortBreak' ? 'Short Break' : 'Long Break'}
            </div>
          )}
        </ProgressRing>

        <div className="controls">
          <button className="control-btn" onClick={() => {
            if (isRunning) {
              setIsRunning(false);
              if (mode === MODES.STOPWATCH && subjectId && topicId) {
                const unloggedMs = elapsedMs - loggedStopwatchMs;
                if (unloggedMs >= 1000) {
                  addSession({
                    date: format(new Date(), 'yyyy-MM-dd'),
                    subjectId, topicId,
                    duration: Math.floor(unloggedMs / 1000),
                    mode: 'stopwatch'
                  });
                  setLoggedStopwatchMs(elapsedMs);
                }
              }
            } else {
              if (mode === MODES.STOPWATCH) startTimeRef.current = Date.now() - elapsedMs;
              setIsRunning(true);
            }
          }}>
            {isRunning ? <Pause size={32} /> : <Play size={32} />}
          </button>
          <button className="control-btn secondary" onClick={() => {
            setIsRunning(false);
            if (mode === MODES.POMODORO && pomodoroState === 'focus') setTimeLeft(settings.focusDuration * 60);
            else if (mode === MODES.POMODORO && pomodoroState === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
            else if (mode === MODES.POMODORO && pomodoroState === 'longBreak') setTimeLeft(settings.longBreakDuration * 60);
            else if (mode === MODES.COUNTDOWN) setTimeLeft(initialTime);
            else { setElapsedMs(0); setLoggedStopwatchMs(0); }
          }}>
            <RotateCcw size={24} />
          </button>
        </div>
        
        {mode === MODES.POMODORO && (
          <div className="pomodoro-count">🍅 x {pomodoroCount}</div>
        )}
      </div>

      <div className="session-context glass">
        <select value={subjectId} onChange={(e) => {
          setSubjectId(e.target.value);
          setTopicId('');
        }} className="context-select">
          <option value="">Select Subject</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        
        <select value={topicId} onChange={(e) => setTopicId(e.target.value)} disabled={!subjectId} className="context-select">
          <option value="">Select Topic</option>
          {availableTopics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {!isFocusSessionActive ? (
        <button className="primary-btn focus-btn" onClick={() => setIsFocusModalOpen(true)}>
          <Zap size={16} /> Start Focus Session
        </button>
      ) : (
        <button className="cancel-btn focus-btn" onClick={endFocusSession} style={{ marginTop: 16 }}>
          End Focus Session
        </button>
      )}
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
          <div className="modal-content glass">
            <div className="modal-header">
              <h2>Start Focus Session</h2>
              <button className="icon-btn" onClick={() => setIsFocusModalOpen(false)}><X size={20}/></button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label>Subject</label>
                <select className="form-input" value={subjectId} onChange={e => { setSubjectId(e.target.value); setTopicId(''); }}>
                  <option value="">Select Subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label>Topic</label>
                <select className="form-input" value={topicId} onChange={e => setTopicId(e.target.value)} disabled={!subjectId}>
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
            </div>
            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="cancel-btn" onClick={() => setIsFocusModalOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={startFocusSession} disabled={!subjectId || !topicId}>Begin Session</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .timer-view {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 40px;
          transition: background-color 1s ease;
          padding: 24px;
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
          font-size: clamp(36px, 12vw, 76px);
          font-weight: 500;
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
          font-size: clamp(36px, 12vw, 76px);
          font-weight: 500;
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
          font-size: 14px;
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
          font-size: 16px;
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
