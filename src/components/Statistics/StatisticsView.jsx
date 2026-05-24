import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { format, subDays, startOfWeek, addDays, startOfMonth, getDaysInMonth, isSameDay } from 'date-fns';
import Heatmap from './Heatmap';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, Activity, Target } from 'lucide-react';

function BarChart({ data, labels }) {
  const maxVal = Math.max(...data, 10); // Minimum ceiling to prevent huge bars for tiny amounts
  const [hoverIndex, setHoverIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverIndex(index);
    setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
  };

  const yLabels = [Math.floor(maxVal), Math.floor(maxVal * 0.66), Math.floor(maxVal * 0.33), 0];

  return (
    <div className="svg-chart-wrapper">
      <div className="y-axis">
        {yLabels.map((val, i) => (
          <span key={i}>{val}m</span>
        ))}
      </div>
      <div className="bars-container">
        {data.map((val, i) => {
          const hPct = Math.max((val / maxVal) * 100, 2); // 2% min height so zero isn't invisible if we wanted, but spec says "shorter bars muted". Let's use 0% for 0.
          const actualPct = val === 0 ? 0 : hPct;
          return (
            <div 
              key={i} 
              className="bar-column" 
              onMouseMove={(e) => handleMouseMove(e, i)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              <div className="bar-track">
                <div 
                  className="bar-fill" 
                  style={{ 
                    height: `${actualPct}%`, 
                    opacity: val === 0 ? 0 : (0.4 + (actualPct / 100) * 0.6)
                  }} 
                />
              </div>
              <span className="x-label">{labels[i]}</span>
            </div>
          );
        })}
      </div>
      
      {hoverIndex !== null && (
        <div className="chart-tooltip" style={{ left: tooltipPos.x, top: tooltipPos.y - 35 }}>
          {data[hoverIndex]} min
        </div>
      )}

      <style>{`
        .svg-chart-wrapper {
          display: flex;
          height: 200px;
          gap: 16px;
          padding-top: 20px;
          position: relative;
        }
        .y-axis {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding-bottom: 24px;
          color: var(--text-muted);
          font-size: 11px;
          text-align: right;
          min-width: 30px;
        }
        .bars-container {
          display: flex;
          flex: 1;
          gap: 4px;
          align-items: flex-end;
          padding-bottom: 24px;
          border-bottom: 1px solid var(--border-subtle);
          position: relative;
        }
        .bar-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          gap: 8px;
          cursor: crosshair;
        }
        .bar-track {
          flex: 1;
          width: 100%;
          max-width: 24px;
          display: flex;
          align-items: flex-end;
          border-radius: 4px 4px 0 0;
          overflow: hidden;
        }
        .bar-fill {
          width: 100%;
          background: var(--accent-vivid);
          border-radius: 4px 4px 0 0;
          transition: height 400ms var(--ease-spring), opacity 400ms var(--ease-standard);
        }
        .bar-column:hover .bar-fill {
          opacity: 1 !important;
          filter: brightness(1.2);
        }
        .x-label {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          position: absolute;
          bottom: 0;
        }
        .chart-tooltip {
          position: fixed;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: var(--border-glass);
          pointer-events: none;
          z-index: 1000;
          transform: translateX(-50%);
          box-shadow: 0 4px 16px rgba(0,0,0,0.5);
          animation: tooltipFadeIn 0.15s var(--ease-standard);
        }
      `}</style>
    </div>
  );
}

export default function StatisticsView() {
  const { sessions, subjects } = useStore();
  const [periodTab, setPeriodTab] = useState('This Week');
  const [categoryFilter, setCategoryFilter] = useState('All time');

  const today = new Date();
  today.setHours(0,0,0,0);

  // --- Computations ---

  const dailyMinutes = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const day = s.date.slice(0, 10);
      map[day] = (map[day] || 0) + Math.floor(s.duration / 60);
    });
    return map;
  }, [sessions]);

  const { activeDaysYear, maxStreak, currentStreak } = useMemo(() => {
    const oneYearAgo = subDays(today, 365);
    let activeDays = 0;
    
    // Convert to sorted array of unique dates where minutes > 0
    const activeDateStrs = Object.keys(dailyMinutes).filter(d => dailyMinutes[d] > 0).sort();
    
    activeDateStrs.forEach(d => {
      if (new Date(d) >= oneYearAgo) activeDays++;
    });

    let current = 0;
    let max = 0;
    
    let checkDate = new Date(today);
    const todayStr = format(checkDate, 'yyyy-MM-dd');
    let todayLogged = activeDateStrs.includes(todayStr);

    if (!todayLogged) {
      checkDate = subDays(checkDate, 1); // Shift to yesterday if today not logged yet
    }

    while (true) {
      const dStr = format(checkDate, 'yyyy-MM-dd');
      if (activeDateStrs.includes(dStr)) {
        current++;
        checkDate = subDays(checkDate, 1);
      } else {
        break;
      }
    }

    // Calculate max streak (all time)
    let tempStreak = 0;
    let prevDate = null;
    activeDateStrs.forEach(dStr => {
      const d = new Date(dStr);
      if (!prevDate) {
        tempStreak = 1;
      } else {
        const diff = Math.floor((d - prevDate) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > max) max = tempStreak;
      prevDate = d;
    });

    return { activeDaysYear: activeDays, maxStreak: max, currentStreak: current };
  }, [dailyMinutes]);

  // Period Breakdown Data
  const periodData = useMemo(() => {
    if (periodTab === 'This Week') {
      const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
      const data = [];
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      let total = 0;
      let maxDay = { name: '-', val: 0 };

      for (let i = 0; i < 7; i++) {
        const d = format(addDays(start, i), 'yyyy-MM-dd');
        const mins = dailyMinutes[d] || 0;
        data.push(mins);
        total += mins;
        if (mins > maxDay.val) maxDay = { name: labels[i], val: mins };
      }
      return { data, labels, total, avg: Math.round(total / 7), best: maxDay.name };
    } 
    else if (periodTab === 'This Month') {
      const start = startOfMonth(today);
      const daysInMonth = getDaysInMonth(today);
      const data = [];
      const labels = [];
      let total = 0;
      let active = 0;
      let maxDay = { name: '-', val: 0 };

      for (let i = 0; i < daysInMonth; i++) {
        const d = format(addDays(start, i), 'yyyy-MM-dd');
        const mins = dailyMinutes[d] || 0;
        data.push(mins);
        if (i % 5 === 0 || i === daysInMonth - 1) labels.push(i + 1);
        else labels.push('');
        
        total += mins;
        if (mins > 0) active++;
        if (mins > maxDay.val) maxDay = { name: `Day ${i + 1}`, val: mins };
      }
      return { data, labels, total, active, best: maxDay.name };
    }
    return null;
  }, [periodTab, dailyMinutes]);

  // Today Timeline Data
  const todaySessions = useMemo(() => {
    return sessions.filter(s => isSameDay(new Date(s.date), today)).reverse(); // Assuming sessions added chronologically
  }, [sessions]);

  // Subject Breakdown Data
  const subjectData = useMemo(() => {
    const map = {}; // subjectId -> { totalSeconds, count }
    
    let filteredSessions = sessions;
    if (categoryFilter === 'This week') {
      const start = startOfWeek(today, { weekStartsOn: 1 });
      filteredSessions = sessions.filter(s => new Date(s.date) >= start);
    } else if (categoryFilter === 'This month') {
      const start = startOfMonth(today);
      filteredSessions = sessions.filter(s => new Date(s.date) >= start);
    }

    filteredSessions.forEach(s => {
      if (!s.subjectId) return;
      if (!map[s.subjectId]) map[s.subjectId] = { totalSeconds: 0, count: 0 };
      map[s.subjectId].totalSeconds += s.duration;
      map[s.subjectId].count += 1;
    });

    const res = Object.keys(map).map(id => {
      const subj = subjects.find(s => s.id === id);
      return {
        id,
        name: subj ? subj.name : 'Unknown',
        color: subj ? subj.color : '#888',
        minutes: Math.floor(map[id].totalSeconds / 60),
        count: map[id].count
      };
    }).filter(x => x.minutes > 0).sort((a, b) => b.minutes - a.minutes);

    const maxMins = res.length > 0 ? res[0].minutes : 1;
    return res.map(r => ({ ...r, percentage: (r.minutes / maxMins) * 100 }));
  }, [sessions, subjects, categoryFilter]);

  return (
    <div className="statistics-view">
      <div className="view-header">
        <h1>Statistics</h1>
        <p className="subtitle">Track your progress and build consistent study habits.</p>
      </div>

      <div className="section glass">
        <h2>Activity Heatmap</h2>
        <Heatmap data={dailyMinutes} days={365} />
        <div className="heatmap-summary">
          {activeDaysYear} days active in the last year &middot; {maxStreak} day longest streak &middot; {currentStreak} day current streak
        </div>
      </div>

      <div className="section glass period-section">
        <div className="section-header">
          <h2>Period Breakdown</h2>
          <div className="tabs">
            {['This Week', 'This Month', 'Today'].map(tab => (
              <button 
                key={tab} 
                className={`tab-btn ${periodTab === tab ? 'active' : ''}`}
                onClick={() => setPeriodTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={periodTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {periodTab === 'Today' ? (
              <div className="today-timeline">
                {todaySessions.length === 0 ? (
                  <div className="empty-state">
                    <p>No study sessions recorded today. Start the timer to begin tracking.</p>
                  </div>
                ) : (
                  <div className="timeline-list">
                    {todaySessions.map((s, i) => {
                      const subj = subjects.find(sub => sub.id === s.subjectId);
                      const topic = subj?.topics.find(t => t.id === s.topicId);
                      const m = Math.floor(s.duration / 60);
                      return (
                        <div key={i} className="timeline-item">
                          <span className="dot" style={{ background: subj?.color || '#888' }} />
                          <div className="tl-content">
                            <span className="tl-title">{subj?.name || 'Unknown'} - {topic?.name || 'Unknown'}</span>
                            <div className="tl-meta">
                              <span className="tl-badge">{s.mode}</span>
                              <span className="tl-dur">{m} min</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                <div className="period-stats">
                  <div className="p-stat">
                    <span className="p-val">{Math.floor(todaySessions.reduce((a,b)=>a+b.duration,0)/60)}m</span>
                    <span className="p-lbl">Total today</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-val">{todaySessions.length}</span>
                    <span className="p-lbl">Sessions completed</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="chart-view">
                <BarChart data={periodData.data} labels={periodData.labels} />
                <div className="period-stats">
                  <div className="p-stat">
                    <span className="p-val">{periodData.total}m</span>
                    <span className="p-lbl">Total {periodTab.toLowerCase()}</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-val">{periodTab === 'This Week' ? periodData.avg + 'm' : periodData.active}</span>
                    <span className="p-lbl">{periodTab === 'This Week' ? 'Daily average' : 'Active days'}</span>
                  </div>
                  <div className="p-stat">
                    <span className="p-val">{periodData.best}</span>
                    <span className="p-lbl">{periodTab === 'This Week' ? 'Most productive day' : 'Best day'}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="section glass">
        <div className="section-header">
          <h2>Subject Breakdown</h2>
          <div className="segmented-control">
            {['All time', 'This month', 'This week'].map(cat => (
              <button 
                key={cat} 
                className={`seg-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        
        {subjectData.length === 0 ? (
          <div className="empty-state">
            <p>Complete timer sessions tagged to subjects to see your breakdown.</p>
          </div>
        ) : (
          <div className="subject-bars">
            {subjectData.map(subj => {
              const h = Math.floor(subj.minutes / 60);
              const m = subj.minutes % 60;
              const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
              
              return (
                <div key={subj.id} className="subj-row">
                  <div className="subj-header">
                    <div className="subj-info">
                      <span className="subj-dot" style={{ background: subj.color }} />
                      <span className="subj-name">{subj.name}</span>
                    </div>
                    <div className="subj-meta">
                      <span className="subj-time">{timeStr}</span>
                      <span className="subj-count">{subj.count} sessions</span>
                    </div>
                  </div>
                  <div className="subj-track">
                    <div className="subj-fill" style={{ width: `${subj.percentage}%`, background: subj.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <style>{`
        .statistics-view {
          display: flex;
          flex-direction: column;
          gap: 32px;
          max-width: 900px;
          margin: 0 auto;
          padding-bottom: 40px;
        }

        .view-header h1 {
          font-size: 32px;
          font-weight: 600;
          letter-spacing: -1px;
          margin-bottom: 4px;
        }

        .subtitle {
          font-size: 16px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .section {
          padding: 24px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .section h2 {
          font-size: 20px;
          font-weight: 600;
        }

        .heatmap-summary {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 16px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .tabs {
          display: flex;
          gap: 4px;
          background: rgba(0,0,0,0.2);
          padding: 4px;
          border-radius: 10px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }

        .tab-btn.active {
          background: var(--bg-card);
          color: var(--text-primary);
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .segmented-control {
          display: flex;
          gap: 8px;
        }

        .seg-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-muted);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 200ms var(--ease-standard);
        }

        .seg-btn.active {
          background: rgba(255,255,255,0.1);
          color: var(--text-primary);
          border-color: rgba(255,255,255,0.2);
        }

        .period-stats {
          display: flex;
          gap: 32px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid var(--border-subtle);
        }

        .p-stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .p-val {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .p-lbl {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
          font-size: 14px;
          background: rgba(0,0,0,0.1);
          border-radius: 12px;
          border: 1px dashed rgba(255,255,255,0.1);
        }

        .timeline-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }

        .timeline-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-top: 4px;
        }

        .tl-content {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-subtle);
          padding: 12px 16px;
          border-radius: 12px;
          border: 1px solid var(--border-subtle);
        }

        .tl-title {
          font-size: 14px;
          font-weight: 500;
        }

        .tl-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tl-badge {
          font-size: 11px;
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 12px;
          color: var(--text-muted);
        }

        .tl-dur {
          font-size: 14px;
          font-weight: 600;
          color: var(--accent-vivid);
        }

        .subject-bars {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 16px;
        }

        .subj-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .subj-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .subj-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .subj-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .subj-name {
          font-size: 14px;
          font-weight: 500;
        }

        .subj-meta {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .subj-time {
          font-size: 14px;
          font-weight: 600;
        }

        .subj-count {
          font-size: 12px;
          color: var(--text-muted);
        }

        .subj-track {
          height: 8px;
          background: var(--bg-hover);
          border-radius: 4px;
          overflow: hidden;
        }

        .subj-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 400ms cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}
