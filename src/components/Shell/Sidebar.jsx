import React from 'react';
import { Home, Calendar, Timer, BookOpen, ChevronLeft, ChevronRight, Settings, User, FileText, BarChart2, Folder } from 'lucide-react';

export default function Sidebar({ collapsed, setCollapsed, currentView, setCurrentView }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'timer', label: 'Timer', icon: Timer },
    { id: 'statistics', label: 'Statistics', icon: BarChart2 },
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { id: 'library', label: 'Library', icon: Folder },
    { id: 'notes', label: 'Notes', icon: FileText }
  ];

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, index) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              style={{ animationDelay: `${index * 30}ms` }}
              onClick={() => setCurrentView(item.id)}
            >
              <item.icon size={20} className="nav-icon" />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <button 
          className={`nav-item ${currentView === 'profile' ? 'active' : ''}`} 
          style={{ animationDelay: '150ms' }}
          onClick={() => setCurrentView('profile')}
        >
          <User size={20} className="nav-icon" />
          {!collapsed && <span className="nav-label">Profile</span>}
        </button>
        <button 
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`} 
          style={{ animationDelay: '180ms' }}
          onClick={() => setCurrentView('settings')}
        >
          <Settings size={20} className="nav-icon" />
          {!collapsed && <span className="nav-label">Settings</span>}
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 220px;
          height: 100%;
          background-color: var(--bg-panel);
          border-right: var(--border-glass);
          display: flex;
          flex-direction: column;
          transition: width 260ms var(--ease-spring);
          overflow: hidden;
          flex-shrink: 0;
        }
        .sidebar.collapsed {
          width: 64px;
        }
        .sidebar-header {
          padding: 16px;
          display: flex;
          justify-content: flex-end;
        }
        .sidebar.collapsed .sidebar-header {
          justify-content: center;
        }
        .toggle-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 6px;
          transition: background 200ms var(--ease-standard), color 200ms var(--ease-standard);
        }
        .toggle-btn:hover {
          background: var(--glass-bg);
          color: var(--text-primary);
        }
        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 0 12px;
        }
        .sidebar-footer {
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border-top: var(--border-glass);
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: background 200ms var(--ease-standard), transform 200ms var(--ease-standard), color 200ms var(--ease-standard);
          animation: slideInRight 0.3s var(--ease-spring) backwards;
          white-space: nowrap;
          text-align: left;
          width: 100%;
        }
        .sidebar.collapsed .nav-item {
          padding: 10px;
          justify-content: center;
        }
        .nav-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
          transform: scale(1.01);
        }
        .nav-item:active {
          transform: scale(0.97);
        }
        .nav-item.active {
          background: rgba(0, 212, 255, 0.1);
          color: var(--text-primary);
          border-left: 3px solid var(--accent-vivid);
          padding-left: 9px;
        }
        .sidebar.collapsed .nav-item.active {
          padding-left: 7px;
        }
        .nav-label {
          font-size: 14px;
          font-weight: 500;
          opacity: 1;
          transition: opacity 260ms var(--ease-standard);
        }
        .sidebar.collapsed .nav-label {
          opacity: 0;
          display: none;
        }
      `}</style>
    </div>
  );
}
