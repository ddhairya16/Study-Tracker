import React from 'react';
import AnimatedNumber from '../ui/AnimatedNumber';

export default function StatCard({ title, value, icon: Icon, trend, sublabel }) {
  const [displayed, setDisplayed] = React.useState(0);
  
  React.useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) { setDisplayed(0); return; }
    const duration = 800;
    const step = (end / duration) * 16;
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplayed(end); clearInterval(timer); }
      else setDisplayed(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const displayValue = typeof value === 'number' ? displayed.toFixed(value % 1 !== 0 ? 1 : 0) : value;

  return (
    <div className="stat-card card glass">
      <div className="stat-icon-wrapper">
        <Icon size={20} className="stat-icon" />
      </div>
      <div className="stat-content">
        <div className="stat-value">
          {displayValue}
        </div>
        <div className="stat-title">{title}</div>
        {sublabel && <div className="stat-sublabel">{sublabel}</div>}
      </div>
      
      <style>{`
        .stat-card {
          padding: 16px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-vivid);
        }
        .stat-content {
          display: flex;
          flex-direction: column;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.2;
        }
        .stat-title {
          font-size: 13px;
          color: var(--text-muted);
          font-weight: 500;
        }
        .stat-sublabel {
          font-size: 11px;
          color: var(--text-disabled);
          margin-top: 4px;
        }
      `}</style>
    </div>
  );
}
