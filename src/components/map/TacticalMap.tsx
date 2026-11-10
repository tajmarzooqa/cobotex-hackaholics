import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Layers,
  Filter,
  Navigation,
  Eye,
  AlertTriangle,
  Users,
  Compass,
  Radio,
  Flame,
  HeartPulse,
  LifeBuoy,
  ShieldAlert,
  Truck,
  CheckCircle2,
  ExternalLink,
  Info,
  Maximize2,
  Minimize2,
  Sliders,
  RotateCcw
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import {
  Incident,
  ResponseTeam,
  EmergencyCategory,
  SeverityLevel,
  IncidentStatus,
  TeamAvailability
} from '../../types';
import { SeverityBadge, StatusBadge, getCategoryIcon } from '../common/CategoryIcon';
import { TeamCategoryBadge, TeamAvailabilityBadge, getTeamCategoryIcon } from '../common/TeamBadge';
import { calculateHaversineDistance } from '../../utils/geoUtils';

export const TacticalMap: React.FC = () => {
  const { incidents, teams, setSelectedIncident, setActiveTab } = useIncidents();

  // Selected Pin Inspect States
  const [selectedPinIncident, setSelectedPinIncident] = useState<Incident | null>(null);
  const [selectedPinTeam, setSelectedPinTeam] = useState<ResponseTeam | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<EmergencyCategory | 'ALL'>('ALL');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<IncidentStatus | 'ALL' | 'ACTIVE'>('ALL');
  const [teamAvailabilityFilter, setTeamAvailabilityFilter] = useState<TeamAvailability | 'ALL'>('ALL');

  // Display Toggles
  const [showRadius, setShowRadius] = useState(true);
  const [showRouteLines, setShowRouteLines] = useState(true);
  const [showTeams, setShowTeams] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);

  // Metro coordinate bounds: lat ~ 37.735 to 37.805, lng ~ -122.465 to -122.385
  const latMin = 37.735;
  const latMax = 37.805;
  const lngMin = -122.465;
  const lngMax = -122.385;

  // Calculate percentage position on tactical map (x: 0-100%, y: 0-100%)
  const getCoordinates = (lat: number, lng: number) => {
    const safeLat = typeof lat === 'number' && !isNaN(lat) ? lat : 37.7749;
    const safeLng = typeof lng === 'number' && !isNaN(lng) ? lng : -122.4194;

    const x = ((safeLng - lngMin) / (lngMax - lngMin)) * 100;
    // Latitude is inverted in SVG/CSS (higher latitude is north = top)
    const y = ((latMax - safeLat) / (latMax - latMin)) * 100;

    return {
      x: Math.min(94, Math.max(6, x)),
      y: Math.min(92, Math.max(8, y))
    };
  };

  // Filtered Incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (categoryFilter !== 'ALL' && i.category !== categoryFilter) return false;
      if (severityFilter !== 'ALL' && i.severity !== severityFilter) return false;
      if (statusFilter === 'ACTIVE') {
        if (i.status === 'Resolved') return false;
      } else if (statusFilter !== 'ALL' && i.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [incidents, categoryFilter, severityFilter, statusFilter]);

  // Filtered Teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (teamAvailabilityFilter !== 'ALL' && t.availability !== teamAvailabilityFilter) {
        return false;
      }
      return true;
    });
  }, [teams, teamAvailabilityFilter]);

  // Active Assignment Routes connecting assigned teams to their incidents
  const assignmentRoutes = useMemo(() => {
    const routes: Array<{
      incident: Incident;
      team: ResponseTeam;
      posIncident: { x: number; y: number };
      posTeam: { x: number; y: number };
      distanceKm: number;
      distanceMiles: number;
    }> = [];

    incidents.forEach((inc) => {
      if (inc.status !== 'Resolved' && inc.assignedTeamId) {
        const team = teams.find((t) => t.id === inc.assignedTeamId);
        if (team) {
          const posInc = getCoordinates(inc.location.lat, inc.location.lng);
          const posTm = getCoordinates(team.latitude, team.longitude);
          const dist = calculateHaversineDistance(
            inc.location.lat,
            inc.location.lng,
            team.latitude,
            team.longitude
          );

          routes.push({
            incident: inc,
            team,
            posIncident: posInc,
            posTeam: posTm,
            distanceKm: dist.km,
            distanceMiles: dist.miles
          });
        }
      }
    });

    return routes;
  }, [incidents, teams]);

  return (
    <div className="space-y-4">
      {/* Map Control & Filter Bar */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Interactive Situational Map</h2>
              <p className="text-xs text-slate-400">
                Spatial emergency coordinate grid & response team vector dispatch tracking
              </p>
            </div>
          </div>

          {/* Quick Stats on Map */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">
              Incidents: <strong className="text-white">{filteredIncidents.length}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Teams: <strong className="text-emerald-400">{filteredTeams.length}</strong>
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">
              Active Routes: <strong className="text-cyan-400">{assignmentRoutes.length}</strong>
            </span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800 text-xs">
          {/* Incident Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Fire Emergency">Fire Emergency</option>
            <option value="Road Accident">Road Accident</option>
            <option value="Medical Emergency">Medical Emergency</option>
            <option value="Flood">Flood</option>
            <option value="Building Collapse">Building Collapse</option>
            <option value="Other Emergencies">Other Emergencies</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical Only</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only (Unresolved)</option>
            <option value="Reported">Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Team Availability Filter */}
          <select
            value={teamAvailabilityFilter}
            onChange={(e) => setTeamAvailabilityFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Team Readiness</option>
            <option value="Available">Available Teams</option>
            <option value="Busy">Busy Teams</option>
            <option value="Unavailable">Unavailable Teams</option>
          </select>

          {/* Layer Toggles */}
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <button
              onClick={() => setShowRouteLines(!showRouteLines)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                showRouteLines
                  ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Toggle dispatch route connecting vectors"
            >
              <Navigation className="w-3 h-3" />
              <span>Route Vectors</span>
            </button>

            <button
              onClick={() => setShowRadius(!showRadius)}
              className={`px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 ${
                showRadius
                  ? 'bg-rose-950/70 border-rose-700 text-rose-300'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
              title="Toggle hazard radius rings"
            >
              <Layers className="w-3 h-3" />
              <span>Hazard Radii</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport */}
      <div className="relative w-full h-[620px] rounded-xl bg-[#070d18] border border-slate-800 overflow-hidden shadow-2xl select-none">
        {/* Background Tactical Grid & City Sectors */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Waterway / River Basin */}
          <path
            d="M 0,360 C 260,320 500,440 820,330 C 1080,270 1220,390 1600,370"
            fill="none"
            stroke="#0284c7"
            strokeWidth="32"
            opacity="0.3"
          />

          {/* Highways */}
          <path
            d="M 140,0 L 480,620"
            fill="none"
            stroke="#475569"
            strokeWidth="3.5"
            strokeDasharray="6,4"
          />
          <path
            d="M 0,220 L 1400,290"
            fill="none"
            stroke="#475569"
            strokeWidth="3.5"
            strokeDasharray="6,4"
          />
        </svg>

        {/* Sector Labels overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-5 left-7 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Sector 1 · Transit Axis
          </div>
          <div className="absolute top-1/3 left-1/4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Sector 2 · Historic Core
          </div>
          <div className="absolute top-10 right-10 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Sector 3 · Financial Commercial
          </div>
          <div className="absolute bottom-14 left-10 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Sector 4 · West Residential
          </div>
          <div className="absolute bottom-1/4 right-1/4 text-[10px] font-mono uppercase tracking-widest text-slate-500">
            Sector 7 · Riverfront Basin
          </div>
        </div>

        {/* SVG Vector Route Lines (Feature 5) */}
        {showRouteLines && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {assignmentRoutes.map((rt, idx) => (
              <g key={`route-${idx}`}>
                {/* Glow under-stroke */}
                <line
                  x1={`${rt.posTeam.x}%`}
                  y1={`${rt.posTeam.y}%`}
                  x2={`${rt.posIncident.x}%`}
                  y2={`${rt.posIncident.y}%`}
                  stroke="#38bdf8"
                  strokeWidth="6"
                  opacity="0.15"
                />
                {/* Animated dash line */}
                <line
                  x1={`${rt.posTeam.x}%`}
                  y1={`${rt.posTeam.y}%`}
                  x2={`${rt.posIncident.x}%`}
                  y2={`${rt.posIncident.y}%`}
                  stroke="url(#routeGrad)"
                  strokeWidth="2.5"
                  strokeDasharray="6,4"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </svg>
        )}

        {/* Route Distance Midpoint Badges */}
        {showRouteLines &&
          assignmentRoutes.map((rt, idx) => {
            const midX = (rt.posTeam.x + rt.posIncident.x) / 2;
            const midY = (rt.posTeam.y + rt.posIncident.y) / 2;

            return (
              <div
                key={`badge-${idx}`}
                style={{ left: `${midX}%`, top: `${midY}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
              >
                <div className="bg-slate-950/90 border border-cyan-700/80 text-cyan-300 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow-lg backdrop-blur-xs flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                  <span>{rt.distanceKm} km (Straight Vector)</span>
                </div>
              </div>
            );
          })}

        {/* Response Team Markers (Feature 5) */}
        {showTeams &&
          filteredTeams.map((team) => {
            const pos = getCoordinates(team.latitude, team.longitude);
            const isSelected = selectedPinTeam?.id === team.id;
            const isAvail = team.availability === 'Available';
            const isBusy = team.availability === 'Busy';
            const Icon = getTeamCategoryIcon(team.category);

            let markerBorder = 'border-slate-500 bg-slate-900 text-slate-400';
            if (isAvail) {
              markerBorder = 'border-emerald-400 bg-emerald-950 text-emerald-300 shadow-md shadow-emerald-950/60';
            } else if (isBusy) {
              markerBorder = 'border-amber-400 bg-amber-950 text-amber-300 shadow-md shadow-amber-950/60';
            }

            return (
              <div
                key={team.id}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPinTeam(team);
                  setSelectedPinIncident(null);
                }}
              >
                {/* Available pulse beacon */}
                {isAvail && (
                  <div className="absolute -inset-1.5 rounded-full bg-emerald-500/30 animate-ping pointer-events-none" />
                )}

                <div
                  className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-transform group-hover:scale-125 ${markerBorder} ${
                    isSelected ? 'ring-2 ring-white scale-125' : ''
                  }`}
                  title={`${team.name} (${team.category}) - ${team.availability}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap bg-slate-950/90 text-[10px] text-white px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none z-40">
                  {team.name} ({team.availability})
                </div>
              </div>
            );
          })}

        {/* Incident Pins (Feature 5) */}
        {showIncidents &&
          filteredIncidents.map((incident) => {
            const pos = getCoordinates(incident.location.lat, incident.location.lng);
            const isSelected = selectedPinIncident?.id === incident.id;
            const isCritical = incident.severity === 'Critical';
            const isResolved = incident.status === 'Resolved';
            const isSOS = incident.isSOS && !isResolved;

            let pinBg = 'bg-emerald-500 border-emerald-300';
            let pulseClass = '';

            if (isResolved) {
              pinBg = 'bg-slate-700 border-slate-500 opacity-60';
            } else if (isSOS) {
              pinBg = 'bg-red-600 border-red-200 shadow-xl shadow-red-900 ring-2 ring-red-400';
              pulseClass = 'animate-ping';
            } else if (incident.severity === 'Critical') {
              pinBg = 'bg-rose-600 border-rose-300 shadow-lg shadow-rose-950';
              pulseClass = 'animate-ping';
            } else if (incident.severity === 'High') {
              pinBg = 'bg-amber-500 border-amber-300';
            } else if (incident.severity === 'Medium') {
              pinBg = 'bg-yellow-400 border-yellow-200';
            } else {
              pinBg = 'bg-blue-500 border-blue-200';
            }

            return (
              <div
                key={incident.id}
                style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-30 group"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPinIncident(incident);
                  setSelectedPinTeam(null);
                }}
              >
                {/* SOS Concentric Beacon Waves */}
                {isSOS && (
                  <>
                    <div className="absolute -inset-6 rounded-full bg-red-600/30 animate-ping pointer-events-none" />
                    <div className="absolute -inset-4 rounded-full border-2 border-red-500/60 animate-pulse pointer-events-none" />
                  </>
                )}

                {/* Hazard Radius Circle for Critical/High */}
                {showRadius && !isResolved && (isCritical || incident.severity === 'High') && (
                  <div
                    className={`absolute -inset-9 rounded-full border pointer-events-none ${
                      isCritical
                        ? 'bg-rose-600/15 border-rose-500/30 animate-pulse'
                        : 'bg-amber-500/10 border-amber-500/25'
                    }`}
                  />
                )}

                {/* Pulse ring for critical active incidents */}
                {(isCritical || isSOS) && !isResolved && (
                  <div
                    className={`absolute -inset-2 rounded-full bg-rose-600 opacity-50 ${pulseClass} pointer-events-none`}
                  />
                )}

                {/* Pin Head */}
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-white transition-transform group-hover:scale-125 ${pinBg} ${
                    isSelected ? 'ring-2 ring-white scale-125' : ''
                  }`}
                  title={`${incident.id}: ${incident.title}`}
                >
                  {isResolved ? (
                    <CheckCircle2 className="w-3 h-3 text-slate-300" />
                  ) : isSOS ? (
                    <span className="text-[9px] font-black font-mono">SOS</span>
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  )}
                </div>

                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover:block whitespace-nowrap bg-slate-950/90 text-[10px] text-white px-1.5 py-0.5 rounded border border-slate-700 pointer-events-none z-40">
                  {incident.id} {isSOS ? '· 🚨 SOS BEACON' : `· ${incident.severity}`}
                </div>
              </div>
            );
          })}

        {/* Selected Incident Inspector Drawer / Card */}
        {selectedPinIncident && (
          <div
            className="absolute top-4 right-4 z-40 w-80 p-4 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-3 animate-in fade-in duration-150 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-white">
                    {selectedPinIncident.id}
                  </span>
                  <span className="text-slate-600">·</span>
                  <SeverityBadge severity={selectedPinIncident.severity} />
                  <StatusBadge status={selectedPinIncident.status} />
                </div>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                  {selectedPinIncident.title}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPinIncident(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
              {selectedPinIncident.description}
            </p>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-400 border-t border-slate-800 pt-2">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{selectedPinIncident.location.address}</span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-white">
                  {selectedPinIncident.location.lat.toFixed(4)}, {selectedPinIncident.location.lng.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Affected People:</span>
                <span className="text-white font-bold">{selectedPinIncident.affectedCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Priority Score:</span>
                <span className="text-rose-400 font-bold">{selectedPinIncident.priorityScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span>Assigned Team:</span>
                <span className="text-cyan-300 truncate max-w-[150px]">
                  {selectedPinIncident.assignedTeamName || selectedPinIncident.assignedUnits[0] || 'None'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedIncident(selectedPinIncident);
                  setSelectedPinIncident(null);
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Inspect Details
              </button>
              <button
                onClick={() => {
                  setActiveTab('dispatch');
                  setSelectedPinIncident(null);
                }}
                className="w-full py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded transition-colors"
              >
                Dispatch Console
              </button>
            </div>
          </div>
        )}

        {/* Selected Team Inspector Card */}
        {selectedPinTeam && (
          <div
            className="absolute top-4 right-4 z-40 w-80 p-4 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-3 animate-in fade-in duration-150 backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-xs font-bold text-white">
                    {selectedPinTeam.id}
                  </span>
                  <span className="text-slate-600">·</span>
                  <TeamAvailabilityBadge availability={selectedPinTeam.availability} />
                </div>
                <h4 className="text-xs font-bold text-white mt-1 leading-snug">
                  {selectedPinTeam.name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedPinTeam(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 font-mono text-[11px] text-slate-400 border-t border-slate-800 pt-2">
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="text-white font-sans">{selectedPinTeam.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Base Station:</span>
                <span className="text-slate-300 truncate max-w-[160px]">
                  {selectedPinTeam.assignedLocation}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coordinates:</span>
                <span className="text-white">
                  {selectedPinTeam.latitude.toFixed(4)}, {selectedPinTeam.longitude.toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Contact Radio:</span>
                <span className="text-white">{selectedPinTeam.contactInfo}</span>
              </div>
              {selectedPinTeam.assignedIncidentId && (
                <div className="flex justify-between">
                  <span>Assigned Mission:</span>
                  <span className="text-cyan-300 font-bold">{selectedPinTeam.assignedIncidentId}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={() => {
                  setActiveTab('units');
                  setSelectedPinTeam(null);
                }}
                className="w-full py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Manage in Units Directory
              </button>
            </div>
          </div>
        )}

        {/* Map Legend Overlay (Feature 5 Requirement) */}
        <div className="absolute bottom-3 left-3 z-30 p-2.5 rounded-lg bg-slate-950/85 border border-slate-800 backdrop-blur-md text-[11px] text-slate-300 space-y-1.5 pointer-events-none">
          <div className="font-bold text-white text-[10px] uppercase tracking-wider">
            Tactical Map Legend
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white ring-1 ring-red-400 animate-pulse" />
              <span className="font-bold text-red-300">SOS Beacon</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-300" />
              <span>Available Team</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 border border-rose-300" />
              <span>Critical Incident</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-amber-300" />
              <span>High Severity</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-200" />
              <span>Busy / Deployed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600 border border-slate-400" />
              <span>Resolved / Inactive</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-0.5 border-b-2 border-cyan-400 border-dashed" />
              <span>Dispatch Vector</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-500 pt-0.5 border-t border-slate-800/80">
            * Lines represent approximate Haversine vector distance, not real-time road turn-by-turn routing.
          </div>
        </div>
      </div>
    </div>
  );
};
