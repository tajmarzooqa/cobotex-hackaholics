import React from 'react';
import { ArrowUpRight, MapPin, Users, ChevronRight, Radio, Video } from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { SeverityBadge, StatusBadge, getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';
import { Incident, IncidentStatus } from '../../types';

export const RecentIncidentsTable: React.FC = () => {
  const { incidents, setSelectedIncident, setActiveTab, updateStatus } = useIncidents();

  // Take latest 5 incidents
  const recent = incidents.slice(0, 5);

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Active Incident Stream</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time incoming emergency logs and field status</p>
        </div>
        {incidents.length > 0 && (
          <button
            onClick={() => setActiveTab('incidents')}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
          >
            <span>View All ({incidents.length})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {recent.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-lg bg-slate-950/60 border border-dashed border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white">No emergencies reported yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              The live incident stream is currently clear. Newly submitted emergency reports will appear here automatically.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('report')}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>Report First Incident</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Incident ID</th>
              <th className="py-2.5 px-3">Emergency</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Severity</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Impact</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {recent.map((incident) => {
              const Icon = getCategoryIcon(incident.category);
              const colors = getCategoryColor(incident.category);

              const isSOS = incident.isSOS || incident.tags?.includes('sos-alert');

              return (
                <tr
                  key={incident.id}
                  className={`transition-colors group cursor-pointer ${
                    isSOS
                      ? 'bg-rose-950/25 hover:bg-rose-950/45 border-l-2 border-l-rose-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <td className="py-3 px-3 font-mono font-medium text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{incident.id}</span>
                      {isSOS && (
                        <span className="inline-flex items-center gap-1 font-bold font-mono text-[10px] text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-600 animate-pulse">
                          <Radio className="w-2.5 h-2.5 text-rose-400" />
                          <span>SOS</span>
                        </span>
                      )}
                      {incident.hasVideoEvidence && (
                        <span className="inline-flex items-center gap-1 font-bold font-mono text-[9px] text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-600/70" title="Emergency Video Attached">
                          <Video className="w-2.5 h-2.5 text-amber-400" />
                          <span>VIDEO</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {getRelativeTime(incident.timestamp)}
                    </div>
                  </td>

                  <td className="py-3 px-3 max-w-xs">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded flex items-center justify-center border shrink-0 ${
                          isSOS
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm shadow-rose-900/60'
                            : `${colors.bg} ${colors.border} ${colors.text}`
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-sm flex items-center gap-1.5">
                          <span className="truncate">{incident.title}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                          <span>{incident.category}</span>
                          {isSOS && <span className="text-rose-400 font-semibold font-mono text-[10px]">· 1-Tap Beacon</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                    <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{incident.location.address}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">{incident.location.zone}</div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <SeverityBadge severity={incident.severity} />
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={incident.status}
                      onChange={(e) => {
                        updateStatus(incident.id, e.target.value as IncidentStatus);
                      }}
                      className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="Reported">Reported</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                    <div className="flex items-center gap-1 font-mono tabular-nums">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{incident.affectedCount}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors inline-flex items-center gap-1"
                    >
                      <span>Details</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};
