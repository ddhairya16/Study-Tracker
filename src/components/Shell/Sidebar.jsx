import React from 'react';
import { Home, Calendar, Timer, BookOpen, ChevronLeft, ChevronRight, Settings, User, FileText, BarChart2, Folder, PenLine } from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';

function NavItem({ icon: Icon, label, view, currentView, onClick, collapsed }) {
  const isActive = currentView === view;
  
  return (
    <motion.button
      onClick={() => onClick(view)}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`nav-item ${isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: 10,
        width: '100%',
        padding: collapsed ? '9px' : '9px 12px',
        border: 'none',
        borderRadius: 8,
        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        transition: 'background 180ms ease, color 180ms ease',
        overflow: 'hidden',
      }}
    >
      {/* THE SLIDING ACCENT BAR — only renders inside the active item */}
      {isActive && (
        <motion.div
          layoutId="sidebar-accent"
          layout
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
          }}
          style={{
            position: 'absolute',
            left: 0,
            top: '15%',
            height: '70%',
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: 'var(--accent-vivid)',
            boxShadow: '0 0 8px var(--accent-vivid)',
          }}
        />
      )}
      
      <Icon 
        size={16} 
        strokeWidth={isActive ? 2.5 : 1.8}
        style={{ flexShrink: 0, transition: 'stroke-width 180ms ease' }}
      />
      
      {!collapsed && (
        <span style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      )}
    </motion.button>
  );
}

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

      <LayoutGroup>
        <nav className="sidebar-nav">
          {navItems.map((item, index) => (
            <motion.div key={item.id} style={{ animationDelay: `${index * 30}ms` }} className="nav-item-wrapper">
              <NavItem
                icon={item.icon}
                label={item.label}
                view={item.id}
                currentView={currentView}
                onClick={setCurrentView}
                collapsed={collapsed}
              />
            </motion.div>
          ))}
        </nav>
      </LayoutGroup>

      <div className="sidebar-footer">
        <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 8px', padding: 0 }}></div>
        <motion.div style={{ animationDelay: '120ms' }} className="nav-item-wrapper">
          <NavItem
            icon={PenLine}
            label="Whiteboard"
            view="whiteboard"
            currentView={currentView}
            onClick={setCurrentView}
            collapsed={collapsed}
          />
        </motion.div>
        <motion.div style={{ animationDelay: '150ms' }} className="nav-item-wrapper">
          <NavItem
            icon={User}
            label="Profile"
            view="profile"
            currentView={currentView}
            onClick={setCurrentView}
            collapsed={collapsed}
          />
        </motion.div>
        <motion.div style={{ animationDelay: '180ms' }} className="nav-item-wrapper">
          <NavItem
            icon={Settings}
            label="Settings"
            view="settings"
            currentView={currentView}
            onClick={setCurrentView}
            collapsed={collapsed}
          />
        </motion.div>
      </div>

      <style>{`
        .sidebar {
          width: 220px;
          height: 100%;
          background-color: var(--bg-panel);
          
          /* Remove any focus outline */
          outline: none !important; 
          
          /* Keep the right-side hairline border only */
          border: none;
          border-right: 1px solid var(--border-subtle);
          
          display: flex;
          flex-direction: column;
          transition: width 260ms var(--ease-spring);
          overflow: hidden;
          flex-shrink: 0;
        }
        .sidebar.collapsed {
          width: 64px;
        }
        
        .sidebar:focus,
        .sidebar *:focus {
          outline: none;
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
          gap: 2px;
          padding: 0 8px;
          
          box-shadow: none;
          border: none;
          outline: none;
        }
        .sidebar-footer {
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          border-top: var(--border-glass);
        }
        
        .nav-item-wrapper {
          animation: slideInRight 0.3s var(--ease-spring) backwards;
        }
        
        /* Nav Item hover state */
        .nav-item:hover:not(.active) {
          background: rgba(255,255,255,0.06) !important;
          color: rgba(255,255,255,0.85) !important;
        }
      `}</style>
    </div>
  );
}
