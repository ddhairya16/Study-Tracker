import React from 'react';

export default function ProgressRing({ radius, stroke, progress, color, children }) {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <div className="progress-ring-container">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="progress-ring-svg"
      >
        <circle
          stroke="rgba(255, 255, 255, 0.05)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color || "var(--accent-vivid)"}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s linear' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="progress-ring-content">
        {children}
      </div>

      <style>{`
        .progress-ring-container {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .progress-ring-svg {
          transform: rotate(-90deg);
        }
        .progress-ring-content {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
