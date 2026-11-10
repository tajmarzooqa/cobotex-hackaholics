import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  HelpCircle,
  Copy,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  Eye,
  MessageSquare,
  History,
  MapPin,
  Users,
  ExternalLink,
  Info,
  ArrowRight,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { Incident, VerificationStatus, DuplicateMatch, SuspiciousIndicator } from '../../types';
import { VerificationBadge } from '../common/VerificationBadge';
import { SeverityBadge, getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';

export const VerificationPanel: React.FC = () => {
  const {
    incidents,
    metrics,
    updateVerificationStatus,
    setSelectedIncident
  } = useIncidents();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'REVIEW_QUEUE' | VerificationStatus | 'HAS_DUPLICATES'>('REVIEW_QUEUE');
  const [inspectingIncident, setInspectingIncident] = useState<Incident | null>(null);
  const [verificationNoteInput, setVerificationNoteInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const filteredIncidents = incidents.filter(incident => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        incident.id.toLowerCase().includes(q) ||
        incident.title.toLowerCase().includes(q) ||
        incident.location.address.toLowerCase().includes(q) ||
        (incident.reporter.name && incident.reporter.name.toLowerCase().includes(q)) ||
        (incident.duplicateMatches && incident.duplicateMatches.some(d => d.matchedIncidentId.toLowerCase().includes(q)));
      if (!match) return false;
    }

    // Status / Mode filter
    const vStatus = incident.verificationStatus || 'Unverified';
    const hasDupes = incident.duplicateMatches && incident.duplicateMatches.length > 0;
    const hasSuspicious = incident.suspiciousIndicators && incident.suspiciousIndicators.length > 0;

    if (statusFilter === 'REVIEW_QUEUE') {
      return vStatus === 'Under Review' || hasDupes || hasSuspicious || vStatus === 'Unverified';
    }
    if (statusFilter === 'HAS_DUPLICATES') {
      return hasDupes;
    }
    if (statusFilter !== 'ALL') {
      return vStatus === statusFilter;
    }

    return true;
  });

  const handleUpdateStatus = (incidentId: string, newStatus: VerificationStatus, note?: string) => {
    updateVerificationStatus(incidentId, newStatus, note || verificationNoteInput.trim() || undefined);
    setActionSuccessMessage(`Report ${incidentId} marked as ${newStatus}.`);
    setVerificationNoteInput('');
    setTimeout(() => setActionSuccessMessage(null), 3000);

    // Keep active inspection modal synced
    if (inspectingIncident && inspectingIncident.id === incidentId) {
      const updated = incidents.find(i => i.id === incidentId);
      if (updated) {
        setInspectingIncident({
          ...updated,
          verificationStatus: newStatus
        });
      }
    }
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-5">
      {/* Policy Notice: Never automatically reject/delete */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">
              Intelligent Incident Verification & Human Review Policy:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Spatial correlation and algorithmic indicators assist dispatchers in prioritizing review.
              In accordance with life-safety protocols, reports are <strong className="text-slate-200">never automatically classified as fake, rejected, or deleted</strong> without authorized human administrator inspection.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Statistic Cards (Requirement 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Verified Reports */}
        <div
          onClick={() => setStatusFilter('Verified')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-emerald-900/50 hover:border-emerald-700/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.totalVerified}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Confirmed authentic incidents</div>
        </div>

        {/* Reports Requiring Review */}
        <div
          onClick={() => setStatusFilter('REVIEW_QUEUE')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-amber-900/50 hover:border-amber-700/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Requiring Review</span>
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.requiringReview}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{metrics.underReview} marked Under Review</div>
        </div>

        {/* Unverified Reports */}
        <div
          onClick={() => setStatusFilter('Unverified')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Unverified Reports</span>
            <HelpCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.unverified}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending verification triage</div>
        </div>

        {/* Possible Duplicates */}
        <div
          onClick={() => setStatusFilter('HAS_DUPLICATES')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50 hover:border-cyan-700/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-cyan-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Possible Duplicates</span>
            <Copy className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.possibleDuplicates}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Spatial & narrative overlaps</div>
        </div>
      </div>

      {/* Success alert */}
      {actionSuccessMessage && (
        <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Control Bar: Search and Filters */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reports by ID, location, or matching duplicate..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-white">{filteredIncidents.length}</strong> reports in queue
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setStatusFilter('REVIEW_QUEUE')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'REVIEW_QUEUE'
                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Review Queue ({metrics.requiringReview})
          </button>
          <button
            onClick={() => setStatusFilter('HAS_DUPLICATES')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'HAS_DUPLICATES'
                ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Duplicates Detected ({metrics.possibleDuplicates})
          </button>
          <button
            onClick={() => setStatusFilter('Verified')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'Verified'
                ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Verified ({metrics.totalVerified})
          </button>
          <button
            onClick={() => setStatusFilter('Unverified')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'Unverified'
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unverified ({metrics.unverified})
          </button>
          <button
            onClick={() => setStatusFilter('Unable to Verify')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'Unable to Verify'
                ? 'bg-slate-800 border-slate-700 text-slate-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Unable to Verify ({metrics.unableToVerify})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            All Reports ({incidents.length})
          </button>
        </div>
      </div>

      {/* Main Verification Table (Requirement 4) */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-3.5">Incident ID</th>
                <th className="py-3 px-3.5">Reported Location</th>
                <th className="py-3 px-3.5">Submission Time</th>
                <th className="py-3 px-3.5">Verification Status</th>
                <th className="py-3 px-3.5">Duplicate Matches</th>
                <th className="py-3 px-3.5">Reasons for Review</th>
                <th className="py-3 px-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No reports found matching current verification filter.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => {
                  const hasDuplicates = incident.duplicateMatches && incident.duplicateMatches.length > 0;
                  const hasSuspicious = incident.suspiciousIndicators && incident.suspiciousIndicators.length > 0;
                  const vStatus = incident.verificationStatus || 'Unverified';

                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setInspectingIncident(incident)}
                    >
                      {/* ID & Title */}
                      <td className="py-3.5 px-3.5 font-mono whitespace-nowrap">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{incident.id}</span>
                          <SeverityBadge severity={incident.severity} />
                        </div>
                        <div className="text-[11px] text-slate-300 font-sans font-medium truncate max-w-xs mt-0.5">
                          {incident.title}
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{incident.location.address}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{incident.location.zone}</div>
                      </td>

                      {/* Submission Time */}
                      <td className="py-3.5 px-3.5 text-slate-300 whitespace-nowrap font-mono text-[11px]">
                        <div>{new Date(incident.timestamp).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {getRelativeTime(incident.timestamp)}
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap">
                        <VerificationBadge status={vStatus} size="sm" />
                        {incident.verifiedBy && vStatus === 'Verified' && (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                            By {incident.verifiedBy}
                          </div>
                        )}
                      </td>

                      {/* Possible Duplicate Matches */}
                      <td className="py-3.5 px-3.5">
                        {hasDuplicates ? (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {incident.duplicateMatches?.map(d => (
                              <button
                                key={d.matchedIncidentId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target = incidents.find(i => i.id === d.matchedIncidentId);
                                  if (target) setSelectedIncident(target);
                                }}
                                className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800 px-1.5 py-0.5 rounded hover:bg-cyan-900/80 transition-colors"
                                title={`Matched with ${d.matchedIncidentId}: ${d.similarityScore}% similarity. Click to view.`}
                              >
                                <span>{d.matchedIncidentId}</span>
                                <span className="opacity-75">({d.similarityScore}%)</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 font-mono">None</span>
                        )}
                      </td>

                      {/* Reasons for Review */}
                      <td className="py-3.5 px-3.5 max-w-xs">
                        <div className="space-y-1">
                          {hasDuplicates && (
                            <span className="inline-block text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.2 rounded font-medium mr-1">
                              Duplicate Candidate
                            </span>
                          )}
                          {hasSuspicious ? (
                            incident.suspiciousIndicators?.map((ind, i) => (
                              <div
                                key={i}
                                className="text-[11px] text-amber-300/90 leading-tight truncate"
                                title={ind.message}
                              >
                                · {ind.message}
                              </div>
                            ))
                          ) : !hasDuplicates && vStatus === 'Verified' ? (
                            <span className="text-[11px] text-emerald-400">
                              Direct field/camera verification
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              Standard citizen intake
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {vStatus !== 'Verified' && (
                            <button
                              onClick={() => handleUpdateStatus(incident.id, 'Verified', 'Administrator direct verification')}
                              className="px-2 py-1 text-xs font-semibold text-emerald-300 hover:text-white bg-slate-900 hover:bg-emerald-950/80 border border-emerald-800/80 rounded transition-colors"
                              title="Mark report as Verified"
                            >
                              Verify
                            </button>
                          )}
                          {vStatus !== 'Under Review' && (
                            <button
                              onClick={() => handleUpdateStatus(incident.id, 'Under Review', 'Queued for detailed verification')}
                              className="px-2 py-1 text-xs font-medium text-amber-300 hover:text-white bg-slate-900 hover:bg-amber-950/80 border border-amber-800/80 rounded transition-colors"
                              title="Mark as Under Review"
                            >
                              Review
                            </button>
                          )}
                          <button
                            onClick={() => setInspectingIncident(incident)}
                            className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                            title="Open full verification console & audit trail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspecting & Verification Detail Drawer / Modal */}
      {inspectingIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono uppercase font-bold text-rose-400">
                    Verification Console & Review
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="font-mono text-xs font-bold text-white">{inspectingIncident.id}</span>
                  <span className="text-slate-600">·</span>
                  <VerificationBadge status={inspectingIncident.verificationStatus || 'Unverified'} />
                </div>
                <h3 className="text-base font-bold text-white mt-1">
                  {inspectingIncident.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                  <span>Category: <strong className="text-slate-200">{inspectingIncident.category}</strong></span>
                  <span>·</span>
                  <span>Location: <strong className="text-slate-200">{inspectingIncident.location.address}</strong></span>
                </div>
              </div>

              <button
                onClick={() => setInspectingIncident(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
              {/* Duplicate Matches Box (Requirement 2) */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Copy className="w-4 h-4 text-cyan-400" />
                    <span>Possible Duplicate Matches</span>
                  </h4>
                  <span className="font-mono text-[11px] text-cyan-300">
                    {inspectingIncident.duplicateMatches?.length || 0} match(es) detected
                  </span>
                </div>

                {(!inspectingIncident.duplicateMatches || inspectingIncident.duplicateMatches.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">
                    No matching duplicate reports found within spatial, temporal, or narrative thresholds.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inspectingIncident.duplicateMatches.map((dm) => {
                      const matched = incidents.find(i => i.id === dm.matchedIncidentId);
                      return (
                        <div
                          key={dm.matchedIncidentId}
                          className="p-3 rounded bg-slate-900 border border-cyan-800/60 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-cyan-300">
                                {dm.matchedIncidentId}
                              </span>
                              <span className="text-xs font-semibold text-white">
                                {matched?.title || 'Matching incident report'}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {dm.similarityScore}% Match
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-400">
                            {dm.reasons.map((r, ri) => (
                              <span key={ri} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                                {r}
                              </span>
                            ))}
                          </div>

                          {matched && (
                            <div className="pt-1 flex justify-end">
                              <button
                                onClick={() => {
                                  setSelectedIncident(matched);
                                  setInspectingIncident(null);
                                }}
                                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                              >
                                <span>Inspect Matched Incident</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reasons for Review & Suspicious Indicators (Requirement 3) */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Reasons for Review & Suspicious Indicators</span>
                </h4>

                {(!inspectingIncident.suspiciousIndicators || inspectingIncident.suspiciousIndicators.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">
                    No suspicious anomalies or conflicting indicators detected. Report structure is normal.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {inspectingIncident.suspiciousIndicators.map((ind, idx) => (
                      <div
                        key={idx}
                        className={`p-2.5 rounded border text-xs space-y-1 ${
                          ind.level === 'high'
                            ? 'bg-rose-950/50 border-rose-800/80 text-rose-200'
                            : 'bg-amber-950/50 border-amber-800/80 text-amber-200'
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase font-bold">
                          <span>Check: {ind.type.replace('_', ' ')}</span>
                          <span>Priority: {ind.level}</span>
                        </div>
                        <p className="text-xs leading-relaxed">{ind.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Verification Status Action Box (Requirement 4) */}
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Update Verification Status & Operator Notes
                </h4>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    placeholder="Enter verification notes (e.g., 'Called reporter back to verify smoke visibility', 'Police patrol 204 confirmed collision')..."
                    value={verificationNoteInput}
                    onChange={(e) => setVerificationNoteInput(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500 leading-relaxed"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleUpdateStatus(inspectingIncident.id, 'Verified')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                        inspectingIncident.verificationStatus === 'Verified'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-900 text-emerald-300 border-emerald-800 hover:bg-emerald-950'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Verified</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(inspectingIncident.id, 'Under Review')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                        inspectingIncident.verificationStatus === 'Under Review'
                          ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                          : 'bg-slate-900 text-amber-300 border-amber-800 hover:bg-amber-950'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Under Review</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(inspectingIncident.id, 'Unable to Verify')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                        inspectingIncident.verificationStatus === 'Unable to Verify'
                          ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
                          : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Unable to Verify</span>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(inspectingIncident.id, 'Unverified')}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                        inspectingIncident.verificationStatus === 'Unverified'
                          ? 'bg-slate-700 text-white border-slate-600 shadow-sm'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Unverified</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Audit History Log (Requirement 5) */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Verification Audit History ({inspectingIncident.verificationHistory?.length || 0})</span>
                </h4>

                <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                  {(!inspectingIncident.verificationHistory || inspectingIncident.verificationHistory.length === 0) ? (
                    <div className="text-xs text-slate-500 italic">
                      No prior verification transitions recorded.
                    </div>
                  ) : (
                    inspectingIncident.verificationHistory.map((rec) => (
                      <div key={rec.id} className="relative space-y-1">
                        <div className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                        <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                          <span className="font-semibold text-white">
                            {rec.previousStatus} → <span className="text-emerald-400">{rec.newStatus}</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(rec.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Officer / System: <strong className="text-slate-300">{rec.author}</strong>
                        </div>
                        {rec.note && (
                          <p className="text-xs text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/80">
                            {rec.note}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={() => {
                  setSelectedIncident(inspectingIncident);
                  setInspectingIncident(null);
                }}
                className="text-xs text-rose-400 hover:text-rose-300 underline font-medium"
              >
                Open Full Incident Command File
              </button>
              <button
                onClick={() => setInspectingIncident(null)}
                className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
