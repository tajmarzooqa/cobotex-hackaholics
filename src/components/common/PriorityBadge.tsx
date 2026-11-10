import React, { useState } from 'react';
import {
  Flame,
  AlertTriangle,
  Clock,
  Users,
  Info,
  ShieldAlert,
  Edit2,
  Check
} from 'lucide-react';
import { PriorityBreakdown, SeverityLevel } from '../../types';

interface PriorityBadgeProps {
  score: number;
  rank?: number;
  breakdown?: PriorityBreakdown;
  size?: 'sm' | 'md' | 'lg';
  showRank?: boolean;
  onOverrideRequest?: () => void;
  showDetailsButton?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  score,
  rank,
  breakdown,
  size = 'md',
  showRank = true,
  onOverrideRequest
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Score styling
  let badgeColors = 'bg-slate-900 border-slate-700 text-slate-300';
  let barColor = 'bg-slate-400';
  let urgencyLabel = 'Low Urgency';

  if (score >= 80) {
    badgeColors = 'bg-rose-950/80 border-rose-700/80 text-rose-300 shadow-sm shadow-rose-950/50';
    barColor = 'bg-rose-500';
    urgencyLabel = 'Critical Urgency';
  } else if (score >= 60) {
    badgeColors = 'bg-amber-950/80 border-amber-700/80 text-amber-300';
    barColor = 'bg-amber-500';
    urgencyLabel = 'High Urgency';
  } else if (score >= 40) {
    badgeColors = 'bg-yellow-950/60 border-yellow-700/60 text-yellow-300';
    barColor = 'bg-yellow-400';
    urgencyLabel = 'Medium Urgency';
  } else {
    badgeColors = 'bg-slate-800/80 border-slate-700 text-slate-300';
    barColor = 'bg-slate-400';
    urgencyLabel = 'Standard Urgency';
  }

  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  return (
    <div className="relative inline-block">
      <div
        className={`inline-flex items-center gap-2 rounded-lg border font-mono font-medium transition-all cursor-pointer ${badgeColors} ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : isLarge ? 'px-3 py-1.5 text-sm' : 'px-2.5 py-1 text-xs'
        }`}
        onClick={() => setShowTooltip(!showTooltip)}
        title="Click to view transparent prioritization breakdown"
      >
        {/* Dynamic Rank indicator if available */}
        {showRank && rank !== undefined && (
          <span className="font-bold text-white bg-black/40 px-1.5 py-0.2 rounded border border-white/10 text-[10px]">
            #{rank}
          </span>
        )}

        {/* Priority Score Bar / Gauge */}
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-1.5 rounded-full bg-black/40 overflow-hidden border border-white/10">
            <div
              className={`h-full ${barColor} transition-all duration-300`}
              style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
            />
          </div>
          <span className="font-bold tabular-nums text-white">
            {score}
            <span className="text-[10px] opacity-70">/100</span>
          </span>
        </div>

        {breakdown?.isOverridden && (
          <span className="text-[10px] text-amber-300 bg-amber-950 px-1 py-0.2 rounded border border-amber-700 font-sans font-semibold">
            Override
          </span>
        )}
      </div>

      {/* Transparent Breakdown Dropdown Popover */}
      {showTooltip && (
        <div
          className="absolute left-0 top-full mt-2 z-50 w-80 p-3.5 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs text-slate-200 animate-in fade-in zoom-in-95 duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between pb-2 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white uppercase text-[11px] tracking-wider">
                  Prioritization Breakdown
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                Dynamic Score: <strong className="text-white">{score}/100</strong> · {urgencyLabel}
              </div>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-slate-400 hover:text-white text-xs px-1"
            >
              ✕
            </button>
          </div>

          {breakdown ? (
            <div className="space-y-2.5 py-2.5">
              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Severity Points:</span>
                  <span className="text-white font-bold tabular-nums">+{breakdown.severityPoints} / 40</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Affected Population:</span>
                  <span className="text-white font-bold tabular-nums">+{breakdown.affectedPoints} / 25</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">
                    Time Elapsed ({breakdown.timeElapsedMinutes}m):
                  </span>
                  <span className="text-white font-bold tabular-nums">+{breakdown.elapsedPoints} / 20</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Category Urgency Weight:</span>
                  <span className="text-white font-bold tabular-nums">+{breakdown.categoryPoints} / 15</span>
                </div>
              </div>

              {breakdown.isOverridden && (
                <div className="p-2 rounded bg-amber-950/60 border border-amber-800/80 text-[11px] text-amber-200">
                  <span className="font-bold">Manual Administrator Override:</span>
                  <p className="mt-0.5 text-[10px] leading-tight text-amber-300">
                    {breakdown.overrideReason || 'Admin triage override.'}
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-relaxed font-sans pt-1 border-t border-slate-800">
                {breakdown.explanation}
              </p>
            </div>
          ) : (
            <div className="py-3 text-slate-400 text-xs italic">
              Computed dynamically based on Severity, Population Impact, Elapsed Time, and Urgency Weight.
            </div>
          )}

          {onOverrideRequest && (
            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => {
                  setShowTooltip(false);
                  onOverrideRequest();
                }}
                className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
                <span>Adjust Priority Score</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
