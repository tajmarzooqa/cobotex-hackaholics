import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Radio,
  Flame,
  Truck,
  Users,
  Clock,
  MapPin,
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Filter,
  Search,
  Eye,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Star,
  Navigation,
  Info
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import {
  Incident,
  ResponseTeam,
  EmergencyCategory,
  SeverityLevel,
  IncidentStatus,
  ResponseTeamCategory
} from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { SeverityBadge, StatusBadge, getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';
import { TeamCategoryBadge, TeamAvailabilityBadge } from '../common/TeamBadge';
import { getTeamRecommendations, TeamRecommendation } from '../../utils/geoUtils';

export const DispatchCenter: React.FC = () => {
  const {
    incidents,
    teams,
    metrics,
    assignTeamToIncident,
    releaseTeamFromIncident,
    updateStatus,
    overridePriorityScore,
    setSelectedIncident
  } = useIncidents();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNASSIGNED' | IncidentStatus>('UNASSIGNED');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<EmergencyCategory | 'ALL'>('ALL');

  // Selected incident in the dispatch console
  const [focusedIncidentId, setFocusedIncidentId] = useState<string | null>(null);

  // Modals state
  const [teamToConfirmAssign, setTeamToConfirmAssign] = useState<{
    incident: Incident;
    rec: TeamRecommendation;
  } | null>(null);

  const [confirmReleaseTeam, setConfirmReleaseTeam] = useState<{
    incident: Incident;
    teamId: string;
    teamName: string;
  } | null>(null);

  const [overrideModalIncident, setOverrideModalIncident] = useState<Incident | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<number>(85);
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sort incidents by priority score descending
  const prioritySortedIncidents = useMemo(() => {
    return [...incidents].sort((a, b) => {
      if ((b.priorityScore ?? 0) !== (a.priorityScore ?? 0)) {
        return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
      }
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  }, [incidents]);

  // Filtered queue
  const filteredQueue = useMemo(() => {
    return prioritySortedIncidents.filter((inc) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          inc.id.toLowerCase().includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.location.address.toLowerCase().includes(q) ||
          inc.category.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (statusFilter === 'UNASSIGNED') {
        if (inc.status === 'Resolved' || inc.assignedTeamId || inc.assignedResourceIds?.length > 0) {
          return false;
        }
      } else if (statusFilter !== 'ALL' && inc.status !== statusFilter) {
        return false;
      }

      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (categoryFilter !== 'ALL' && inc.category !== categoryFilter) return false;

      return true;
    });
  }, [prioritySortedIncidents, searchQuery, statusFilter, severityFilter, categoryFilter]);

  // Active focused incident for recommendation computation
  const activeIncident = useMemo(() => {
    if (focusedIncidentId) {
      const found = incidents.find((i) => i.id === focusedIncidentId);
      if (found) return found;
    }
    return filteredQueue.length > 0 ? filteredQueue[0] : incidents[0] || null;
  }, [focusedIncidentId, incidents, filteredQueue]);

  // Compute recommendations for the focused incident
  const recommendations = useMemo(() => {
    if (!activeIncident) return null;
    return getTeamRecommendations(
      activeIncident.location.lat,
      activeIncident.location.lng,
      activeIncident.category,
      teams
    );
  }, [activeIncident, teams]);

  const handleAssignTeam = () => {
    if (!teamToConfirmAssign) return;
    const { incident, rec } = teamToConfirmAssign;
    const result = assignTeamToIncident(incident.id, rec.team.id);

    if (result.success) {
      setFeedbackBanner({ message: result.message, isError: false });
    } else {
      setFeedbackBanner({ message: result.message, isError: true });
    }
    setTeamToConfirmAssign(null);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleReleaseTeam = () => {
    if (!confirmReleaseTeam) return;
    const { incident, teamId, teamName } = confirmReleaseTeam;
    releaseTeamFromIncident(incident.id, teamId, 'Manual Dispatch Reassignment');
    setFeedbackBanner({
      message: `Released team ${teamName} from ${incident.id}. Team is now Available.`,
      isError: false
    });
    setConfirmReleaseTeam(null);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalIncident) return;
    overridePriorityScore(
      overrideModalIncident.id,
      overrideScoreInput,
      overrideReasonInput || 'Supervisor manual adjustment'
    );
    setFeedbackBanner({
      message: `Priority score for ${overrideModalIncident.id} updated to ${overrideScoreInput}/100.`,
      isError: false
    });
    setOverrideModalIncident(null);
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Simulation & Disclaimer Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">
              Emergency Dispatch Coordination & Nearest-Team Assignment Engine:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Distances calculated via the <strong>Haversine Great-Circle Formula</strong>.
              Recommendations filter by response team specialization. This is a hackathon simulation—no real emergency vehicles or live 911 CAD units are dispatched.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Unassigned Queue</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1 tabular-nums">
            {metrics.unassignedIncidents}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Awaiting team dispatch</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned / Active</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
            {metrics.assigned + metrics.inProgress}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{metrics.assigned} assigned, {metrics.inProgress} active</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Available Teams</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {metrics.availableTeams}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Ready for immediate dispatch</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Busy Teams</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {metrics.busyTeams}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deployed on incident scene</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Critical Emergencies</div>
          <div className="text-2xl font-bold font-mono text-rose-500 mt-1 tabular-nums">
            {metrics.critical}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Top triage priority</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Avg Dispatch Time</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {metrics.averageAssignmentTimeMinutes}m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">From intake to assignment</div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
            feedbackBanner.isError
              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Split Console: Priority Queue (Left) & Recommendation / Dispatch Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Priority Queue (Feature 1) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Dynamic Priority Queue</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time algorithmic scoring (Severity + Affected + Elapsed Time + Urgency Weight)
                </p>
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter queue..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Quick Filters */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('UNASSIGNED')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  statusFilter === 'UNASSIGNED'
                    ? 'bg-rose-950/80 border-rose-700 text-rose-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Needs Dispatch ({metrics.unassignedIncidents})
              </button>

              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Incidents ({incidents.length})
              </button>

              <button
                onClick={() => setStatusFilter('Assigned')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  statusFilter === 'Assigned'
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Assigned ({metrics.assigned})
              </button>

              <button
                onClick={() => setStatusFilter('In Progress')}
                className={`px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  statusFilter === 'In Progress'
                    ? 'bg-blue-950/80 border-blue-700 text-blue-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                In Progress ({metrics.inProgress})
              </button>

              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded px-2 py-1 ml-auto"
              >
                <option value="ALL">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {/* Queue Items List */}
          <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                No incidents match your filter criteria in the dispatch queue.
              </div>
            ) : (
              filteredQueue.map((inc) => {
                const isFocused = activeIncident?.id === inc.id;
                const hasAssignedTeam = !!inc.assignedTeamId || (inc.assignedResourceIds && inc.assignedResourceIds.length > 0);
                const Icon = getCategoryIcon(inc.category);
                const colors = getCategoryColor(inc.category);

                return (
                  <div
                    key={inc.id}
                    onClick={() => setFocusedIncidentId(inc.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isFocused
                        ? 'bg-slate-900 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 mt-0.5 ${colors.bg} ${colors.border} ${colors.text}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-white">
                              {inc.id}
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {getRelativeTime(inc.timestamp)}
                            </span>
                            <span className="text-slate-600">·</span>
                            <SeverityBadge severity={inc.severity} />
                            <StatusBadge status={inc.status} />
                          </div>

                          <h4 className="text-xs font-bold text-white truncate mt-1">
                            {inc.title}
                          </h4>

                          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 truncate max-w-[220px]">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                              <span className="truncate">{inc.location.address}</span>
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
                              <Users className="w-3 h-3 text-slate-400" />
                              {inc.affectedCount} affected
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Priority Score & Rank */}
                      <div className="shrink-0 flex flex-col items-end gap-1.5">
                        <PriorityBadge
                          score={inc.priorityScore ?? 50}
                          rank={inc.priorityRank}
                          breakdown={inc.priorityBreakdown}
                          onOverrideRequest={() => {
                            setOverrideModalIncident(inc);
                            setOverrideScoreInput(inc.priorityScore ?? 75);
                            setOverrideReasonInput(inc.priorityBreakdown?.overrideReason || '');
                          }}
                        />

                        {hasAssignedTeam ? (
                          <div className="font-mono text-[10px] text-cyan-300 bg-cyan-950/70 border border-cyan-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="truncate max-w-[120px]">{inc.assignedTeamName || inc.assignedUnits[0] || 'Team Deployed'}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-mono font-semibold bg-rose-950/60 border border-rose-900 px-1.5 py-0.5 rounded">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Nearest Suitable Team Recommendation & Dispatch Panel (Feature 3 & 4) */}
        <div className="lg:col-span-5 space-y-4">
          {activeIncident ? (
            <div className="p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              {/* Active Incident Header */}
              <div className="pb-3 border-b border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Dispatch Command Console</span>
                  </span>
                  <button
                    onClick={() => setSelectedIncident(activeIncident)}
                    className="text-xs text-cyan-400 hover:text-cyan-300 underline font-medium flex items-center gap-1"
                  >
                    <span>Full Incident File</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{activeIncident.id}</span>
                    <span className="text-slate-600">·</span>
                    <StatusBadge status={activeIncident.status} />
                    <span className="text-slate-600">·</span>
                    <SeverityBadge severity={activeIncident.severity} />
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1 leading-snug">
                    {activeIncident.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate">{activeIncident.location.address}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                    Coordinates: {activeIncident.location.lat.toFixed(4)}, {activeIncident.location.lng.toFixed(4)}
                  </div>
                </div>

                {/* Currently Assigned Team Card if already assigned */}
                {activeIncident.assignedTeamId && (
                  <div className="p-3 rounded-lg bg-cyan-950/50 border border-cyan-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Currently Assigned Response Team</span>
                      </span>
                      <button
                        onClick={() =>
                          setConfirmReleaseTeam({
                            incident: activeIncident,
                            teamId: activeIncident.assignedTeamId!,
                            teamName: activeIncident.assignedTeamName || activeIncident.assignedTeamId!
                          })
                        }
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium underline"
                      >
                        Release Team
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{activeIncident.assignedTeamName}</span>
                      <span className="font-mono text-[11px] text-cyan-300">
                        {activeIncident.assignedTeamId}
                      </span>
                    </div>

                    {/* Quick status transition action buttons */}
                    <div className="pt-2 border-t border-cyan-900/60 flex items-center justify-between gap-2">
                      {activeIncident.status === 'Assigned' && (
                        <button
                          onClick={() => updateStatus(activeIncident.id, 'In Progress')}
                          className="w-full py-1.5 px-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded transition-colors"
                        >
                          Mark Response In Progress
                        </button>
                      )}
                      {activeIncident.status === 'In Progress' && (
                        <button
                          onClick={() => updateStatus(activeIncident.id, 'Resolved')}
                          className="w-full py-1.5 px-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors"
                        >
                          Resolve & Demobilize Team
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Haversine Nearest Recommendations (Feature 3) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Suitable Response Teams (Haversine Ranked)</span>
                  </h4>
                  <span className="text-[11px] font-mono text-emerald-400">
                    {recommendations?.suitableAvailableTeams.length || 0} Available
                  </span>
                </div>

                {/* If No Suitable Team Available */}
                {recommendations && recommendations.suitableAvailableTeams.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-2 text-xs text-amber-200">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>No Suitable Response Teams Currently Available</span>
                    </div>
                    <p className="text-[11px] text-amber-200/90 leading-relaxed">
                      All specialized response units for <strong>{activeIncident.category}</strong> are either deployed on active incidents or temporarily out of service.
                    </p>
                    <div className="text-[10px] text-slate-300 pt-1">
                      Action: Release an assigned team from another resolved incident, or select a secondary team category below.
                    </div>
                  </div>
                ) : null}

                {/* Nearest Recommended Team (Highlight #1) */}
                {recommendations?.nearestSuitableAvailableTeam && (
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/70 to-slate-900 border border-emerald-600/70 space-y-2 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase font-bold text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-700">
                        <Star className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                        <span>#1 Recommended Nearest Team</span>
                      </span>

                      <span className="font-mono text-xs font-bold text-white bg-black/40 px-2 py-0.5 rounded border border-white/10">
                        {recommendations.nearestSuitableAvailableTeam.distanceKm} km ({recommendations.nearestSuitableAvailableTeam.distanceMiles} mi)
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-white text-xs">
                        {recommendations.nearestSuitableAvailableTeam.team.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Base: {recommendations.nearestSuitableAvailableTeam.team.assignedLocation}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <TeamCategoryBadge category={recommendations.nearestSuitableAvailableTeam.team.category} size="sm" />
                        <span className="text-[11px] text-emerald-300 font-mono">
                          ~{recommendations.nearestSuitableAvailableTeam.estimatedTransitMinutes} mins ETA
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setTeamToConfirmAssign({
                          incident: activeIncident,
                          rec: recommendations.nearestSuitableAvailableTeam!
                        })
                      }
                      className="w-full mt-2 py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950 transition-all flex items-center justify-center gap-2"
                    >
                      <Radio className="w-3.5 h-3.5" />
                      <span>Dispatch Nearest Team</span>
                    </button>
                  </div>
                )}

                {/* Other Suitable Available Teams */}
                {recommendations?.suitableAvailableTeams && recommendations.suitableAvailableTeams.length > 1 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Other Suitable Available Teams
                    </div>

                    {recommendations.suitableAvailableTeams.slice(1).map((rec) => (
                      <div
                        key={rec.team.id}
                        className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-slate-400 font-bold">
                              Rank #{rec.recommendationRank}
                            </span>
                            <span className="font-semibold text-white truncate max-w-[180px]">
                              {rec.team.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate mt-0.5">
                            {rec.team.assignedLocation} · {rec.distanceKm} km away
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setTeamToConfirmAssign({
                              incident: activeIncident,
                              rec
                            })
                          }
                          className="shrink-0 px-2.5 py-1 text-xs font-semibold text-emerald-300 hover:text-white bg-slate-900 hover:bg-emerald-900/60 border border-emerald-800/80 rounded transition-colors"
                        >
                          Assign
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Busy Response Teams for visibility */}
                {recommendations?.suitableBusyTeams && recommendations.suitableBusyTeams.length > 0 && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Currently Deployed / Busy Teams ({recommendations.suitableBusyTeams.length})
                    </div>
                    {recommendations.suitableBusyTeams.slice(0, 3).map((rec) => (
                      <div
                        key={rec.team.id}
                        className="p-2.5 rounded bg-slate-950/40 border border-slate-800/80 flex items-center justify-between text-xs text-slate-400"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-300 truncate max-w-[190px]">
                            {rec.team.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Assigned to {rec.team.assignedIncidentId} · {rec.distanceKm} km away
                          </div>
                        </div>
                        <TeamAvailabilityBadge availability={rec.team.availability} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
              Select an incident from the Priority Queue to evaluate nearest response teams and coordinates.
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal: Dispatch & Assign Team (Feature 4 requirement) */}
      {teamToConfirmAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Radio className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Confirm Team Dispatch & Assignment</h3>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Incident:</span>
                <span className="font-mono font-bold text-white">{teamToConfirmAssign.incident.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Incident Title:</span>
                <span className="text-white font-medium truncate max-w-[200px]">
                  {teamToConfirmAssign.incident.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Team:</span>
                <span className="font-semibold text-emerald-400">
                  {teamToConfirmAssign.rec.team.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Category:</span>
                <span className="text-slate-300">{teamToConfirmAssign.rec.team.category}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Calculated Distance:</span>
                <span className="font-mono text-cyan-300">
                  {teamToConfirmAssign.rec.distanceKm} km ({teamToConfirmAssign.rec.distanceMiles} mi)
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Upon assignment, this team's availability will immediately change to <strong>Busy</strong> and the incident status will transition to <strong>Assigned</strong>.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTeamToConfirmAssign(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignTeam}
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950"
              >
                Confirm Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Release Assigned Team */}
      {confirmReleaseTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-400">
              <RotateCcw className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Confirm Team Release & Demobilization</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to release <strong>{confirmReleaseTeam.teamName}</strong> from incident{' '}
              <strong>{confirmReleaseTeam.incident.id}</strong>? The team will return to <strong>Available</strong> readiness.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmReleaseTeam(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseTeam}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-950"
              >
                Release Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Administrator Priority Review & Override (Feature 1) */}
      {overrideModalIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleSaveOverride}
            className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Sliders className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Administrator Priority Review</h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideModalIncident(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Adjust the algorithmic priority score for <strong>{overrideModalIncident.id}</strong> based on on-scene intelligence.
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">New Priority Score:</span>
                  <span className="font-mono font-bold text-white text-sm tabular-nums">
                    {overrideScoreInput} / 100
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={overrideScoreInput}
                  onChange={(e) => setOverrideScoreInput(parseInt(e.target.value, 10))}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Triage Rationale / Operator Reason:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Hazardous materials stored in basement escalating risk; priority elevated."
                  value={overrideReasonInput}
                  onChange={(e) => setOverrideReasonInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setOverrideModalIncident(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-950"
              >
                Apply Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
