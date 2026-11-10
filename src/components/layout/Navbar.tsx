import React from 'react';
import {
  ShieldAlert,
  PlusCircle,
  Menu,
  X,
  RotateCcw,
  Sparkles,
  Radio
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onActivateSOS?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen, onActivateSOS }) => {
  const { setActiveTab, clearAllIncidents, metrics } = useIncidents();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-6 px-4 sm:px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      {/* Zone 1: Single text element wordmark with icon */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="flex items-center gap-2.5 text-slate-100 group"
        >
          <div className="w-9 h-9 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-900/50 group-hover:bg-rose-500 transition-colors">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-white leading-none">
              ResQ
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mt-0.5">
              Emergency Response Platform
            </span>
          </div>
        </a>
      </div>

      {/* Zone 2: Contextual Live Summary Indicators */}
      <div className="hidden md:flex items-center gap-4 text-xs font-medium text-slate-400">
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-md">
          <span className="text-slate-400">Active Incidents</span>
          <span className="text-white font-mono font-semibold tabular-nums">
            {metrics.pending + metrics.inProgress}
          </span>
          {metrics.critical > 0 && (
            <span className="flex items-center gap-1 text-rose-400 font-mono font-semibold tabular-nums ml-1 pl-2 border-l border-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {metrics.critical} Critical
            </span>
          )}
        </div>

        {metrics.total > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all incidents from local storage?')) {
                clearAllIncidents();
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-rose-300 bg-slate-900/60 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800 rounded-md transition-colors"
            title="Clear all stored incidents"
          >
            <RotateCcw className="w-3 h-3 text-slate-400" />
            <span>Clear All Incidents</span>
          </button>
        )}
      </div>

      {/* Zone 3: SOS and primary action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onActivateSOS}
          className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-black tracking-wider text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg shadow-md shadow-red-950/60 transition-all border border-red-400/60 animate-pulse whitespace-nowrap active:scale-95 cursor-pointer"
          title="Instant One-Tap SOS Emergency Activation"
        >
          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
          <Radio className="w-3.5 h-3.5 text-white" />
          <span>SOS HELP</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 text-rose-400" />
          <span>Report Incident</span>
        </button>
      </div>
    </header>
  );
};
