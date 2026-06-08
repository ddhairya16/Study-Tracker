import React, { useState } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import { AnimatePresence, motion } from 'framer-motion';

import Dashboard from '../Dashboard/Dashboard';
import CalendarView from '../Calendar/CalendarView';
import TimerView from '../Timer/TimerView';
import StatisticsView from '../Statistics/StatisticsView';
import CurriculumView from '../Curriculum/CurriculumView';
import NotesView from '../Notes/NotesView';
import ProfileView from '../Profile/ProfileView';
import SettingsView from '../Settings/SettingsView';
import LibraryView from '../Library/LibraryView';
import WhiteboardView from '../Whiteboard/WhiteboardView';
import OnboardingModal from './OnboardingModal';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useStore } from '../../store/useStore';
import FloatingTimerWidget from '../Timer/FloatingTimerWidget';
import { format } from 'date-fns';

function ToastContainer() {
  const { toasts, removeToast } = useStore();
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div 
            key={t.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`toast-item ${t.type}`}
            style={{ '--toast-duration': `${t.duration || 3000}ms` }}
            onClick={() => removeToast(t.id)}
          >
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
      <style>{`
        .toast-container {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 999999;
          display: flex;
          flex-direction: column;
          gap: 8px;
          pointer-events: none;
        }
        .toast-item {
          pointer-events: auto;
          padding: 12px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          background: rgba(20, 20, 20, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          backdrop-filter: blur(16px);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }
        .toast-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          height: 2px;
          background: var(--accent-vivid);
          animation: toast-progress var(--toast-duration, 3s) linear forwards;
          width: 100%;
        }
        @keyframes toast-progress {
          from { transform: scaleX(1); transform-origin: left; }
          to { transform: scaleX(0); transform-origin: left; }
        }
        .toast-item.info { border-left: 4px solid var(--accent-vivid); }
        .toast-item.success { border-left: 4px solid #22c55e; }
        .toast-item.error { border-left: 4px solid #ef4444; }
      `}</style>
    </div>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red' }}>
          <h2>Something went wrong.</h2>
          <pre>{this.state.error?.toString()}</pre>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { settings, profile, subjects, sessions, events, showToast, timerSession, setTimerSession, tickTimer, tickStopwatch, addSession } = useStore();
  const notifiedEvents = React.useRef(new Set());
  const audioCtxRef = React.useRef(null);
  
  const playTempleBell = React.useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
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
  }, []);

  // Global Timer Effect
  React.useEffect(() => {
    let intervalId;
    if (timerSession.isRunning) {
      if (timerSession.mode === 'Stopwatch') {
        // Stopwatch increases time in ms
        intervalId = setInterval(() => {
          tickStopwatch();
        }, 100);
      } else {
        // Pomodoro / Countdown decreases time
        intervalId = setInterval(() => {
          tickTimer();
          
          // Check for completion inside effect using current store state
          const currentStore = useStore.getState();
          const currentTimer = currentStore.timerSession;
          
          if (currentTimer.timeLeft <= 0 && currentTimer.isRunning) {
            playTempleBell();
            
            // Log session if it was a valid work interval
            if (currentTimer.subjectId && currentTimer.topicId && 
                (currentTimer.mode === 'Countdown' || (currentTimer.mode === 'Pomodoro' && currentTimer.sessionType === 'focus'))) {
              addSession({
                date: format(new Date(), 'yyyy-MM-dd'),
                subjectId: currentTimer.subjectId,
                topicId: currentTimer.topicId,
                duration: currentTimer.totalDuration,
                mode: currentTimer.mode
              });
            }
            
            if (currentTimer.mode === 'Pomodoro') {
              if (currentTimer.sessionType === 'focus') {
                const newCount = currentTimer.pomodoroCount + 1;
                const isLongBreak = newCount % 4 === 0;
                setTimerSession({
                  sessionType: isLongBreak ? 'longBreak' : 'shortBreak',
                  timeLeft: (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60,
                  totalDuration: (isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration) * 60,
                  pomodoroCount: newCount,
                  lastTickAt: Date.now()
                });
                showToast(isLongBreak ? "Time for a long break!" : "Time for a short break!", 'info');
              } else {
                setTimerSession({
                  sessionType: 'focus',
                  timeLeft: settings.focusDuration * 60,
                  totalDuration: settings.focusDuration * 60,
                  lastTickAt: Date.now()
                });
                showToast("Break is over. Back to focus!", 'info');
              }
            } else {
              // Countdown completed, just stop
              setTimerSession({ isRunning: false, timeLeft: 0 });
              showToast("Timer complete!", 'success');
            }
          }
        }, 1000);
      }
    }
    
    return () => clearInterval(intervalId);
  }, [timerSession.isRunning, timerSession.mode, tickTimer, tickStopwatch, addSession, playTempleBell, settings, showToast, setTimerSession]);

  const showOnboarding = !profile.hasCompletedOnboarding && profile.name === 'Student' && subjects.length <= 2 && sessions.length === 0;

  React.useEffect(() => {
    document.documentElement.style.setProperty('--accent-vivid', settings.themeAccent);
  }, [settings.themeAccent]);

  // Event reminders polling
  React.useEffect(() => {
    const check = () => {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60 * 1000); // next 30 mins
      const upcoming = events.filter(e => {
        const start = new Date(e.start);
        return start > now && start <= soon && !e.completed && !notifiedEvents.current.has(e.id);
      });
      upcoming.forEach(e => {
        showToast(`📅 Starting soon: ${e.title}`, 'info', 8000);
        notifiedEvents.current.add(e.id);
      });
    };
    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [events, showToast]);

  React.useEffect(() => {
    const applyTheme = (themeSetting) => {
      if (themeSetting === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else if (themeSetting === 'dark') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        // System
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.removeAttribute('data-theme');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      }
    };

    applyTheme(settings.theme || 'dark');

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (!settings.theme || settings.theme === 'system') {
        applyTheme('system');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.theme]);

  React.useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      // Ignore if user is typing in an input
      const active = document.activeElement;
      if (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable) {
        if (e.key === 'Escape') {
          active.blur();
        }
        return;
      }

      if (e.key === '?') {
        setShowShortcuts(true);
        return;
      }

      if (e.key === 'Escape') {
        setShowShortcuts(false);
      }

      if (e.ctrlKey) {
        switch (e.key) {
          case '1': e.preventDefault(); setCurrentView('dashboard'); break;
          case '2': e.preventDefault(); setCurrentView('calendar'); break;
          case '3': e.preventDefault(); setCurrentView('timer'); break;
          case '4': e.preventDefault(); setCurrentView('statistics'); break;
          case '5': e.preventDefault(); setCurrentView('curriculum'); break;
          case '6': e.preventDefault(); setCurrentView('notes'); break;
          case '7': e.preventDefault(); setCurrentView('library'); break;
          case '8': e.preventDefault(); setCurrentView('whiteboard'); break;
          case 'b': 
          case 'B': e.preventDefault(); setCollapsed(prev => !prev); break;
          case 'f':
          case 'F': 
            e.preventDefault();
            // Optional: trigger search if in library view
            break;
          default: break;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard setCurrentView={setCurrentView} />;
      case 'calendar': return <CalendarView />;
      case 'timer': return <TimerView />;
      case 'statistics': return <StatisticsView />;
      case 'curriculum': return <CurriculumView />;
      case 'library': return <LibraryView />;
      case 'whiteboard': return <ErrorBoundary><WhiteboardView /></ErrorBoundary>;
      case 'notes': return <ErrorBoundary><NotesView /></ErrorBoundary>;
      case 'profile': return <ProfileView />;
      case 'settings': return <SettingsView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <div className="app-window glass">
        <TitleBar />
        <div className="app-body">
          <Sidebar 
            collapsed={collapsed} 
            setCollapsed={setCollapsed} 
            currentView={currentView}
            setCurrentView={setCurrentView}
          />
          <main className="main-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, filter: 'blur(4px)', scale: 0.99 }}
                animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, filter: 'blur(4px)', scale: 0.99 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ width: '100%', height: '100%' }}
                className="view-wrapper"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>

      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      
      {showOnboarding && (
        <OnboardingModal onComplete={() => useStore.getState().updateProfile({ hasCompletedOnboarding: true })} />
      )}

      <FloatingTimerWidget onNavigateToTimer={() => setCurrentView('timer')} currentView={currentView} />

      <ToastContainer />

      <style>{`
        .app-container {
          height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        
        .app-window {
          width: 100%;
          height: 100%;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .app-body {
          display: flex;
          flex: 1;
          overflow: hidden;
          min-width: 0;
          min-height: 0;
        }

        .main-content {
          flex: 1;
          position: relative;
          background-color: var(--bg-base);
          overflow: hidden;
          min-width: 0;
        }

        .view-wrapper {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          overflow-x: hidden;
          box-sizing: border-box;
          min-width: 0;
        }
      `}</style>
    </div>
  );
}
