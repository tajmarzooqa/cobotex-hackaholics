import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Download,
  Clock,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Users,
  Activity,
  Truck,
  CheckCircle2,
  Flame,
  Radio,
  FileSpreadsheet,
  History,
  Navigation
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { EmergencyCategory, SeverityLevel, IncidentStatus } from '../../types';
import { SeverityBadge, StatusBadge, getCategoryIcon } from '../common/CategoryIcon';
import { TeamCategoryBadge } from '../common/TeamBadge';

export const AnalyticsView: React.FC = () => {
  const { incidents, teams, assignmentHistory, activityHistory, metrics } = useIncidents();

  const [assignmentFilter, setAssignmentFilter] = useState<'ALL' | 'Active' | 'Released'>('ALL');

  const categories: EmergencyCategory[] = [
    'Fire Emergency',
    'Building Collapse',
    'Road Accident',
    'Flood',
    'Medical Emergency',
    'Other Emergencies'
  ];

  const severities: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: IncidentStatus[] = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

  // Priority Score Buckets
  const priorityBuckets = {
    criticalUrgency: incidents.filter((i) => (i.priorityScore ?? 0) >= 80).length,
    highUrgency: incidents.filter((i) => (i.priorityScore ?? 0) >= 60 && (i.priorityScore ?? 0) < 80).length,
    mediumUrgency: incidents.filter((i) => (i.priorityScore ?? 0) >= 40 && (i.priorityScore ?? 0) < 60).length,
    lowUrgency: incidents.filter((i) => (i.priorityScore ?? 0) < 40).length
  };

  const filteredAssignments = assignmentHistory.filter((asg) => {
    if (assignmentFilter !== 'ALL' && asg.status !== assignmentFilter) return false;
    return true;
  });

  const exportAllJSON = () => {
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      metrics,
      incidents,
      responseTeams: teams,
      assignmentHistory,
      activityHistory
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `resq_analytics_full_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAssignmentsCSV = () => {
    const headers = ['Assignment ID', 'Incident ID', 'Incident Title', 'Team ID', 'Team Name', 'Category', 'Distance (km)', 'Assigned At', 'Released At', 'Status'];
    const rows = assignmentHistory.map((a) => [
      `"${a.id}"`,
      `"${a.incidentId}"`,
      `"${a.incidentTitle.replace(/"/g, '""')}"`,
      `"${a.teamId}"`,
      `"${a.teamName.replace(/"/g, '""')}"`,
      `"${a.teamCategory}"`,
      a.distanceKm,
      `"${a.assignedAt}"`,
      `"${a.releasedAt || 'Active'}"`,
      `"${a.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resq_assignments_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-rose-500" />
            <span>Operational Analytics & Response Telemetry</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic telemetry: incident triage distribution, response team readiness, Haversine dispatch metrics, and assignment audit history.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={exportAssignmentsCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 rounded-lg border border-slate-700 transition-colors"
            title="Download assignment history as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Assignments CSV</span>
          </button>
          <button
            onClick={exportAllJSON}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Dynamic Statistics Cards Grid (All Required Round 2 Metrics) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Total Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Incidents</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">{metrics.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All reported events</div>
        </div>

        {/* 2. Critical Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-rose-900/50">
          <div className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Critical Incidents</div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1 tabular-nums">{metrics.critical}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Urgent life-safety</div>
        </div>

        {/* 3. Available Teams */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-900/50">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">Available Teams</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">{metrics.availableTeams}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for dispatch</div>
        </div>

        {/* 4. Busy Teams */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-amber-900/50">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Busy Teams</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{metrics.busyTeams}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deployed on missions</div>
        </div>

        {/* 5. Assigned Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-900/50">
          <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">Assigned Incidents</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1 tabular-nums">
            {metrics.assigned + metrics.inProgress}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.assigned} assigned, {metrics.inProgress} in progress</div>
        </div>

        {/* 6. Resolved Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolved Incidents</div>
          <div className="text-2xl font-bold font-mono text-emerald-300 mt-1 tabular-nums">{metrics.resolved}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.resolutionRate}% resolution rate</div>
        </div>

        {/* 7. Unassigned Incidents */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unassigned Queue</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">{metrics.unassignedIncidents}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting unit assignment</div>
        </div>

        {/* 8. Total Teams */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Teams</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">{metrics.totalTeams}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Registered response units</div>
        </div>

        {/* 9. Average Assignment Time */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Assignment Time</div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1 tabular-nums">
            {metrics.averageAssignmentTimeMinutes}m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Intake to dispatch dispatch</div>
        </div>

        {/* 10. Resolution Rate */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resolution Rate</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {metrics.resolutionRate}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.resolved} of {metrics.total} cleared</div>
        </div>

        {/* 11. Total People Affected */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Casualty Triage</div>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1 tabular-nums">
            {metrics.totalPeopleAffected}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Reported individuals</div>
        </div>

        {/* 12. Verification Queue */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Verified Reports</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {metrics.totalVerified}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.requiringReview} in review triage</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Priority Score Distribution (Feature 1 & 6) */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>Incident Priority Score Distribution</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">0 - 100 Triage Scale</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Critical: 80 - 100 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-400">Critical Urgency (80 - 100 pts)</span>
                <span className="font-mono tabular-nums text-white">
                  {priorityBuckets.criticalUrgency} incidents ({metrics.total > 0 ? Math.round((priorityBuckets.criticalUrgency / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (priorityBuckets.criticalUrgency / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* High: 60 - 79 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-400">High Urgency (60 - 79 pts)</span>
                <span className="font-mono tabular-nums text-white">
                  {priorityBuckets.highUrgency} incidents ({metrics.total > 0 ? Math.round((priorityBuckets.highUrgency / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (priorityBuckets.highUrgency / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Medium: 40 - 59 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-yellow-400">Medium Urgency (40 - 59 pts)</span>
                <span className="font-mono tabular-nums text-white">
                  {priorityBuckets.mediumUrgency} incidents ({metrics.total > 0 ? Math.round((priorityBuckets.mediumUrgency / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-yellow-400 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (priorityBuckets.mediumUrgency / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Low: < 40 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-300">Standard / Low Urgency (&lt; 40 pts)</span>
                <span className="font-mono tabular-nums text-white">
                  {priorityBuckets.lowUrgency} incidents ({metrics.total > 0 ? Math.round((priorityBuckets.lowUrgency / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-slate-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (priorityBuckets.lowUrgency / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 2: Response Team Availability (Feature 2 & 6) */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              <span>Response Team Availability & Fleet Status</span>
            </h3>
            <span className="text-xs font-mono text-emerald-400">
              {metrics.availableTeams} / {metrics.totalTeams} Ready
            </span>
          </div>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-400">Available Teams</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.availableTeams} units ({metrics.totalTeams > 0 ? Math.round((metrics.availableTeams / metrics.totalTeams) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${metrics.totalTeams > 0 ? (metrics.availableTeams / metrics.totalTeams) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-amber-400">Busy / Deployed on Scene</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.busyTeams} units ({metrics.totalTeams > 0 ? Math.round((metrics.busyTeams / metrics.totalTeams) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${metrics.totalTeams > 0 ? (metrics.busyTeams / metrics.totalTeams) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-400">Unavailable / Maintenance</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.unavailableTeams} units ({metrics.totalTeams > 0 ? Math.round((metrics.unavailableTeams / metrics.totalTeams) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-slate-600 transition-all duration-300"
                  style={{ width: `${metrics.totalTeams > 0 ? (metrics.unavailableTeams / metrics.totalTeams) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Incidents by Category */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Incident Distribution by Category</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">{metrics.total} Total</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {categories.map((cat) => {
              const count = metrics.categoryCounts[cat] || 0;
              const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
              const Icon = getCategoryIcon(cat);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{cat}</span>
                    </span>
                    <span className="font-mono text-white tabular-nums">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 4: Incident Lifecycle Status Distribution */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Incident Response Lifecycle Distribution</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">4 Operational States</span>
          </div>

          <div className="space-y-3 pt-1">
            {/* Reported */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-400">Reported (Intake)</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.pending} incidents ({metrics.total > 0 ? Math.round((metrics.pending / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-rose-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.pending / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Assigned */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-cyan-300">Assigned (Team Dispatched)</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.assigned} incidents ({metrics.total > 0 ? Math.round((metrics.assigned / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.assigned / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* In Progress */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-blue-400">In Progress (Active On Scene)</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.inProgress} incidents ({metrics.total > 0 ? Math.round((metrics.inProgress / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.inProgress / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Resolved */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-emerald-400">Resolved (Demobilized)</span>
                <span className="font-mono tabular-nums text-white">
                  {metrics.resolved} incidents ({metrics.total > 0 ? Math.round((metrics.resolved / metrics.total) * 100) : 0}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${metrics.total > 0 ? (metrics.resolved / metrics.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Response Assignment History Log Table (Feature 6 Requirement) */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden space-y-3 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              <span>Response Team Assignment & Dispatch Audit History</span>
            </h3>
            <p className="text-xs text-slate-400">
              Chronological log of response team dispatch assignments, distances, and demobilizations
            </p>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setAssignmentFilter('ALL')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                assignmentFilter === 'ALL'
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All Records ({assignmentHistory.length})
            </button>
            <button
              onClick={() => setAssignmentFilter('Active')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                assignmentFilter === 'Active'
                  ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Active Dispatches
            </button>
            <button
              onClick={() => setAssignmentFilter('Released')}
              className={`px-2.5 py-1 rounded border transition-colors ${
                assignmentFilter === 'Released'
                  ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Demobilized
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-3">Assignment ID / Time</th>
                <th className="py-2.5 px-3">Emergency Incident</th>
                <th className="py-2.5 px-3">Assigned Team</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Haversine Distance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Demobilized Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No assignment records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      <div className="font-bold text-white">{asg.id}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(asg.assignedAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-white text-[11px]">{asg.incidentId}</div>
                      <div className="text-xs text-slate-300 truncate max-w-xs">{asg.incidentTitle}</div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{asg.teamName}</div>
                      <div className="font-mono text-[10px] text-slate-400">{asg.teamId}</div>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <TeamCategoryBadge category={asg.teamCategory} size="sm" />
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-cyan-300 font-bold">
                      {asg.distanceKm} km
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                          asg.status === 'Active'
                            ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {asg.status === 'Active' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                        <span>{asg.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-slate-400">
                      {asg.releasedAt ? (
                        <div>
                          <div>{new Date(asg.releasedAt).toLocaleTimeString()}</div>
                          <div className="text-[10px] text-emerald-400">{asg.releaseReason || 'Released'}</div>
                        </div>
                      ) : (
                        <span className="text-cyan-400 font-semibold">— Active Mission —</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
