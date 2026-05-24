import React from 'react';
import { useStore } from '../../store/useStore';
import { Activity, Clock, Flame } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '../Dashboard/StatCard';
import Heatmap from '../Statistics/Heatmap';

export default function ProfileView() {
  const { profile, updateProfile, sessions } = useStore();

  const handleNameChange = (e) => {
    updateProfile({ name: e.target.value });
  };

  const handleGoalChange = (e) => {
    updateProfile({ goal: e.target.value });
  };

  const initials = profile.name ? profile.name.slice(0, 2).toUpperCase() : '??';

  // Calculate stats
  const dailyMinutes = React.useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const day = s.date.slice(0, 10);
      map[day] = (map[day] || 0) + Math.floor(s.duration / 60);
    });
    return map;
  }, [sessions]);

  const pomodoroSessions = sessions.filter(s => s.mode?.toLowerCase() === 'pomodoro').length;
  
  const totalSeconds = sessions.reduce((acc, curr) => acc + curr.duration, 0);
  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMins = Math.floor((totalSeconds % 3600) / 60);
  const totalTimeStr = `${totalHours}h ${totalMins}m`;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentSessions = sessions.filter(s => new Date(s.date) >= oneWeekAgo);
  const recentSeconds = recentSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const recentHours = Math.floor(recentSeconds / 3600);
  const recentMins = Math.floor((recentSeconds % 3600) / 60);
  const recentTimeStr = `${recentHours}h ${recentMins}m`;

  // Streak logic
  const dates = [...new Set(sessions.map(s => s.date))].sort((a,b) => new Date(b) - new Date(a));
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0,0,0,0);
  let todayLogged = dates.includes(format(currentDate, 'yyyy-MM-dd'));
  
  let checkDate = new Date(currentDate);
  if (!todayLogged) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dStr = format(checkDate, 'yyyy-MM-dd');
    if (dates.includes(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return (
    <div className="profile-view">
      <div className="profile-header glass">
        <div className="avatar">
          {initials}
        </div>
        <div className="profile-info">
          <input 
            type="text" 
            className="name-input" 
            value={profile.name} 
            onChange={handleNameChange}
            placeholder="Your Name"
          />
          <input 
            type="text" 
            className="goal-input" 
            value={profile.goal} 
            onChange={handleGoalChange}
            placeholder="My study goal this semester..."
          />
        </div>
      </div>

      <h2>Your Statistics</h2>
      <div className="stats-grid">
        <StatCard title="Pomodoro Sessions" value={pomodoroSessions} icon={Activity} sublabel="Focus sessions completed" />
        <StatCard title="Total Time Studied" value={totalTimeStr} icon={Clock} sublabel="Across all timer modes" />
        <StatCard title="This Week" value={recentTimeStr} icon={Clock} sublabel="Last 7 days" />
        <StatCard title="Current Streak" value={streak} icon={Flame} sublabel="Consecutive days studied" />
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        <div className="glass heatmap-card">
          <Heatmap data={dailyMinutes} days={84} />
        </div>
      </div>

      <style>{`
        .profile-view {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 800px;
          margin: 0 auto;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 32px;
          padding: 40px;
          border-radius: 24px;
        }

        .avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--accent-vivid);
          color: var(--bg-base);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -1px;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .name-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 32px;
          font-weight: 600;
          outline: none;
          letter-spacing: -1px;
        }

        .name-input::placeholder {
          color: var(--text-disabled);
        }

        .goal-input {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 16px;
          outline: none;
        }
        
        .goal-input::placeholder {
          color: var(--text-disabled);
        }

        h2 {
          font-size: 20px;
          font-weight: 600;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .recent-activity {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .heatmap-card {
          padding: 24px;
          border-radius: 16px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
