import React from 'react';
import { AlertTriangle, ArrowRight, ShieldAlert, Users, MapPin } from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

export const CriticalAlertBanner: React.FC = () => {
  const { incidents, setSelectedIncident, setActiveTab } = useIncidents();

  // Find active critical incidents (prioritizing SOS beacons)
  const activeCritical = incidents
    .filter(i => (i.severity === 'Critical' || i.isSOS) && i.status !== 'Resolved')
    .sort((a, b) => (b.isSOS ? 1 : 0) - (a.isSOS ? 1 : 0) || (b.priorityScore ?? 0) - (a.priorityScore ?? 0));

  if (activeCritical.length === 0) return null;

  const topCritical = activeCritical[0];
  const isSOS = topCritical.isSOS;

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 sm:p-5 shadow-lg ${
      isSOS
        ? 'bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 border-red-500 shadow-red-950/60 ring-2 ring-red-500/40 animate-pulse'
        : 'bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-rose-600/60 shadow-rose-950/30'
    }`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-900/60">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-1.5">
                {isSOS && <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />}
                {isSOS ? '🚨 ACTIVE ONE-TAP SOS BEACON' : 'CRITICAL DISASTER ALERT'} ({activeCritical.length} Active)
              </span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-xs text-rose-200/90 font-mono">{topCritical.id}</span>
              <span className="text-slate-500" aria-hidden="true">·</span>
              <span className="text-xs text-slate-300 font-medium">{topCritical.category}</span>
            </div>

            <h3 className="text-base font-bold text-white text-wrap">
              {topCritical.title}
            </h3>

            <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap pt-0.5">
              <span className="flex items-center gap-1.5 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate max-w-xs">{topCritical.location.address}</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Users className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="font-mono tabular-nums">{topCritical.affectedCount} individuals affected</span>
              </span>
              <span className="text-slate-400">
                Status: <span className="text-white font-medium">{topCritical.status}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={() => {
              setSelectedIncident(topCritical);
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            <span>Triage & Dispatch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {activeCritical.length > 1 && (
            <button
              onClick={() => setActiveTab('incidents')}
              className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap"
            >
              View All ({activeCritical.length})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
