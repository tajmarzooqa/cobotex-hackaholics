import React from 'react';
import { SeverityLevel } from '../../types';
import { useIncidents } from '../../context/IncidentContext';
import { SeverityBadge } from '../common/CategoryIcon';

interface SeverityBreakdownProps {
  onSelectSeverity?: (severity: SeverityLevel) => void;
}

export const SeverityBreakdown: React.FC<SeverityBreakdownProps> = ({ onSelectSeverity }) => {
  const { metrics, setActiveTab } = useIncidents();
  const total = metrics.total || 1;

  const severities: Array<{
    level: SeverityLevel;
    color: string;
    description: string;
  }> = [
    { level: 'Critical', color: 'bg-rose-500', description: 'Immediate threat to life & massive scale' },
    { level: 'High', color: 'bg-amber-500', description: 'Urgent priority with severe potential' },
    { level: 'Medium', color: 'bg-yellow-400', description: 'Standard response with localized impact' },
    { level: 'Low', color: 'bg-emerald-500', description: 'Minor non-life-threatening incidents' }
  ];

  const handleClick = (level: SeverityLevel) => {
    if (onSelectSeverity) {
      onSelectSeverity(level);
    }
    setActiveTab('incidents');
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Severity Classification</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated triage & administrator ratings</p>
          </div>
          <span className="text-xs font-mono text-rose-400 font-semibold tabular-nums">
            {metrics.critical} Critical Active
          </span>
        </div>

        {/* Severity stacked bar */}
        <div className="w-full h-3 bg-slate-800 rounded-md overflow-hidden flex mb-5">
          {metrics.total === 0 ? (
            <div className="w-full h-full bg-slate-800/80 flex items-center justify-center" />
          ) : (
            severities.map(s => {
              const count = metrics.severityCounts[s.level] || 0;
              const pct = (count / total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={s.level}
                  className={`${s.color} h-full transition-all duration-300 relative group cursor-pointer`}
                  style={{ width: `${pct}%` }}
                  title={`${s.level}: ${count} (${Math.round(pct)}%)`}
                  onClick={() => handleClick(s.level)}
                />
              );
            })
          )}
        </div>

        {/* List items */}
        <div className="space-y-3">
          {severities.map(s => {
            const count = metrics.severityCounts[s.level] || 0;
            const pct = metrics.total === 0 ? 0 : Math.round((count / metrics.total) * 100);

            return (
              <div
                key={s.level}
                onClick={() => handleClick(s.level)}
                className="cursor-pointer group flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-700/60"
              >
                <div className="flex items-center gap-2.5">
                  <SeverityBadge severity={s.level} />
                  <span className="text-xs text-slate-400 hidden sm:inline truncate max-w-[200px]">
                    {s.description}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-white tabular-nums">
                    {count}
                  </span>
                  <span className="font-mono text-xs text-slate-400 tabular-nums w-10 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operational Response Efficiency Footer */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span>Average Triage Time</span>
        <span className="font-mono font-semibold text-emerald-400 tabular-nums">
          &lt; 90 seconds (Automated)
        </span>
      </div>
    </div>
  );
};
