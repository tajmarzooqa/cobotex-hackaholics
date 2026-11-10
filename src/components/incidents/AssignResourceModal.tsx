import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  MapPin,
  Users,
  Search,
  Filter,
  Check,
  Ban
} from 'lucide-react';
import { Incident, ResourceType, EmergencyResource, getRecommendedResourceTypes } from '../../types';
import { useIncidents } from '../../context/IncidentContext';
import { getResourceTypeIcon, getResourceTypeColor, ResourceStatusBadge } from '../common/ResourceBadge';

interface AssignResourceModalProps {
  isOpen: boolean;
  incident: Incident | null;
  onClose: () => void;
}

export const AssignResourceModal: React.FC<AssignResourceModalProps> = ({
  isOpen,
  incident,
  onClose
}) => {
  const { resources, assignResourceToIncident } = useIncidents();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('RECOMMENDED');
  const [actionFeedback, setActionFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  if (!isOpen || !incident) return null;

  const recommendedTypes = getRecommendedResourceTypes(incident.category);

  const filteredResources = resources.filter(res => {
    const resType = res.type || res.category;
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        res.name.toLowerCase().includes(q) ||
        res.id.toLowerCase().includes(q) ||
        resType.toLowerCase().includes(q) ||
        res.assignedLocation.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Category / Type filter
    if (filterType === 'RECOMMENDED') {
      return recommendedTypes.includes(resType);
    }
    if (filterType === 'AVAILABLE') {
      return res.status === 'Available';
    }
    if (filterType !== 'ALL') {
      return resType === filterType;
    }

    return true;
  });

  const handleAssign = (resource: EmergencyResource) => {
    setActionFeedback(null);
    const result = assignResourceToIncident(incident.id, resource.id);
    if (!result.success) {
      setActionFeedback({ message: result.message, isError: true });
    } else {
      setActionFeedback({ message: result.message, isError: false });
      setTimeout(() => {
        setActionFeedback(null);
      }, 3500);
    }
  };

  const isAlreadyAssignedToThisIncident = (resId: string) => {
    return incident.assignedResourceIds?.includes(resId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-rose-400 bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
                Resource Allocation & Dispatch
              </span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-xs text-white font-bold">{incident.id}</span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-slate-300">{incident.category}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-lg">
              {incident.title}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{incident.location.address}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Recommendation Banner */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 font-medium">Recommended for {incident.category}:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {recommendedTypes.map(rt => (
                <span
                  key={rt}
                  className="bg-slate-800 border border-slate-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded"
                >
                  {rt}
                </span>
              ))}
            </div>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Simulated Tactical Readiness Data
          </span>
        </div>

        {/* Feedback Alert */}
        {actionFeedback && (
          <div
            className={`mx-5 mt-4 p-3 rounded-lg border text-xs flex items-center gap-2 ${
              actionFeedback.isError
                ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
            }`}
          >
            {actionFeedback.isError ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources by name, ID, or station..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <button
                onClick={() => setFilterType('RECOMMENDED')}
                className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  filterType === 'RECOMMENDED'
                    ? 'bg-rose-950/80 border-rose-700 text-rose-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setFilterType('AVAILABLE')}
                className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  filterType === 'AVAILABLE'
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Available Only
              </button>
              <button
                onClick={() => setFilterType('ALL')}
                className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
                  filterType === 'ALL'
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                All Resources
              </button>
            </div>
          </div>
        </div>

        {/* Resources List */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5 flex-1 divide-y divide-slate-800/40">
          {filteredResources.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              No matching resources found for the current filter.
            </div>
          ) : (
            filteredResources.map((res) => {
              const resType = res.type || res.category;
              const Icon = getResourceTypeIcon(resType);
              const colors = getResourceTypeColor(resType);
              const isRecommended = recommendedTypes.includes(resType);
              const alreadyAssigned = isAlreadyAssignedToThisIncident(res.id);
              const isAssignedElsewhere = res.status === 'Assigned' && !alreadyAssigned;
              const isUnavailable = res.status === 'Unavailable';
              const canAssign = res.status === 'Available' && !alreadyAssigned;

              return (
                <div
                  key={res.id}
                  className={`pt-2.5 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-all ${
                    alreadyAssigned
                      ? 'bg-slate-950/80 border-cyan-800/60'
                      : canAssign
                      ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-75'
                  }`}
                >
                  {/* Left details */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${colors.bg} ${colors.border} ${colors.text}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-white">{res.id}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-slate-200">{res.type}</span>
                        {isRecommended && (
                          <span className="text-[10px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 px-1.5 py-0.2 rounded">
                            Recommended
                          </span>
                        )}
                        <ResourceStatusBadge
                          status={res.status}
                          assignedIncidentId={res.assignedIncidentId}
                        />
                      </div>

                      <h4 className="text-xs font-bold text-white truncate max-w-md">
                        {res.name}
                      </h4>

                      <div className="text-[11px] text-slate-400 space-x-3">
                        <span>Base: <strong className="text-slate-300 font-normal">{res.assignedLocation}</strong></span>
                        {res.crewCount && <span>Crew: {res.crewCount}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {alreadyAssigned ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/80 border border-cyan-700 rounded-lg">
                        <Check className="w-3.5 h-3.5" />
                        <span>Deployed Here</span>
                      </span>
                    ) : isAssignedElsewhere ? (
                      <div className="flex flex-col items-end">
                        <button
                          disabled
                          className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-900 border border-slate-800 rounded-lg cursor-not-allowed flex items-center gap-1"
                          title={`Assigned to ${res.assignedIncidentId}`}
                        >
                          <Ban className="w-3 h-3 text-slate-500" />
                          <span>Busy on {res.assignedIncidentId}</span>
                        </button>
                        <span className="text-[10px] text-slate-500 mt-0.5">
                          Multi-incident lock active
                        </span>
                      </div>
                    ) : isUnavailable ? (
                      <button
                        disabled
                        className="px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-900 border border-slate-800 rounded-lg cursor-not-allowed"
                      >
                        Unavailable
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssign(res)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Dispatch Resource</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Assigned to this incident: <strong className="text-white font-mono">{incident.assignedResourceIds?.length || 0}</strong> resources
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
