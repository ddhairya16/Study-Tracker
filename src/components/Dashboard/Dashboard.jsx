import React from 'react';
import { useStore } from '../../store/useStore';
import { format, isToday, isFuture, differenceInCalendarDays } from 'date-fns';
import StatCard from './StatCard';
import TaskCard from './TaskCard';
import { CheckSquare, Clock, Activity, Flame, Pencil, Plus, Minus, FileText, FileBox } from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import EventPanel from '../Calendar/EventPanel';

export default function Dashboard({ setCurrentView }) {
  const { events, sessions, profile, settings, updateSettings, recentItems, setActivePdfId } = useStore();
  const [isEditingGoal, setIsEditingGoal] = React.useState(false);
  const [editGoalValue, setEditGoalValue] = React.useState(settings.dailyGoalMinutes / 60 || 2);
  const [isEventPanelOpen, setIsEventPanelOpen] = React.useState(false);
  
  const today = new Date();
  const dateString = format(today, 'EEEE, MMMM d');

  const todayEvents = events.filter(e => isToday(new Date(e.start)));
  const upcomingEvents = events
    .filter(e => !e.completed && new Date(e.start) > new Date())
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, 5);

  const upcomingExams = events
    .filter(e => e.isExam && !e.completed)
    .map(e => {
      const daysUntil = differenceInCalendarDays(new Date(e.start), today);
      return { ...e, daysUntil };
    })
    .filter(e => e.daysUntil >= 0 && e.daysUntil <= (e.examVisibilityMonths || 1) * 30)
    .sort((a, b) => a.daysUntil - b.daysUntil);
  
  // Group today's events
  const morningTasks = [];
  const afternoonTasks = [];
  const eveningTasks = [];

  todayEvents.forEach(e => {
    const hour = new Date(e.start).getHours();
    if (hour < 12) morningTasks.push(e);
    else if (hour < 17) afternoonTasks.push(e);
    else eveningTasks.push(e);
  });

  const sortByCompletion = (a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    return new Date(a.start) - new Date(b.start);
  };

  morningTasks.sort(sortByCompletion);
  afternoonTasks.sort(sortByCompletion);
  eveningTasks.sort(sortByCompletion);

  // Stats calculation
  const completedToday = todayEvents.filter(e => e.completed).length;
  
  // Calculate study hours this week
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const totalSeconds = recentSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const studyHoursThisWeek = (totalSeconds / 3600).toFixed(1);

  // Daily goal calculation
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  });
  const todayMinutes = Math.floor(todaySessions.reduce((acc, s) => acc + s.duration, 0) / 60);
  const goalMinutes = settings.dailyGoalMinutes || 120;
  const goalProgress = Math.min(100, (todayMinutes / goalMinutes) * 100);
  const goalMet = todayMinutes >= goalMinutes;

  const formatMins = (m) => {
    const h = Math.floor(m / 60);
    const mins = m % 60;
    return `${h}h ${mins.toString().padStart(2, '0')}m`;
  };

  const handleSaveGoal = () => {
    const mins = Math.max(30, Math.min(960, Math.round(editGoalValue * 60)));
    updateSettings({ dailyGoalMinutes: mins });
    setIsEditingGoal(false);
  };

  const adjustGoal = (amount) => {
    setEditGoalValue(prev => Math.max(0.5, Math.min(16, prev + amount)));
  };

  const stats = [
    { title: 'Tasks Today', value: todayEvents.length, icon: CheckSquare },
    { title: 'Completed', value: completedToday, icon: Activity },
    { title: 'Study Hours (7d)', value: studyHoursThisWeek, icon: Clock },
    { title: 'Streak (days)', value: 1, icon: Flame } // Hardcoded for phase 1 simplicity
  ];

  const renderTaskGroup = (title, tasks) => {
    if (tasks.length === 0) return null;
    return (
      <div className="task-group">
        <h3 className="group-title">{title}</h3>
        <div className="task-list">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <TaskCard event={task} />
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const lastPdf = recentItems?.find(item => item.type === 'pdf');

  return (
    <div className="dashboard-view">
      <header className="dashboard-header">
        <h1>Good morning, {profile?.name || 'Student'} 👋</h1>
        <p className="date-subtitle">{dateString}</p>
      </header>

      <LayoutGroup>
        <motion.div layout className="daily-goal-wrapper glass">
          <motion.div layout className="goal-header" style={{ position: 'relative' }}>
            {!isEditingGoal ? (
              <>
                <motion.span 
                  layout
                  className="goal-label" 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => {
                    setEditGoalValue(settings.dailyGoalMinutes / 60 || 2);
                    setIsEditingGoal(true);
                  }}
                >
                  {goalMet ? "✅ Goal reached!" : `Today's Goal: ${formatMins(todayMinutes)} / ${formatMins(goalMinutes)}`}
                  <Pencil size={12} className="edit-icon" />
                </motion.span>
                <motion.span layout className="goal-percent">{Math.floor(goalProgress)}%</motion.span>
              </>
            ) : (
              <motion.div layout className="goal-editor-inline">
                <span className="goal-editor-label">Daily goal:</span>
                <div className="goal-stepper">
                  <button onClick={() => adjustGoal(-0.5)} className="icon-btn"><Minus size={14}/></button>
                  <span className="goal-value">{editGoalValue}h</span>
                  <button onClick={() => adjustGoal(0.5)} className="icon-btn"><Plus size={14}/></button>
                </div>
                <div className="goal-editor-actions">
                  <button className="primary-btn sm" onClick={handleSaveGoal}>Set Goal</button>
                  <button className="cancel-btn sm" onClick={() => setIsEditingGoal(false)}>Cancel</button>
                </div>
              </motion.div>
            )}
          </motion.div>
          {!isEditingGoal && (
            <motion.div layout className="goal-track">
              <motion.div 
                className="goal-fill" 
                style={{ backgroundColor: goalMet ? '#4caf7d' : 'var(--accent-vivid)' }}
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </motion.div>
          )}
        </motion.div>
      </LayoutGroup>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="dashboard-content">
        <div className="main-column">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>Today's Tasks</h2>
            <button 
              className="icon-btn" 
              onClick={() => setIsEventPanelOpen(true)}
              style={{ background: 'var(--bg-hover)', borderRadius: '50%', padding: '4px' }}
              title="Add Task"
            >
              <Plus size={16} />
            </button>
          </div>
          {todayEvents.length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-icon">☕</div>
              <h3>No tasks scheduled for today</h3>
              <p>Take a break, or head to the Calendar to plan your day.</p>
            </div>
          ) : (
            <div className="tasks-container">
              {renderTaskGroup('Morning', morningTasks)}
              {renderTaskGroup('Afternoon', afternoonTasks)}
              {renderTaskGroup('Evening', eveningTasks)}
            </div>
          )}
        </div>

        <div className="side-column">
          {upcomingExams.length > 0 && (
            <>
              <h2>Upcoming Exams</h2>
              <div className="upcoming-exams-list glass">
                {upcomingExams.map(exam => {
                  const maxDays = (exam.examVisibilityMonths || 1) * 30;
                  const progress = Math.max(0, Math.min(100, 100 - (exam.daysUntil / maxDays) * 100));
                  return (
                    <div key={exam.id} className="exam-card">
                      <div className="exam-card-top">
                        <div className="exam-info">
                          <span className="exam-dot" style={{ backgroundColor: exam.color }}></span>
                          <span className="exam-title">{exam.title}</span>
                        </div>
                        <div className="exam-days">
                          <span className="days-num">{exam.daysUntil}</span>
                          <span className="days-label">days</span>
                        </div>
                      </div>
                      <div className="exam-progress-bar">
                        <div className="exam-progress-fill" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <h2>Upcoming</h2>
          <div className="upcoming-list glass">
            {upcomingEvents.length === 0 ? (
              <p className="empty-text">No upcoming events.</p>
            ) : (
              upcomingEvents.map(e => (
                <div key={e.id} className="upcoming-item">
                  <div className="upcoming-date">{format(new Date(e.start), 'MMM d')}</div>
                  <div className="upcoming-details">
                    <div className="upcoming-title">{e.title}</div>
                    <div className="upcoming-time">{format(new Date(e.start), 'HH:mm')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {lastPdf && (
        <div 
          onClick={() => {
            if (setCurrentView) setCurrentView('library');
            setActivePdfId(lastPdf.id);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 12,
            cursor: 'pointer',
            transition: 'background 200ms',
            marginTop: 16
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card)'}
        >
          <span style={{ fontSize: 20 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lastPdf.title}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Continue reading</div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>→</span>
        </div>
      )}

      <EventPanel 
        isOpen={isEventPanelOpen} 
        onClose={() => setIsEventPanelOpen(false)} 
        selectedEvent={null}
        defaultDate={new Date()}
      />

      <style>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        
        .dashboard-header h1 {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -1px;
          margin-bottom: 4px;
        }
        .date-subtitle {
          font-size: 16px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .daily-goal-wrapper {
          padding: 16px 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
        }

        .goal-label {
          color: var(--text-primary);
          transition: opacity 0.2s;
        }

        .goal-label:hover {
          opacity: 0.8;
        }

        .edit-icon {
          color: var(--text-muted);
          opacity: 0.5;
        }

        .goal-label:hover .edit-icon {
          opacity: 1;
        }

        .goal-editor-inline {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .goal-editor-label {
          color: var(--text-muted);
          font-weight: 500;
        }

        .goal-stepper {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid var(--border-subtle);
        }

        .goal-stepper .icon-btn {
          background: var(--bg-hover);
          border: none;
          color: var(--text-primary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .goal-stepper .icon-btn:hover {
          background: var(--bg-subtle);
        }

        .goal-value {
          font-weight: 600;
          color: var(--text-primary);
          min-width: 3ch;
          text-align: center;
        }

        .goal-editor-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
        }
        .primary-btn.sm {
          padding: 6px 12px;
          font-size: 13px;
        }
        .cancel-btn.sm {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }
        .cancel-btn.sm:hover {
          background: var(--bg-hover);
        }

        .goal-percent {
          color: var(--text-muted);
        }

        .goal-track {
          height: 8px;
          background: var(--bg-subtle);
          border-radius: 4px;
          overflow: hidden;
          border: 1px solid var(--border-subtle);
        }

        .goal-fill {
          height: 100%;
          border-radius: 4px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .dashboard-content {
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          gap: 24px;
        }

        .main-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .side-column {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          padding-right: 8px; /* For scrollbar */
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .tasks-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .task-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .group-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .empty-state {
          padding: 40px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }
        .empty-icon {
          font-size: 48px;
          margin-bottom: 8px;
        }
        .empty-state h3 {
          font-size: 18px;
          font-weight: 600;
        }
        .empty-state p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .upcoming-list {
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .upcoming-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }
        .upcoming-date {
          font-size: 13px;
          font-weight: 600;
          color: var(--accent-vivid);
          background: rgba(0, 212, 255, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
          text-align: center;
          min-width: 50px;
        }
        .upcoming-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .upcoming-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .upcoming-time {
          font-size: 12px;
          color: var(--text-muted);
        }
        .empty-text {
          color: var(--text-disabled);
          font-size: 14px;
          text-align: center;
          padding: 16px 0;
        }

        .recent-list {
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        .recent-item {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        .recent-icon {
          padding: 8px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
        }
        .recent-icon.pdf {
          color: #ef4444;
        }
        .recent-icon.note {
          color: #eab308;
        }
        .recent-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .recent-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .recent-time {
          font-size: 12px;
          color: var(--text-muted);
        }

        .upcoming-exams-list {
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .exam-card {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 12px;
          border-radius: 12px;
        }

        .exam-card-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .exam-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .exam-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .exam-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .exam-days {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .days-num {
          font-size: 20px;
          font-weight: 700;
          color: #f59e0b;
        }

        .days-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .exam-progress-bar {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .exam-progress-fill {
          height: 100%;
          background: #f59e0b;
          border-radius: 2px;
        }

        @media (max-width: 1024px) {
          .dashboard-content {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
