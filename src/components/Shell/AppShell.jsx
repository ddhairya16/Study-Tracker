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
import OnboardingModal from './OnboardingModal';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';
import { useStore } from '../../store/useStore';

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
  const { settings, profile, subjects, sessions, events, showToast } = useStore();
  const notifiedEvents = React.useRef(new Set());

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
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
        }

        .main-content {
          flex: 1;
          position: relative;
          background-color: var(--bg-base);
          overflow-y: auto;
          overflow-x: hidden;
        }

        .view-wrapper {
          position: absolute;
          inset: 0;
          padding: 32px;
          height: 100%;
          box-sizing: border-box;
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>
    </div>
  );
}
