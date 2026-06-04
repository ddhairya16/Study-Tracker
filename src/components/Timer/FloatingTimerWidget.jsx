import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function FloatingTimerWidget({ onNavigateToTimer, currentView }) {
  const { timerSession, setTimerSession } = useStore();
  const { isRunning, timeLeft, totalDuration, mode, sessionType } = timerSession;
  
  const [dismissed, setDismissed] = useState(false);
  
  // Reset dismissed state when timer starts a new session (detected by duration changes or becoming active)
  React.useEffect(() => {
    if (isRunning) {
      setDismissed(false);
    }
  }, [isRunning, totalDuration]);

  // Only show when timer is running, user is not on Timer view, and not dismissed
  const shouldShow = isRunning && currentView !== 'timer' && !dismissed;
  
  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const progress = totalDuration > 0 ? timeLeft / totalDuration : 1; // 0 to 1
  
  const circumference = 2 * Math.PI * 18; // radius 18
  const strokeDashoffset = circumference * progress;

  const toggleTimer = () => {
    setTimerSession({ isRunning: !isRunning, lastTickAt: Date.now() });
  };
  
  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9000,
            cursor: 'grab',
            userSelect: 'none',
          }}
          whileDrag={{ cursor: 'grabbing', scale: 1.02 }}
        >
          <div
            style={{
              background: 'rgba(15,15,15,0.92)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 16,
              backdropFilter: 'blur(24px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              minWidth: 180,
              position: 'relative'
            }}
          >
            <button
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setDismissed(true); }}
              style={{
                position: 'absolute', top: 6, right: 6,
                width: 16, height: 16,
                background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                fontSize: 12, lineHeight: 1,
                borderRadius: 4,
              }}
            >×</button>
            {/* Mini progress ring */}
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                {/* Progress */}
                <circle
                  cx="22" cy="22" r="18"
                  fill="none"
                  stroke={sessionType === 'focus' ? 'var(--accent-vivid)' : '#4caf7d'}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              {/* Mode icon in center */}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14,
              }}>
                {mode === 'Stopwatch' ? '⏱' : mode === 'Countdown' ? '⏳' : '🍅'}
              </div>
            </div>
            
            {/* Time + label */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                fontSize: 22,
                fontWeight: 700,
                color: '#fff',
                lineHeight: 1,
                letterSpacing: '-0.5px',
              }}>
                {mode === 'Stopwatch' ? (
                  <>
                    {Math.floor(Math.floor(timeLeft / 1000) / 60).toString().padStart(2, '0')}:
                    {(Math.floor(timeLeft / 1000) % 60).toString().padStart(2, '0')}
                  </>
                ) : (
                  <>{minutes}:{seconds}</>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {mode === 'Pomodoro' ? (sessionType === 'focus' ? 'Focus' : 'Break') : mode}
              </div>
            </div>
            
            {/* Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
              {/* Pause/Resume */}
              <button
                onPointerDown={e => e.stopPropagation()} // prevent drag
                onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                style={{
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 150ms',
                }}
              >
                {isRunning ? <Pause size={12} /> : <Play size={12} />}
              </button>
              {/* Go to timer */}
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onNavigateToTimer(); }}
                style={{
                  width: 28, height: 28,
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 150ms',
                }}
                title="Go to Timer"
              >
                <Maximize2 size={10} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
