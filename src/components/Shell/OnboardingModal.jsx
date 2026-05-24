import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { BookOpen, Clock, Home, Activity } from 'lucide-react';

const PRESET_COLORS = [
  '#e8f4ff', '#00d4ff', '#4caf7d', '#ffeb3b', '#ff9800', '#f44336', '#9c27b0', '#ff4081'
];

export default function OnboardingModal({ onComplete }) {
  const { profile, updateProfile, addSubject, updateSettings, settings } = useStore();
  const [step, setStep] = useState(1);
  
  // Step 1 State
  const [name, setName] = useState(profile.name === 'Student' ? '' : profile.name);
  
  // Step 2 State
  const [subjectName, setSubjectName] = useState('');
  const [subjectColor, setSubjectColor] = useState(PRESET_COLORS[1]);
  const [topicName, setTopicName] = useState('');
  const [subjectsAdded, setSubjectsAdded] = useState(0);

  // Step 3 State (goal) is handled directly to store via setDailyGoal

  const handleNext = () => {
    if (step === 1) {
      updateProfile({ name: name.trim() || 'Student' });
      setStep(2);
    } else if (step === 2) {
      if (subjectsAdded === 0 && !subjectName.trim()) {
        alert("Please add at least one subject.");
        return;
      }
      if (subjectName.trim()) {
        handleAddSubject();
      }
      setStep(3);
    } else if (step === 3) {
      if (!settings.dailyGoalMinutes) {
        updateSettings({ dailyGoalMinutes: 120 });
      }
      setStep(4);
    } else if (step === 4) {
      onComplete();
    }
  };

  const handleSkip = () => {
    setStep(4);
  };

  const handleAddSubject = () => {
    if (!subjectName.trim()) return;
    const newSubj = {
      id: `subj-${Date.now()}`,
      name: subjectName.trim(),
      color: subjectColor,
      topics: topicName.trim() ? [{ id: `top-${Date.now()}`, name: topicName.trim() }] : []
    };
    addSubject(newSubj);
    setSubjectsAdded(prev => prev + 1);
    setSubjectName('');
    setTopicName('');
  };

  const setDailyGoal = (mins) => {
    updateSettings({ dailyGoalMinutes: mins });
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div key="step1" className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="ob-icon-wrapper">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="var(--accent-vivid)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
              </svg>
            </div>
            <h2>Welcome to StudyTracker 📚</h2>
            <p className="ob-subtitle">Your personal study workspace. Let's get you set up in 3 quick steps.</p>
            
            <div className="ob-input-group mt-6">
              <label>What's your name?</label>
              <input 
                type="text" 
                className="ob-input" 
                placeholder="e.g. Alex" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
              />
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div key="step2" className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2>What are you studying?</h2>
            <p className="ob-subtitle">Add your first subject to organize your sessions.</p>
            
            <div className="ob-form-card glass">
              <input 
                type="text" 
                className="ob-input mb-4" 
                placeholder="e.g. Mathematics" 
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                autoFocus
              />
              
              <div className="color-picker-row mb-4">
                {PRESET_COLORS.map(c => (
                  <button 
                    key={c}
                    className={`ob-color-swatch ${subjectColor === c ? 'selected' : ''}`}
                    style={{ background: c }}
                    onClick={() => setSubjectColor(c)}
                  />
                ))}
              </div>

              <input 
                type="text" 
                className="ob-input ob-input-small mb-4" 
                placeholder="Add Topic (optional) e.g. Calculus" 
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
              />

              <button className="ob-ghost-btn w-full" onClick={handleAddSubject}>
                {subjectsAdded > 0 ? 'Add Another Subject' : '+ Add Subject'}
              </button>
            </div>
            
            {subjectsAdded > 0 && <p className="ob-success-text">{subjectsAdded} subject(s) added successfully.</p>}
          </motion.div>
        );
      case 3:
        return (
          <motion.div key="step3" className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2>How long do you want to study each day?</h2>
            <p className="ob-subtitle">We'll track your progress against this goal in Statistics.</p>
            
            <div className="ob-pill-group">
              {[60, 120, 180, 240].map(mins => (
                <button 
                  key={mins}
                  className={`ob-pill ${settings.dailyGoalMinutes === mins ? 'active' : ''}`}
                  onClick={() => setDailyGoal(mins)}
                >
                  {mins / 60}h
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div key="step4" className="onboarding-step" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2>You're all set, {profile.name !== 'Student' ? profile.name : 'there'}! 🎉</h2>
            <p className="ob-subtitle mb-6">Here is what you can do with StudyTracker:</p>
            
            <div className="ob-feature-list">
              <div className="ob-feature-item">
                <div className="ob-feature-icon"><Home size={20} /></div>
                <div className="ob-feature-text">
                  <strong>Dashboard</strong>
                  <span>Track daily goals and upcoming events</span>
                </div>
              </div>
              <div className="ob-feature-item">
                <div className="ob-feature-icon"><Clock size={20} /></div>
                <div className="ob-feature-text">
                  <strong>Timer</strong>
                  <span>Pomodoro and Stopwatch modes</span>
                </div>
              </div>
              <div className="ob-feature-item">
                <div className="ob-feature-icon"><BookOpen size={20} /></div>
                <div className="ob-feature-text">
                  <strong>Library</strong>
                  <span>Read and annotate your PDFs directly</span>
                </div>
              </div>
            </div>
          </motion.div>
        );
      default: return null;
    }
  };

  return (
    <div className="ob-overlay">
      <div className="ob-card glass">
        {step < 4 && <button className="ob-skip-btn" onClick={handleSkip}>Skip setup</button>}
        
        <div className="ob-content">
          <AnimatePresence mode="wait">
            {renderStep()}
          </AnimatePresence>
        </div>

        <div className="ob-footer">
          <div className="ob-dots">
            {[1, 2, 3, 4].map(i => (
              <span key={i} className={`ob-dot ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`} />
            ))}
          </div>
          
          <div className="ob-actions">
            {step > 1 && step < 4 && <button className="ob-ghost-btn" onClick={() => setStep(step - 1)}>Back</button>}
            <button className="ob-primary-btn" onClick={handleNext}>
              {step === 4 ? 'Start Studying' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .ob-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .ob-card {
          width: 520px;
          min-height: 480px;
          border-radius: 24px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: 0 24px 64px rgba(0,0,0,0.8);
        }

        .ob-skip-btn {
          position: absolute;
          top: 24px;
          right: 24px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 14px;
          cursor: pointer;
        }
        .ob-skip-btn:hover { color: var(--text-primary); text-decoration: underline; }

        .ob-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .onboarding-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .ob-icon-wrapper {
          margin-bottom: 24px;
        }

        .onboarding-step h2 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          color: var(--text-primary);
        }

        .ob-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .ob-input-group {
          width: 100%;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ob-input-group label {
          font-size: 14px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .ob-input {
          width: 100%;
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 16px;
          border-radius: 12px;
          font-size: 18px;
          outline: none;
          transition: border-color 0.2s;
        }

        .ob-input:focus {
          border-color: var(--accent-vivid);
        }

        .ob-input-small {
          padding: 12px;
          font-size: 15px;
        }

        .mt-6 { margin-top: 24px; }
        .mb-4 { margin-bottom: 16px; }
        .mb-6 { margin-bottom: 24px; }
        .w-full { width: 100%; }

        .ob-form-card {
          width: 100%;
          padding: 24px;
          border-radius: 16px;
          text-align: left;
        }

        .color-picker-row {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        .ob-color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
        }
        .ob-color-swatch.selected {
          border-color: var(--text-primary);
          transform: scale(1.1);
          box-shadow: 0 0 12px currentColor;
        }

        .ob-ghost-btn {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
        }
        .ob-ghost-btn:hover { background: var(--bg-hover); }

        .ob-success-text {
          color: #4caf7d;
          font-size: 14px;
          margin-top: 16px;
        }

        .ob-pill-group {
          display: flex;
          gap: 12px;
        }

        .ob-pill {
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          padding: 12px 24px;
          border-radius: 24px;
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .ob-pill.active {
          background: var(--accent-vivid);
          color: #000;
          border-color: var(--accent-vivid);
        }

        .ob-feature-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ob-feature-item {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--bg-subtle);
          padding: 16px;
          border-radius: 12px;
          text-align: left;
        }

        .ob-feature-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(0, 212, 255, 0.1);
          color: var(--accent-vivid);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ob-feature-text {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .ob-feature-text strong { font-size: 16px; }
        .ob-feature-text span { font-size: 14px; color: var(--text-muted); }

        .ob-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ob-dots {
          display: flex;
          gap: 8px;
        }

        .ob-dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: var(--border-subtle);
          transition: all 0.3s;
        }
        .ob-dot.active { width: 24px; background: var(--accent-vivid); }
        .ob-dot.done { background: var(--accent-vivid); opacity: 0.5; }

        .ob-actions {
          display: flex;
          gap: 12px;
        }

        .ob-primary-btn {
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
        }
        .ob-primary-btn:hover { opacity: 0.9; }
      `}</style>
    </div>
  );
}
