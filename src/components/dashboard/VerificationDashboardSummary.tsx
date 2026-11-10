import React from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  Copy,
  ShieldCheck,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

export const VerificationDashboardSummary: React.FC = () => {
  const { metrics, setActiveTab } = useIncidents();

  return (
    <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Report Verification & Duplicate Triage Status
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated spatial correlation, duplicate detection, and review queue
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('verification')}
          className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors shrink-0 self-start sm:self-auto"
        >
          <span>Open Verification Panel</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* 1. Total Verified Reports */}
        <div
          onClick={() => setActiveTab('verification')}
          className="cursor-pointer p-3 rounded-lg bg-slate-950 border border-emerald-900/40 hover:border-emerald-700/60 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Verified Reports</span>
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {metrics.totalVerified}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Confirmed on-scene / camera</p>
        </div>

        {/* 2. Requiring Review */}
        <div
          onClick={() => setActiveTab('verification')}
          className="cursor-pointer p-3 rounded-lg bg-slate-950 border border-amber-900/40 hover:border-amber-700/60 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Requiring Review</span>
            <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {metrics.requiringReview}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Flagged for human operator</p>
        </div>

        {/* 3. Unverified Reports */}
        <div
          onClick={() => setActiveTab('verification')}
          className="cursor-pointer p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Unverified</span>
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {metrics.unverified}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Incoming citizen reports</p>
        </div>

        {/* 4. Possible Duplicates */}
        <div
          onClick={() => setActiveTab('verification')}
          className="cursor-pointer p-3 rounded-lg bg-slate-950 border border-cyan-900/40 hover:border-cyan-700/60 transition-colors"
        >
          <div className="flex items-center justify-between text-xs text-cyan-400 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Possible Duplicates</span>
            <Copy className="w-3.5 h-3.5" />
          </div>
          <div className="text-xl font-bold font-mono text-white tabular-nums">
            {metrics.possibleDuplicates}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">Geographic / narrative matches</p>
        </div>
      </div>
    </div>
  );
};
