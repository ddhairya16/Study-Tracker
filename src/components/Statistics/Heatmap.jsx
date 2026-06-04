import React, { useState } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { formatDateLong } from '../../lib/dateFormat';
import { useStore } from '../../store/useStore';

export default function Heatmap({ data, days = 84 }) {
  const { settings } = useStore();
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '', isRightEdge: false });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = subDays(today, days - 1);
  const startDayOfWeek = startDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const padDays = (startDayOfWeek + 6) % 7; // Days to pad to reach previous Monday

  const totalCells = padDays + days;

  const cells = Array.from({ length: totalCells }).map((_, i) => {
    const cellDate = addDays(startDate, i - padDays);
    const isPadding = i < padDays;
    const dateStr = format(cellDate, 'yyyy-MM-dd');
    const minutes = data[dateStr] || 0;
    
    let level = 0;
    if (!isPadding) {
      if (minutes > 0 && minutes < 30) level = 1;
      else if (minutes >= 30 && minutes < 60) level = 2;
      else if (minutes >= 60 && minutes < 120) level = 3;
      else if (minutes >= 120 && minutes < 180) level = 4;
      else if (minutes >= 180) level = 5;
    }

    const isTodayFlag = !isPadding && dateStr === format(today, 'yyyy-MM-dd');

    return { id: i, dateStr, cellDate, isPadding, minutes, level, isTodayFlag };
  });

  const getTooltipText = (minutes, cellDate) => {
    const dateFmt = formatDateLong(cellDate, settings?.dateFormat);
    if (minutes === 0) return `No activity on ${dateFmt}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;
    return `${timeStr} on ${dateFmt}`;
  };

  const handleMouseEnter = (e, cell) => {
    if (cell.isPadding) return;
    const rect = e.target.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const isRightEdge = rect.right > windowWidth - 200;
    setTooltip({
      visible: true,
      x: rect.left,
      y: rect.top,
      content: getTooltipText(cell.minutes, cell.cellDate),
      isRightEdge
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  return (
    <div className="heatmap-container" onMouseLeave={handleMouseLeave}>
      <div className="heatmap-labels-y">
        <span>M</span>
        <span>W</span>
        <span>F</span>
      </div>
      
      <div className="heatmap-grid-wrapper">
        <div className="heatmap-grid">
          {cells.map((cell, index) => (
            <div
              key={cell.id}
              className={`heatmap-cell level-${cell.level} ${cell.isPadding ? 'padding' : ''} ${cell.isTodayFlag ? 'today' : ''}`}
              style={{ animationDelay: `${index * 2}ms` }}
              onMouseEnter={(e) => handleMouseEnter(e, cell)}
            />
          ))}
        </div>
      </div>

      {tooltip.visible && (
        <div 
          className={`heatmap-tooltip ${tooltip.isRightEdge ? 'flip' : ''}`}
          style={{
            left: tooltip.isRightEdge ? tooltip.x - 8 : tooltip.x + 18,
            top: tooltip.y - 32
          }}
        >
          {tooltip.content}
        </div>
      )}

      <style>{`
        .heatmap-container {
          display: flex;
          gap: 8px;
          position: relative;
          padding-top: 16px;
        }

        .heatmap-labels-y {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-muted);
          padding-top: 10px;
          padding-bottom: 10px;
          height: 84px; /* 7 cells * 10px + 6 gaps * 2px + extra to align */
        }
        
        .heatmap-labels-y span:nth-child(1) { margin-top: 2px; }
        .heatmap-labels-y span:nth-child(2) { margin-top: 14px; }
        .heatmap-labels-y span:nth-child(3) { margin-top: 14px; }

        .heatmap-grid-wrapper {
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none; /* Firefox */
        }
        .heatmap-grid-wrapper::-webkit-scrollbar {
          display: none; /* Chrome */
        }

        .heatmap-grid {
          display: grid;
          grid-template-rows: repeat(7, 10px);
          grid-auto-flow: column;
          grid-auto-columns: 10px;
          gap: 3px;
        }

        .heatmap-cell {
          width: 10px;
          height: 10px;
          border-radius: 2px;
          transition: transform 100ms var(--ease-standard);
          animation: cellFadeIn 0.5s var(--ease-spring) backwards;
        }

        @keyframes cellFadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }

        .heatmap-cell:not(.padding):hover {
          transform: scale(1.3);
          z-index: 10;
        }

        .heatmap-cell.padding {
          background: transparent !important;
          pointer-events: none;
        }

        .heatmap-cell.today {
          border: 1px solid var(--accent-vivid);
        }

        .heatmap-cell.level-0 { background: var(--heatmap-level-0); }
        .heatmap-cell.level-1 { background: #1a3a5c; }
        .heatmap-cell.level-2 { background: #1d6fa4; }
        .heatmap-cell.level-3 { background: #2196f3; }
        .heatmap-cell.level-4 { background: #00d4ff; }
        .heatmap-cell.level-5 { 
          background: #ffffff; 
          box-shadow: 0 0 6px #00d4ff; 
        }

        .heatmap-tooltip {
          position: fixed;
          background: var(--bg-card);
          color: var(--text-primary);
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          border: var(--border-glass);
          pointer-events: none;
          z-index: 1000;
          white-space: nowrap;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6);
          transform: translateX(0);
          animation: tooltipFadeIn 0.15s var(--ease-standard);
        }

        .heatmap-tooltip.flip {
          transform: translateX(-100%);
        }

        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .heatmap-tooltip.flip {
          animation: tooltipFadeInFlip 0.15s var(--ease-standard) forwards;
        }
        
        @keyframes tooltipFadeInFlip {
          from { opacity: 0; transform: translate(-100%, 4px); }
          to { opacity: 1; transform: translate(-100%, 0); }
        }
      `}</style>
    </div>
  );
}
