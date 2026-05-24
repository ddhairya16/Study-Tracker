import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, sublabel }) {
  return (
    <div className="stat-card glass">
      <div className="stat-icon-wrapper">
        <Icon size={20} className="stat-icon" />
      </div>
      <div className="stat-content">
        <div className="stat-value">{value}</div>
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
