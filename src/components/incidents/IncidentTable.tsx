import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  MapPin,
  Users,
  Grid,
  List,
  Sparkles,
  ArrowUpDown,
  Plus,
  Radio,
  Video
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import {
  Incident,
  EmergencyCategory,
  SeverityLevel,
  IncidentStatus,
  VerificationStatus
} from '../../types';
import {
  SeverityBadge,
  StatusBadge,
  getCategoryIcon,
  getCategoryColor
} from '../common/CategoryIcon';
import { VerificationBadge } from '../common/VerificationBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface IncidentTableProps {
  initialCategoryFilter?: EmergencyCategory | 'ALL';
  initialSeverityFilter?: SeverityLevel | 'ALL';
  initialStatusFilter?: IncidentStatus | 'ALL' | 'ACTIVE';
}

export const IncidentTable: React.FC<IncidentTableProps> = ({
  initialCategoryFilter = 'ALL',
  initialSeverityFilter = 'ALL',
  initialStatusFilter = 'ALL'
}) => {
  const {
    incidents,
    setSelectedIncident,
    setActiveTab,
    updateStatus,
    updateSeverity,
    deleteIncident,
    generateRandomMockIncident
  } = useIncidents();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory | 'ALL'>(initialCategoryFilter);
  const [selectedSeverity, setSelectedSeverity] = useState<SeverityLevel | 'ALL'>(initialSeverityFilter);
  const [selectedStatus, setSelectedStatus] = useState<IncidentStatus | 'ALL' | 'ACTIVE'>(initialStatusFilter);
  const [selectedVerification, setSelectedVerification] = useState<VerificationStatus | 'ALL' | 'HAS_DUPLICATES'>('ALL');
  const [showSOSOnly, setShowSOSOnly] = useState(false);
  const [showVideoOnly, setShowVideoOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'priority' | 'newest' | 'oldest' | 'affected' | 'severity'>('priority');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Deletion modal state
  const [deletingIncident, setDeletingIncident] = useState<Incident | null>(null);

  const categories: EmergencyCategory[] = [
    'Fire Emergency',
    'Road Accident',
    'Medical Emergency',
    'Flood',
    'Building Collapse',
    'Other Emergencies'
  ];

  const severities: SeverityLevel[] = ['Critical', 'High', 'Medium', 'Low'];
  const statuses: IncidentStatus[] = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

  const severityWeight: Record<SeverityLevel, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1
  };

  // Filter and sort
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      // SOS Filter
      if (showSOSOnly && !incident.isSOS && !incident.tags?.includes('sos-alert')) {
        return false;
      }

      // Video Evidence Filter
      if (showVideoOnly && !incident.hasVideoEvidence) {
        return false;
      }

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = incident.title.toLowerCase().includes(query);
        const matchesDesc = incident.description.toLowerCase().includes(query);
        const matchesId = incident.id.toLowerCase().includes(query);
        const matchesAddress = incident.location.address.toLowerCase().includes(query);
        const matchesReporter = incident.reporter.name?.toLowerCase().includes(query);
        const matchesSOS = (query === 'sos' || query === 'beacon') && (incident.isSOS || incident.tags?.includes('sos-alert'));
        const matchesVideo = (query === 'video' || query === 'evidence') && incident.hasVideoEvidence;
        if (!matchesTitle && !matchesDesc && !matchesId && !matchesAddress && !matchesReporter && !matchesSOS && !matchesVideo) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'ALL' && incident.category !== selectedCategory) {
        return false;
      }

      // Severity filter
      if (selectedSeverity !== 'ALL' && incident.severity !== selectedSeverity) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'ACTIVE') {
        if (incident.status === 'Resolved') return false;
      } else if (selectedStatus !== 'ALL' && incident.status !== selectedStatus) {
        return false;
      }

      // Verification filter
      const vStatus = incident.verificationStatus || 'Unverified';
      if (selectedVerification === 'HAS_DUPLICATES') {
        if (!incident.duplicateMatches || incident.duplicateMatches.length === 0) return false;
      } else if (selectedVerification !== 'ALL' && vStatus !== selectedVerification) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        return (b.priorityScore ?? 0) - (a.priorityScore ?? 0);
      }
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'affected') {
        return (b.affectedCount || 0) - (a.affectedCount || 0);
      }
      if (sortBy === 'severity') {
        return severityWeight[b.severity] - severityWeight[a.severity];
      }
      return 0;
    });
  }, [incidents, searchQuery, selectedCategory, selectedSeverity, selectedStatus, selectedVerification, sortBy]);

  const exportCSV = () => {
    const headers = ['Incident ID', 'Category', 'Severity', 'Status', 'Title', 'Address', 'Affected People', 'Reported At'];
    const rows = filteredIncidents.map(i => [
      `"${i.id}"`,
      `"${i.category}"`,
      `"${i.severity}"`,
      `"${i.status}"`,
      `"${i.title.replace(/"/g, '""')}"`,
      `"${i.location.address.replace(/"/g, '""')}"`,
      i.affectedCount,
      `"${i.timestamp}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `resq_incident_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredIncidents, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `resq_incident_export_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getRelativeTime = (isoString: string) => {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ID, keyword, address, or reporter..."
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

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Report Incident</span>
            </button>

            <button
              onClick={() => generateRandomMockIncident()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-amber-300 hover:text-white bg-slate-950 hover:bg-amber-950/60 border border-slate-700 hover:border-amber-700 rounded-lg transition-colors whitespace-nowrap"
              title="Add random mock report for testing"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Mock Emergency</span>
            </button>

            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
              <button
                onClick={exportCSV}
                className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors border-r border-slate-800"
                title="Download CSV report"
              >
                CSV
              </button>
              <button
                onClick={exportJSON}
                className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                title="Download JSON data"
              >
                JSON
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-700 rounded-lg overflow-hidden bg-slate-950">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 transition-colors ${
                  viewMode === 'cards' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid cards view"
              >
                <Grid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80 text-xs">
          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Severity filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Severity:</span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              {severities.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">All Active (Unresolved)</option>
              {statuses.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Verification filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Verification:</span>
            <select
              value={selectedVerification}
              onChange={(e) => setSelectedVerification(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Verification</option>
              <option value="Verified">Verified</option>
              <option value="Under Review">Under Review</option>
              <option value="Unverified">Unverified</option>
              <option value="Unable to Verify">Unable to Verify</option>
              <option value="HAS_DUPLICATES">Duplicates Detected</option>
            </select>
          </div>

          {/* SOS Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowSOSOnly(!showSOSOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showSOSOnly
                ? 'bg-rose-950 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>SOS Only</span>
          </button>

          {/* Video Evidence Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowVideoOnly(!showVideoOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              showVideoOnly
                ? 'bg-amber-950 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3 h-3 text-amber-400" />
            <span>Video Evidence</span>
          </button>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="priority">Sort: Highest Priority Score</option>
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="severity">Sort: Highest Severity</option>
              <option value="affected">Sort: Most People Affected</option>
            </select>
          </div>

          {/* Clear filters shortcut */}
          {(selectedCategory !== 'ALL' || selectedSeverity !== 'ALL' || selectedStatus !== 'ALL' || selectedVerification !== 'ALL' || showSOSOnly || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSelectedVerification('ALL');
                setShowSOSOnly(false);
                setSearchQuery('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium pl-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
        <span>
          Showing <span className="text-white font-bold">{filteredIncidents.length}</span> of {incidents.length} total incidents
        </span>
      </div>

      {/* Empty State */}
      {filteredIncidents.length === 0 && (
        <div className="p-12 text-center rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Incidents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No incident reports matched your current filter criteria. Try resetting your search or report a new incident.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSeverity('ALL');
                setSelectedStatus('ALL');
                setSearchQuery('');
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setActiveTab('report')}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
            >
              Report Incident
            </button>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && filteredIncidents.length > 0 && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">ID / Time</th>
                  <th className="py-3 px-3.5">Incident Details</th>
                  <th className="py-3 px-3.5">Location</th>
                  <th className="py-3 px-3.5">Priority</th>
                  <th className="py-3 px-3.5">Severity</th>
                  <th className="py-3 px-3.5">Status</th>
                  <th className="py-3 px-3.5">Verification</th>
                  <th className="py-3 px-3.5">Impact</th>
                  <th className="py-3 px-3.5">Allocated Team</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredIncidents.map((incident) => {
                  const Icon = getCategoryIcon(incident.category);
                  const colors = getCategoryColor(incident.category);
                  const resourceCount = incident.assignedResourceIds?.length || incident.assignedUnits?.length || 0;

                  return (
                    <tr
                      key={incident.id}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedIncident(incident)}
                    >
                      {/* ID & Time */}
                      <td className="py-3.5 px-3.5 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{incident.id}</span>
                          {(incident.isSOS || incident.tags?.includes('sos-alert')) && (
                            <span className="inline-flex items-center gap-1 font-bold font-mono text-[10px] text-rose-300 bg-rose-950 px-1.5 py-0.2 rounded border border-rose-600 animate-pulse">
                              <Radio className="w-2.5 h-2.5 text-rose-400" />
                              <span>SOS</span>
                            </span>
                          )}
                          {incident.hasVideoEvidence && (
                            <span className="inline-flex items-center gap-1 font-bold font-mono text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.2 rounded border border-amber-600/70" title="Emergency Video Evidence Attached">
                              <Video className="w-2.5 h-2.5 text-amber-400" />
                              <span>VIDEO</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {getRelativeTime(incident.timestamp)}
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3.5 px-3.5 max-w-sm">
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-7 h-7 rounded flex items-center justify-center border shrink-0 mt-0.5 ${colors.bg} ${colors.border} ${colors.text}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-white truncate max-w-xs sm:max-w-md">
                              {incident.title}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                              {incident.description}
                            </div>
                          </div>
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

                      {/* Priority Score & Rank */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <PriorityBadge
                          score={incident.priorityScore ?? 0}
                          rank={incident.priorityRank}
                          breakdown={incident.priorityBreakdown}
                          size="sm"
                          showDetailsButton={true}
                        />
                      </td>

                      {/* Severity Switcher */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={incident.severity}
                          onChange={(e) => updateSeverity(incident.id, e.target.value as SeverityLevel)}
                          className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-2 py-1 font-medium focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </td>

                      {/* Status Switcher */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={incident.status}
                          onChange={(e) => updateStatus(incident.id, e.target.value as IncidentStatus)}
                          className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          <option value="Reported">Reported</option>
                          <option value="Assigned">Assigned</option>
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-1 items-start">
                          <VerificationBadge status={incident.verificationStatus || 'Unverified'} size="sm" />
                          {incident.duplicateMatches && incident.duplicateMatches.length > 0 && (
                            <span
                              className="font-mono text-[10px] text-cyan-300 bg-cyan-950/70 border border-cyan-800/70 px-1.5 py-0.2 rounded"
                              title={`Matches: ${incident.duplicateMatches.map(m => m.matchedIncidentId).join(', ')}`}
                            >
                              {incident.duplicateMatches.length} dupe match{incident.duplicateMatches.length > 1 ? 'es' : ''}
                            </span>
                          )}
                          {incident.suspiciousIndicators && incident.suspiciousIndicators.length > 0 && (
                            <span
                              className="text-[10px] text-amber-300 font-mono"
                              title={incident.suspiciousIndicators.map(i => i.message).join(' | ')}
                            >
                              ⚠ Review flag
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Impact */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap font-mono tabular-nums text-slate-200">
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{incident.affectedCount}</span>
                        </div>
                      </td>

                      {/* Allocated Team */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {incident.assignedTeamName ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            <span className="font-semibold text-amber-300 text-[11px] truncate max-w-[130px]" title={incident.assignedTeamName}>
                              {incident.assignedTeamName}
                            </span>
                          </div>
                        ) : resourceCount > 0 ? (
                          <button
                            onClick={() => setSelectedIncident(incident)}
                            className="font-mono text-[11px] bg-slate-950 hover:bg-slate-800 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/80 transition-colors flex items-center gap-1.5"
                            title="Manage allocated resources"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span>{resourceCount} Deployed</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedIncident(incident);
                              setActiveTab('dispatch');
                            }}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold underline"
                          >
                            + Dispatch
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedIncident(incident)}
                            className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                            title="View Incident Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingIncident(incident)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
                            title="Delete Incident"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cards View */}
      {viewMode === 'cards' && filteredIncidents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIncidents.map((incident) => {
            const Icon = getCategoryIcon(incident.category);
            const colors = getCategoryColor(incident.category);

            return (
              <div
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className={`p-4 rounded-xl bg-slate-900/80 border transition-all duration-150 cursor-pointer flex flex-col justify-between hover:bg-slate-900 ${
                  incident.severity === 'Critical'
                    ? 'border-rose-700/60 shadow-md shadow-rose-950/30'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${colors.bg} ${colors.border} ${colors.text}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-white">
                            {incident.id}
                          </span>
                          {(incident.isSOS || incident.tags?.includes('sos-alert')) && (
                            <span className="inline-flex items-center gap-1 font-bold font-mono text-[9px] text-rose-300 bg-rose-950 px-1 py-0.2 rounded border border-rose-600 animate-pulse">
                              <Radio className="w-2.5 h-2.5 text-rose-400" />
                              <span>SOS</span>
                            </span>
                          )}
                          {incident.hasVideoEvidence && (
                            <span className="inline-flex items-center gap-1 font-bold font-mono text-[9px] text-amber-300 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-600/70">
                              <Video className="w-2.5 h-2.5 text-amber-400" />
                              <span>VIDEO</span>
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {getRelativeTime(incident.timestamp)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <PriorityBadge
                        score={incident.priorityScore ?? 0}
                        rank={incident.priorityRank}
                        breakdown={incident.priorityBreakdown}
                        size="sm"
                      />
                      <VerificationBadge status={incident.verificationStatus || 'Unverified'} size="sm" />
                      <SeverityBadge severity={incident.severity} />
                      <StatusBadge status={incident.status} />
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">
                      {incident.title}
                    </h4>
                    <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                      {incident.description}
                    </p>
                  </div>

                  {/* Assigned Team Banner */}
                  {incident.assignedTeamName && (
                    <div className="p-2 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Dispatched Team:
                      </span>
                      <span className="font-mono text-[11px] font-bold text-amber-200">
                        {incident.assignedTeamName}
                      </span>
                    </div>
                  )}

                  {/* Duplicate or Suspicious Alert Banner on Card */}
                  {incident.duplicateMatches && incident.duplicateMatches.length > 0 && (
                    <div className="p-2 rounded bg-cyan-950/50 border border-cyan-800/60 text-[11px] text-cyan-300 flex items-center justify-between">
                      <span className="font-semibold">Duplicate Candidate</span>
                      <span className="font-mono text-[10px] font-bold">
                        Matches {incident.duplicateMatches.map(m => m.matchedIncidentId).join(', ')}
                      </span>
                    </div>
                  )}

                  {incident.suspiciousIndicators && incident.suspiciousIndicators.length > 0 && (
                    <div className="p-2 rounded bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300">
                      <span className="font-semibold">Review Flag: </span>
                      <span>{incident.suspiciousIndicators[0].message}</span>
                    </div>
                  )}

                  {/* Location & Impact */}
                  <div className="space-y-1.5 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{incident.location.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {incident.affectedCount} affected
                      </span>
                      <span className="text-[11px] font-mono text-cyan-400">
                        {incident.assignedTeamName ? '1 Team Assigned' : `${incident.assignedResourceIds?.length || incident.assignedUnits.length} resources`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer actions */}
                <div
                  className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={incident.status}
                    onChange={(e) => updateStatus(incident.id, e.target.value as IncidentStatus)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Reported">Reported</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedIncident(incident)}
                      className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => setDeletingIncident(incident)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                      title="Delete report"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deletingIncident}
        incidentId={deletingIncident?.id || ''}
        incidentTitle={deletingIncident?.title || ''}
        onCancel={() => setDeletingIncident(null)}
        onConfirm={() => {
          if (deletingIncident) {
            deleteIncident(deletingIncident.id);
            setDeletingIncident(null);
          }
        }}
      />
    </div>
  );
};
