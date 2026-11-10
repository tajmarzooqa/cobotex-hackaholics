import React, { useState } from 'react';
import {
  Truck,
  HeartPulse,
  Flame,
  LifeBuoy,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Info,
  List,
  Grid,
  Radio,
  Edit2,
  Trash2,
  MapPin,
  Compass,
  X
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import {
  ResponseTeam,
  ResponseTeamCategory,
  TeamAvailability
} from '../../types';
import {
  TeamCategoryBadge,
  TeamAvailabilityBadge,
  getTeamCategoryIcon,
  getTeamCategoryColor
} from '../common/TeamBadge';

export const UnitsManager: React.FC = () => {
  const {
    teams,
    incidents,
    metrics,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamAvailability,
    updateTeamLocation,
    setSelectedIncident,
    resetToSampleData
  } = useIncidents();

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ResponseTeamCategory | 'ALL'>('ALL');
  const [selectedAvailability, setSelectedAvailability] = useState<TeamAvailability | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ResponseTeam | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<ResponseTeam | null>(null);
  const [inspectingTeam, setInspectingTeam] = useState<ResponseTeam | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // New Team Form state
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ResponseTeamCategory>('Fire Response Team');
  const [formLat, setFormLat] = useState('37.7749');
  const [formLng, setFormLng] = useState('-122.4194');
  const [formLocation, setFormLocation] = useState('Central Emergency Operations Depot');
  const [formContact, setFormContact] = useState('+1 (555) 019-4400');
  const [formCrew, setFormCrew] = useState('4');
  const [formCallSign, setFormCallSign] = useState('');

  const teamCategories: ResponseTeamCategory[] = [
    'Fire Response Team',
    'Medical Response Team',
    'Rescue Team',
    'Disaster Management Team',
    'General Emergency Response Team'
  ];

  const availabilities: TeamAvailability[] = ['Available', 'Busy', 'Unavailable'];

  // Filtered teams list
  const filteredTeams = teams.filter((team) => {
    if (selectedCategory !== 'ALL' && team.category !== selectedCategory) return false;
    if (selectedAvailability !== 'ALL' && team.availability !== selectedAvailability) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        team.name.toLowerCase().includes(q) ||
        team.id.toLowerCase().includes(q) ||
        team.category.toLowerCase().includes(q) ||
        team.assignedLocation.toLowerCase().includes(q) ||
        (team.assignedIncidentId && team.assignedIncidentId.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleQuickAvailabilityChange = (team: ResponseTeam, newAvail: TeamAvailability) => {
    updateTeamAvailability(team.id, newAvail);
    setFeedbackMessage({
      text: `Readiness status for ${team.name} updated to ${newAvail}.`,
      isError: false
    });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formName.trim()) return;

    // Check duplicate ID
    if (teams.some((t) => t.id.toLowerCase() === formId.trim().toLowerCase())) {
      setFeedbackMessage({ text: `A team with ID "${formId}" already exists.`, isError: true });
      return;
    }

    const latNum = parseFloat(formLat) || 37.7749;
    const lngNum = parseFloat(formLng) || -122.4194;

    createTeam({
      id: formId.trim().toUpperCase(),
      name: formName.trim(),
      category: formCategory,
      latitude: latNum,
      longitude: lngNum,
      assignedLocation: formLocation.trim() || 'Central Station',
      contactInfo: formContact.trim(),
      crewCount: parseInt(formCrew, 10) || 4,
      callSign: formCallSign.trim() || formId.trim().toUpperCase()
    });

    setIsAddModalOpen(false);
    setFeedbackMessage({ text: `New response team "${formName}" created.`, isError: false });
    setTimeout(() => setFeedbackMessage(null), 3000);

    // Reset form
    setFormId('');
    setFormName('');
    setFormLocation('');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;

    const latNum = parseFloat(formLat) || editingTeam.latitude;
    const lngNum = parseFloat(formLng) || editingTeam.longitude;

    updateTeam(editingTeam.id, {
      name: formName.trim() || editingTeam.name,
      category: formCategory,
      latitude: latNum,
      longitude: lngNum,
      assignedLocation: formLocation.trim() || editingTeam.assignedLocation,
      contactInfo: formContact.trim() || editingTeam.contactInfo,
      crewCount: parseInt(formCrew, 10) || editingTeam.crewCount,
      callSign: formCallSign.trim() || editingTeam.callSign
    });

    setEditingTeam(null);
    setFeedbackMessage({ text: `Team ${editingTeam.id} details updated.`, isError: false });
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  const handleDeleteConfirm = () => {
    if (!teamToDelete) return;
    const result = deleteTeam(teamToDelete.id);
    if (result.success) {
      setFeedbackMessage({ text: result.message, isError: false });
    } else {
      setFeedbackMessage({ text: result.message, isError: true });
    }
    setTeamToDelete(null);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const openEditModal = (team: ResponseTeam) => {
    setEditingTeam(team);
    setFormId(team.id);
    setFormName(team.name);
    setFormCategory(team.category);
    setFormLat(team.latitude.toString());
    setFormLng(team.longitude.toString());
    setFormLocation(team.assignedLocation);
    setFormContact(team.contactInfo || team.contactNumber || '');
    setFormCrew((team.crewCount || 4).toString());
    setFormCallSign(team.callSign || '');
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start justify-between gap-3 text-xs text-slate-300">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-white">
              Demonstration Response Team Management:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              These records represent simulated demonstration response teams for training and coordination exercises.
              They are not connected to real-world municipal 911 vehicle tracking networks.
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setSelectedAvailability('ALL')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Total Teams</span>
            <Truck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.totalTeams}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Across 5 response specializations</div>
        </div>

        <div
          onClick={() => setSelectedAvailability('Available')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-emerald-900/50 hover:border-emerald-700/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-emerald-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Available Teams</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.availableTeams}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ready for immediate dispatch</div>
        </div>

        <div
          onClick={() => setSelectedAvailability('Busy')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-amber-900/50 hover:border-amber-700/80 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-amber-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Busy / Assigned</span>
            <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.busyTeams}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Active on incident scenes</div>
        </div>

        <div
          onClick={() => setSelectedAvailability('Unavailable')}
          className="cursor-pointer p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group"
        >
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Unavailable</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">
            {metrics.unavailableTeams}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Maintenance / shift rotation</div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            feedbackMessage.isError
              ? 'bg-rose-950/80 border-rose-700 text-rose-200'
              : 'bg-emerald-950/80 border-emerald-700 text-emerald-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Control Bar: Search, Category & Availability Filters */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teams by ID, name, location, or assigned mission..."
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
              onClick={() => {
                setFormId(`TEAM-${Math.floor(Math.random() * 900 + 100)}`);
                setFormName('');
                setFormLocation('Sector 2 Headquarters');
                setFormLat('37.7749');
                setFormLng('-122.4194');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Response Team</span>
            </button>

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
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {teamCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium text-[11px] uppercase">Readiness:</span>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Readiness</option>
              {availabilities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(selectedCategory !== 'ALL' || selectedAvailability !== 'ALL' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedAvailability('ALL');
                setSearchQuery('');
              }}
              className="text-xs text-rose-400 hover:text-rose-300 underline font-medium pl-1"
            >
              Reset Filters
            </button>
          )}

          <div className="text-xs text-slate-400 ml-auto font-mono">
            Showing <strong className="text-white">{filteredTeams.length}</strong> of {teams.length} teams
          </div>
        </div>
      </div>

      {/* Table View (Feature 2) */}
      {viewMode === 'table' && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3.5">Team ID / Name</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Station & Coordinates</th>
                  <th className="py-3 px-3.5">Readiness</th>
                  <th className="py-3 px-3.5">Currently Assigned Incident</th>
                  <th className="py-3 px-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No response teams matched your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team) => {
                    const isBusy = team.availability === 'Busy';
                    const activeInc = incidents.find((i) => i.id === team.assignedIncidentId);

                    return (
                      <tr
                        key={team.id}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setInspectingTeam(team)}
                      >
                        {/* ID & Name */}
                        <td className="py-3.5 px-3.5 font-mono whitespace-nowrap">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{team.id}</span>
                            <span className="font-sans text-[11px] text-slate-400">({team.callSign || team.id})</span>
                          </div>
                          <div className="font-sans text-xs text-slate-200 mt-0.5 font-medium truncate max-w-xs">
                            {team.name}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap">
                          <TeamCategoryBadge category={team.category} size="sm" />
                        </td>

                        {/* Location & Coordinates */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap text-slate-300 font-mono text-[11px]">
                          <div className="font-sans text-xs text-slate-200 truncate max-w-xs">
                            {team.assignedLocation}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Lat: {team.latitude.toFixed(4)}, Lng: {team.longitude.toFixed(4)}
                          </div>
                        </td>

                        {/* Readiness Status Switcher */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={team.availability}
                            onChange={(e) => handleQuickAvailabilityChange(team, e.target.value as TeamAvailability)}
                            className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            <option value="Available">Available</option>
                            <option value="Busy">Busy</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>
                        </td>

                        {/* Currently Assigned Incident */}
                        <td className="py-3.5 px-3.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          {team.assignedIncidentId ? (
                            <button
                              onClick={() => {
                                if (activeInc) setSelectedIncident(activeInc);
                              }}
                              className="font-mono text-[11px] bg-slate-950 hover:bg-slate-800 text-cyan-300 px-2 py-1 rounded border border-cyan-800/80 transition-colors flex items-center gap-1.5"
                              title="Click to view assigned emergency"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                              <span className="font-bold">{team.assignedIncidentId}</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[130px]">
                                ({team.assignedIncidentTitle || activeInc?.title || 'Active'})
                              </span>
                            </button>
                          ) : (
                            <span className="text-slate-500 font-mono text-[11px]">— Standing By —</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditModal(team)}
                              className="p-1.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                              title="Edit team details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTeamToDelete(team)}
                              disabled={isBusy || !!team.assignedIncidentId}
                              className={`p-1.5 rounded transition-colors ${
                                isBusy || !!team.assignedIncidentId
                                  ? 'text-slate-600 bg-slate-900 cursor-not-allowed opacity-50'
                                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                              }`}
                              title={
                                isBusy || !!team.assignedIncidentId
                                  ? 'Cannot delete team assigned to active incident'
                                  : 'Delete team'
                              }
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const Icon = getTeamCategoryIcon(team.category);
            const colors = getTeamCategoryColor(team.category);
            const isBusy = team.availability === 'Busy';
            const activeInc = incidents.find((i) => i.id === team.assignedIncidentId);

            return (
              <div
                key={team.id}
                onClick={() => setInspectingTeam(team)}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${colors.bg} ${colors.border} ${colors.text}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-white">{team.id}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{team.callSign || team.id}</div>
                      </div>
                    </div>

                    <TeamAvailabilityBadge availability={team.availability} />
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2 leading-snug">{team.name}</h4>
                  <div className="mt-1">
                    <TeamCategoryBadge category={team.category} size="sm" />
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 pt-2 border-t border-slate-800/80 mt-2 font-mono">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="font-sans truncate">{team.assignedLocation}</span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Coordinates: {team.latitude.toFixed(4)}, {team.longitude.toFixed(4)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Crew: {team.crewCount || 4} specialists · {team.contactInfo}
                    </div>
                  </div>
                </div>

                <div
                  className="pt-2 border-t border-slate-800 flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    value={team.availability}
                    onChange={(e) => handleQuickAvailabilityChange(team, e.target.value as TeamAvailability)}
                    className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded px-2 py-1 focus:outline-none focus:border-rose-500 cursor-pointer"
                  >
                    <option value="Available">Available</option>
                    <option value="Busy">Busy</option>
                    <option value="Unavailable">Unavailable</option>
                  </select>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(team)}
                      className="p-1.5 text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
                      title="Edit team"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTeamToDelete(team)}
                      disabled={isBusy || !!team.assignedIncidentId}
                      className={`p-1.5 rounded transition-colors ${
                        isBusy || !!team.assignedIncidentId
                          ? 'text-slate-600 bg-slate-900 cursor-not-allowed opacity-50'
                          : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                      }`}
                      title={
                        isBusy || !!team.assignedIncidentId
                          ? 'Cannot delete team assigned to active incident'
                          : 'Delete team'
                      }
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

      {/* Add Team Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleCreateSubmit}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-emerald-400">
                <Truck className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Add Emergency Response Team</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Unique Team ID:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEAM-FIR-05"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Call Sign:</label>
                <input
                  type="text"
                  placeholder="e.g. STRIKE-05"
                  value={formCallSign}
                  onChange={(e) => setFormCallSign(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Team Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rapid Extraction Pumper Unit 5"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Team Category:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ResponseTeamCategory)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                >
                  {teamCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Latitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formLat}
                  onChange={(e) => setFormLat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Longitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formLng}
                  onChange={(e) => setFormLng(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Base Station / Sector:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sector 2 Historic Core Substation"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Crew Count:</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formCrew}
                  onChange={(e) => setFormCrew(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Radio / Phone:</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm shadow-emerald-950"
              >
                Add Response Team
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <form
            onSubmit={handleEditSubmit}
            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <Edit2 className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Edit Response Team ({editingTeam.id})</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Team Name:</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Category:</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as ResponseTeamCategory)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                >
                  {teamCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Latitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formLat}
                  onChange={(e) => setFormLat(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Longitude:</label>
                <input
                  type="number"
                  step="0.0001"
                  required
                  value={formLng}
                  onChange={(e) => setFormLng(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-slate-300 font-medium mb-1">Base Station / Sector:</label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Crew Count:</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={formCrew}
                  onChange={(e) => setFormCrew(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Radio / Phone:</label>
                <input
                  type="text"
                  value={formContact}
                  onChange={(e) => setFormContact(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingTeam(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-950"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal (Feature 2 Requirement) */}
      {teamToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <Trash2 className="w-5 h-5" />
              <h3 className="text-sm font-bold text-white">Confirm Team Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete response team <strong>{teamToDelete.name}</strong> ({teamToDelete.id})?
            </p>

            <p className="text-[11px] text-slate-400">
              Note: Response teams can only be deleted when they are not assigned to active incidents.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setTeamToDelete(null)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white rounded-lg bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm shadow-rose-950"
              >
                Delete Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Details Inspection Modal */}
      {inspectingTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{inspectingTeam.id}</span>
                  <TeamAvailabilityBadge availability={inspectingTeam.availability} />
                </div>
                <h3 className="text-sm font-bold text-white mt-1">{inspectingTeam.name}</h3>
              </div>
              <button
                onClick={() => setInspectingTeam(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300 font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Category:</span>
                <span className="text-white font-sans">{inspectingTeam.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Base Station:</span>
                <span className="text-white font-sans truncate max-w-[200px]">{inspectingTeam.assignedLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Coordinates:</span>
                <span className="text-white">{inspectingTeam.latitude.toFixed(4)}, {inspectingTeam.longitude.toFixed(4)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Crew Size:</span>
                <span className="text-white">{inspectingTeam.crewCount || 4} specialists</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Contact Radio:</span>
                <span className="text-white">{inspectingTeam.contactInfo}</span>
              </div>
              {inspectingTeam.assignedIncidentId && (
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400">Active Incident:</span>
                  <button
                    onClick={() => {
                      const inc = incidents.find((i) => i.id === inspectingTeam.assignedIncidentId);
                      if (inc) {
                        setSelectedIncident(inc);
                        setInspectingTeam(null);
                      }
                    }}
                    className="text-cyan-300 font-bold underline"
                  >
                    {inspectingTeam.assignedIncidentId}
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  openEditModal(inspectingTeam);
                  setInspectingTeam(null);
                }}
                className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white rounded-lg bg-slate-800"
              >
                Edit Team
              </button>
              <button
                onClick={() => setInspectingTeam(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-600 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
