import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Users,
  Clock,
  Phone,
  User,
  ShieldAlert,
  Send,
  Truck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sparkles,
  LifeBuoy,
  XCircle,
  HelpCircle,
  AlertTriangle,
  History,
  Copy,
  ShieldCheck,
  Radio,
  Navigation,
  Compass,
  ArrowRight,
  Video,
  Download,
  Film,
  Camera,
  FileVideo
} from 'lucide-react';
import { Incident, IncidentStatus, SeverityLevel, VerificationStatus, VideoEvidence, getRecommendedResourceTypes } from '../../types';
import { useIncidents } from '../../context/IncidentContext';
import { SeverityBadge, StatusBadge, getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';
import { VerificationBadge } from '../common/VerificationBadge';
import { PriorityBadge } from '../common/PriorityBadge';
import { TeamBadge, TeamAvailabilityBadge } from '../common/TeamBadge';
import { getResourceTypeIcon, getResourceTypeColor, ResourceStatusBadge } from '../common/ResourceBadge';
import { AssignResourceModal } from './AssignResourceModal';
import { EmergencyVideoRecorderModal } from '../video/EmergencyVideoRecorderModal';
import { generateSimulatedVideoBlob } from '../../services/videoStorage';

interface IncidentDetailModalProps {
  incident: Incident | null;
  onClose: () => void;
  onDeleteRequest: (incident: Incident) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  onClose,
  onDeleteRequest
}) => {
  const {
    updateStatus,
    updateSeverity,
    updateIncidentNotes,
    updateVerificationStatus,
    resources,
    teams,
    assignTeamToIncident,
    releaseTeamFromIncident,
    releaseResourceFromIncident,
    releaseAllIncidentResources,
    saveIncidentVideo,
    getIncidentVideo,
    deleteIncidentVideo,
    setActiveTab: setGlobalActiveTab
  } = useIncidents();

  const [activeTab, setActiveTab] = useState<'overview' | 'video' | 'resources' | 'verification' | 'timeline'>('overview');
  const [newNote, setNewNote] = useState('');
  const [verificationNoteInput, setVerificationNoteInput] = useState('');
  const [severityChangeReason, setSeverityChangeReason] = useState('');
  const [isEditingSeverity, setIsEditingSeverity] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Video Evidence state
  const [videoData, setVideoData] = useState<{ blob: Blob; metadata: VideoEvidence; objectUrl: string } | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Load video evidence from IndexedDB when incident changes
  useEffect(() => {
    if (!incident) return;

    let active = true;
    let createdUrl: string | null = null;
    setIsLoadingVideo(true);

    getIncidentVideo(incident.id)
      .then(async (data) => {
        if (!active) return;
        if (data) {
          createdUrl = data.objectUrl;
          setVideoData(data);
        } else if (incident.hasVideoEvidence) {
          // If marked with video but not found in IndexedDB yet (e.g. sample or mock data),
          // seed simulated footage so it's playable immediately!
          try {
            const sim = await generateSimulatedVideoBlob(incident.title, incident.category, 6);
            if (!active) return;
            const evidence = await saveIncidentVideo(incident.id, sim.blob, {
              durationSeconds: sim.duration,
              mimeType: sim.mimeType,
              hasAudio: true,
              fileName: `evidence_${incident.id}.webm`
            });
            const url = URL.createObjectURL(sim.blob);
            createdUrl = url;
            setVideoData({
              blob: sim.blob,
              metadata: evidence,
              objectUrl: url
            });
          } catch (e) {
            console.warn('Failed to seed simulated video:', e);
            if (active) setVideoData(null);
          }
        } else {
          setVideoData(null);
        }
      })
      .catch((err) => {
        console.warn('Could not read incident video from IndexedDB:', err);
        if (active) setVideoData(null);
      })
      .finally(() => {
        if (active) setIsLoadingVideo(false);
      });

    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [incident?.id, incident?.hasVideoEvidence, getIncidentVideo, saveIncidentVideo]);

  if (!incident) return null;

  const Icon = getCategoryIcon(incident.category);
  const colors = getCategoryColor(incident.category);

  // Match assigned resources
  const assignedResourcesList = resources.filter(r =>
    incident.assignedResourceIds?.includes(r.id) ||
    r.assignedIncidentId === incident.id ||
    incident.assignedUnits.includes(r.name)
  );

  const recommendedTypes = getRecommendedResourceTypes(incident.category);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    updateIncidentNotes(incident.id, newNote.trim());
    setNewNote('');
  };

  const handleSeverityChange = (newSev: SeverityLevel) => {
    updateSeverity(
      incident.id,
      newSev,
      severityChangeReason || `Administrator manual override to ${newSev}`
    );
    setIsEditingSeverity(false);
    setSeverityChangeReason('');
  };

  const handleStatusChange = (newStatus: IncidentStatus) => {
    updateStatus(
      incident.id,
      newStatus,
      `Status changed from ${incident.status} to ${newStatus}`
    );
  };

  const handleReleaseAll = () => {
    releaseAllIncidentResources(incident.id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
        <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${colors.bg} ${colors.border} ${colors.text}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {incident.id}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <span className="text-xs text-slate-300 font-medium">
                    {incident.category}
                  </span>
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <PriorityBadge
                    score={incident.priorityScore ?? 0}
                    rank={incident.priorityRank}
                    breakdown={incident.priorityBreakdown}
                    size="sm"
                    showDetailsButton={true}
                  />
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <SeverityBadge severity={incident.severity} />
                  <StatusBadge status={incident.status} />
                  <span className="text-slate-600" aria-hidden="true">·</span>
                  <VerificationBadge status={incident.verificationStatus || 'Unverified'} />
                  {incident.isSOS && (
                    <>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-[11px] text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-600 animate-pulse">
                        <Radio className="w-3 h-3 text-rose-400" />
                        <span>ONE-TAP SOS</span>
                      </span>
                    </>
                  )}
                  {incident.hasVideoEvidence && (
                    <>
                      <span className="text-slate-600" aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-bold font-mono text-[11px] text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-600/70">
                        <Video className="w-3 h-3 text-amber-400" />
                        <span>VIDEO EVIDENCE</span>
                      </span>
                    </>
                  )}
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white text-wrap">
                  {incident.title}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onDeleteRequest(incident)}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                title="Delete incident report"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Subnav */}
          <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-800 bg-slate-900/90 text-xs overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Incident Overview
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'video'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Evidence Video</span>
              {incident.hasVideoEvidence ? (
                <span className="font-mono text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-bold animate-pulse">
                  1 Attached
                </span>
              ) : (
                <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-400">
                  None
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'resources'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Allocated Resources</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                {assignedResourcesList.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'verification'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verification</span>
              {incident.duplicateMatches && incident.duplicateMatches.length > 0 && (
                <span className="font-mono text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.2 rounded font-bold">
                  {incident.duplicateMatches.length} Dupe
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 font-medium border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'border-rose-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Audit Timeline</span>
              <span className="font-mono text-[10px] bg-slate-800 px-1.5 py-0.2 rounded text-slate-300">
                {incident.timeline.length}
              </span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* One-Tap SOS Beacon Telemetry Banner */}
                {incident.isSOS && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-slate-950 border-2 border-rose-600/80 shadow-lg shadow-rose-950/40 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                        </span>
                        <h3 className="text-xs font-black tracking-wider uppercase text-rose-300 flex items-center gap-1.5 font-mono">
                          <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                          One-Tap SOS Emergency Beacon
                        </h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Status: Unverified – Awaiting Review
                      </span>
                    </div>

                    <p className="text-xs text-rose-100/90 leading-relaxed">
                      This incident was triggered via the <span className="font-bold text-white">One-Tap Instant SOS System</span>. GPS coordinates and intake telemetry were automatically captured and registered for emergency triage and rapid team dispatch.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-rose-900/50">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Intake Mode</div>
                        <div className="font-mono text-rose-400 font-bold mt-0.5 flex items-center gap-1">
                          <Radio className="w-3.5 h-3.5" /> 1-Tap Beacon
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">GPS Precision</div>
                        <div className="font-mono text-cyan-300 font-semibold mt-0.5">
                          {incident.gpsAccuracy ? `±${Math.round(incident.gpsAccuracy)}m Accuracy` : 'Browser Coordinates'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Location Lat/Lng</div>
                        <div className="font-mono text-slate-200 mt-0.5 truncate text-[11px]">
                          {incident.location?.lat && incident.location?.lng ? `${incident.location.lat.toFixed(4)}, ${incident.location.lng.toFixed(4)}` : 'Awaiting GPS'}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Intake Timestamp</div>
                        <div className="font-mono text-slate-300 mt-0.5 text-[11px]">
                          {incident.sosDeviceState?.capturedAt ? new Date(incident.sosDeviceState.capturedAt).toLocaleTimeString() : new Date(incident.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Evidence Video Section (Feature: Video Capture & Evidence Management) */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4 text-rose-400" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Incident Evidence Video</span>
                        <span className="font-mono text-[10px] text-cyan-400 font-normal lowercase bg-cyan-950/60 border border-cyan-800/80 px-2 py-0.5 rounded">
                          indexedDB
                        </span>
                      </h3>
                    </div>
                    {videoData ? (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Video Attached
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
                        No Video Attached
                      </span>
                    )}
                  </div>

                  {isLoadingVideo ? (
                    <div className="p-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                      <span>Retrieving video from local IndexedDB storage...</span>
                    </div>
                  ) : videoData ? (
                    <div className="space-y-3">
                      {/* Video Player */}
                      <div className="relative aspect-video max-h-64 w-full bg-black rounded-lg overflow-hidden border border-slate-800 mx-auto">
                        <video
                          src={videoData.objectUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Video Metadata Table */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Incident ID</span>
                          <span className="font-mono text-white font-bold">{incident.id}</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Recording Timestamp</span>
                          <span className="font-mono text-slate-300 text-[11px]">
                            {new Date(videoData.metadata.recordedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Duration & Size</span>
                          <span className="font-mono text-cyan-300 text-[11px]">
                            ~{videoData.metadata.durationSeconds}s · {(videoData.metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase font-mono">Local Store</span>
                          <span className="font-mono text-emerald-400 font-semibold text-[11px]">
                            ResQ_EvidenceDB
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-800/80">
                        <p className="text-[11px] text-slate-400">
                          Footage is sealed with this incident record and saved locally in IndexedDB.
                        </p>
                        <div className="flex items-center gap-2">
                          <a
                            href={videoData.objectUrl}
                            download={videoData.metadata.fileName || `emergency_evidence_${incident.id}.webm`}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Video</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => deleteIncidentVideo(incident.id)}
                            className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-center gap-1.5 transition-colors"
                            title="Delete video evidence from IndexedDB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 font-semibold text-slate-300">
                          <Film className="w-4 h-4 text-slate-500" />
                          <span>No Video Evidence Available</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          The reporter did not submit video footage with this intake report. Physical verification and field logs are currently active.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsRecordModalOpen(true)}
                        className="px-3.5 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/50 hover:bg-rose-900/60 border border-rose-800/70 rounded-lg flex items-center gap-1.5 shrink-0 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-rose-400" />
                        <span>Record / Attach Field Video</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Priority Scoring Engine Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        Intelligent Priority Engine (Code Clash Round 2)
                      </h3>
                    </div>
                    <PriorityBadge
                      score={incident.priorityScore ?? 0}
                      rank={incident.priorityRank}
                      breakdown={incident.priorityBreakdown}
                      size="md"
                    />
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold">Triage Calculation: </span>
                    {incident.priorityBreakdown?.explanation || 'Calculated dynamic priority based on severity, casualty count, time elapsed, and category weight.'}
                  </p>

                  {incident.priorityBreakdown && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Severity</div>
                        <div className="font-mono font-bold text-white text-sm">{incident.priorityBreakdown.severityPoints} / 40</div>
                        <div className="text-[10px] text-slate-500">{incident.severity}</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Casualties</div>
                        <div className="font-mono font-bold text-white text-sm">{incident.priorityBreakdown.affectedPoints} / 25</div>
                        <div className="text-[10px] text-slate-500">{incident.affectedCount} affected</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Elapsed Time</div>
                        <div className="font-mono font-bold text-white text-sm">{incident.priorityBreakdown.elapsedPoints} / 20</div>
                        <div className="text-[10px] text-slate-500">{incident.priorityBreakdown.timeElapsedMinutes} mins</div>
                      </div>
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Category Weight</div>
                        <div className="font-mono font-bold text-white text-sm">+{incident.priorityBreakdown.categoryPoints} / 15</div>
                        <div className="text-[10px] text-slate-500">Urgency Multiplier</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Response Team Dispatch Status Card */}
                {(() => {
                  const assignedTeam = teams.find(t => t.id === incident.assignedTeamId || t.assignedIncidentId === incident.id);
                  return (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                            Response Team Dispatch
                          </h3>
                        </div>
                        {assignedTeam ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/70 text-amber-300 border border-amber-800/80 text-xs font-semibold">
                            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                            Dispatched & Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 text-xs font-semibold">
                            Pending Team Allocation
                          </span>
                        )}
                      </div>

                      {assignedTeam ? (
                        <div className="p-3.5 rounded-lg bg-slate-900/90 border border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-white">{assignedTeam.id}</span>
                              <span className="text-slate-600">·</span>
                              <span className="text-xs font-bold text-amber-300">{assignedTeam.name}</span>
                              <TeamBadge category={assignedTeam.category} size="sm" />
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-0.5">
                              <span>Base: {assignedTeam.assignedLocation}</span>
                              {assignedTeam.contactNumber && (
                                <>
                                  <span className="text-slate-600">·</span>
                                  <span>{assignedTeam.contactNumber}</span>
                                </>
                              )}
                              <span className="text-slate-600">·</span>
                              <span>GPS: {assignedTeam.latitude.toFixed(4)}, {assignedTeam.longitude.toFixed(4)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                releaseTeamFromIncident(incident.id, assignedTeam.id);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-200 border border-amber-700/80 text-xs font-medium transition-colors flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Release Team</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-dashed border-slate-800 flex items-center justify-between gap-3">
                          <p className="text-xs text-slate-400">
                            No emergency response team currently assigned to this incident.
                          </p>
                          <button
                            onClick={() => {
                              onClose();
                              setGlobalActiveTab('dispatch');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          >
                            <span>Dispatch Center</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Status & Severity Control Panel */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status Switcher */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Incident Status
                    </label>
                    <div className="flex items-center gap-2">
                      <select
                        value={incident.status}
                        onChange={(e) => handleStatusChange(e.target.value as IncidentStatus)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium cursor-pointer"
                      >
                        <option value="Reported">Reported (Unassigned)</option>
                        <option value="Assigned">Assigned (Team Dispatched)</option>
                        <option value="Pending">Pending Triage</option>
                        <option value="In Progress">In Progress (Active Dispatch)</option>
                        <option value="Resolved">Resolved (Safe / Closed)</option>
                      </select>
                    </div>

                    {/* Requirement 7: Release notification if Resolved */}
                    {incident.status === 'Resolved' && (incident.assignedTeamId || assignedResourcesList.length > 0) && (
                      <div className="p-2 mt-1 rounded bg-amber-950/40 border border-amber-800/60 text-[11px] text-amber-300 flex items-center justify-between gap-2">
                        <span>Incident resolved with active assignments.</span>
                        <button
                          onClick={() => {
                            if (incident.assignedTeamId) {
                              releaseTeamFromIncident(incident.id, incident.assignedTeamId);
                            }
                            handleReleaseAll();
                          }}
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold whitespace-nowrap"
                        >
                          Release All
                        </button>
                      </div>
                    )}

                    <span className="text-[11px] text-slate-400">
                      Changing status auto-records timestamped audit log.
                    </span>
                  </div>

                  {/* Severity Adjuster */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Severity Classification
                      </label>
                      <button
                        onClick={() => setIsEditingSeverity(!isEditingSeverity)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
                      >
                        {isEditingSeverity ? 'Done' : 'Change'}
                      </button>
                    </div>

                    {isEditingSeverity ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['Low', 'Medium', 'High', 'Critical'] as SeverityLevel[]).map(level => (
                            <button
                              key={level}
                              onClick={() => handleSeverityChange(level)}
                              className={`py-1.5 px-2 text-xs font-semibold rounded border transition-colors ${
                                incident.severity === level
                                  ? 'bg-rose-600 text-white border-rose-500'
                                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Optional reason for override..."
                          value={severityChangeReason}
                          onChange={(e) => setSeverityChangeReason(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-rose-500"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                        <div className="flex items-center gap-2">
                          <SeverityBadge severity={incident.severity} />
                          <span className="text-xs text-slate-300">Current Rating</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Auto-Suggested: {incident.suggestedSeverity}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400">
                      <span className="text-slate-300 font-medium">Triage Logic:</span> {incident.severityReason}
                    </p>
                  </div>
                </div>

                {/* Allocated Resources Quick Bar */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Emergency Resources Deployed ({assignedResourcesList.length})
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {assignedResourcesList.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">No resources allocated yet</span>
                      ) : (
                        assignedResourcesList.map(r => (
                          <span
                            key={r.id}
                            className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-200 px-2 py-0.5 rounded text-xs font-mono"
                          >
                            <span className="text-rose-400 font-bold">{r.id}</span>
                            <span className="truncate max-w-[120px]">{r.name}</span>
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Allocate Resource</span>
                    </button>
                    {assignedResourcesList.length > 0 && (
                      <button
                        onClick={() => setActiveTab('resources')}
                        className="px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors"
                      >
                        Manage
                      </button>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Incident Description
                  </h4>
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed">
                    {incident.description}
                  </div>
                </div>

                {/* Key Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Location Box */}
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <MapPin className="w-4 h-4 text-rose-400" />
                      <span>Location Details</span>
                    </div>
                    <div className="text-xs text-white font-medium">
                      {incident.location.address}
                    </div>
                    {incident.location.landmark && (
                      <div className="text-[11px] text-slate-400">
                        Landmark: {incident.location.landmark}
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Zone: {incident.location.zone}</span>
                      <span className="text-slate-600">·</span>
                      <span>GPS: {incident.location.lat.toFixed(4)}, {incident.location.lng.toFixed(4)}</span>
                    </div>
                  </div>

                  {/* Impact & Reporter Box */}
                  <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                      <Users className="w-4 h-4 text-amber-400" />
                      <span>Casualty & Impact</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold font-mono text-white tabular-nums">
                        {incident.affectedCount}
                      </span>
                      <span className="text-xs text-slate-400">people directly impacted</span>
                    </div>
                    <div className="text-xs text-slate-300 border-t border-slate-800/80 pt-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{incident.reporter.name || 'Anonymous Reporter'}</span>
                        {incident.reporter.relationship && (
                          <span className="text-slate-400 text-[11px]">({incident.reporter.relationship})</span>
                        )}
                      </div>
                      {incident.reporter.phone && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{incident.reporter.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick note addition */}
                <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Add Dispatch Log / Operations Update
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Enter responder update, patient status, or tactical instructions..."
                      className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={!newNote.trim()}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'video' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Video className="w-4 h-4 text-rose-400" />
                        <span>Field Video Evidence Analysis & Playback</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Incident ID: <span className="font-mono text-white font-bold">{incident.id}</span> · Stored safely in client-side IndexedDB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsRecordModalOpen(true)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{videoData ? 'Record New / Replace Footage' : 'Record Emergency Video'}</span>
                      </button>
                    </div>
                  </div>

                  {isLoadingVideo ? (
                    <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                      <span>Reading footage from local IndexedDB storage...</span>
                    </div>
                  ) : videoData ? (
                    <div className="space-y-4">
                      {/* Cinema Video Player */}
                      <div className="relative aspect-video max-h-96 w-full bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl mx-auto">
                        <video
                          src={videoData.objectUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Technical Specs Card */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                        <div className="text-[11px] font-bold text-white uppercase tracking-wider font-mono">
                          Forensic Telemetry & Registry Metadata
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Incident ID</span>
                            <span className="font-mono text-white font-bold">{incident.id}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Recorded At</span>
                            <span className="font-mono text-slate-300 text-[11px]">
                              {new Date(videoData.metadata.recordedAt).toLocaleString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Duration & Size</span>
                            <span className="font-mono text-cyan-300 text-[11px]">
                              ~{videoData.metadata.durationSeconds}s · {(videoData.metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase">Encoding & Storage</span>
                            <span className="font-mono text-emerald-400 text-[11px]">
                              {videoData.metadata.mimeType.split(';')[0]} (IndexedDB)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Preserved locally in IndexedDB object store <code className="text-cyan-400">ResQ_EvidenceDB_v1</code>.
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={videoData.objectUrl}
                            download={videoData.metadata.fileName || `emergency_evidence_${incident.id}.webm`}
                            className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            <span>Download Full Evidence</span>
                          </a>

                          <button
                            type="button"
                            onClick={() => deleteIncidentVideo(incident.id)}
                            className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Purge Video</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 text-center rounded-xl bg-slate-900/50 border border-dashed border-slate-800 space-y-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                        <Film className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Video Evidence Filed for This Incident</h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                        The reporting party submitted this incident without video footage. Field response crews or dispatch supervisors may record and attach supplemental video evidence to this case file.
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setIsRecordModalOpen(true)}
                          className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md transition-colors inline-flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Record / Attach Field Video</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-4">
                {/* Header action bar */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-rose-400" />
                      <span>Emergency Resource Dispatch Manager</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Recommended: <span className="text-amber-300 font-semibold">{recommendedTypes.join(' & ')}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setIsAssignModalOpen(true)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Allocate Resource</span>
                    </button>

                    {assignedResourcesList.length > 0 && (
                      <button
                        onClick={handleReleaseAll}
                        className="px-3 py-2 text-xs font-medium text-amber-300 hover:text-white bg-amber-950/40 hover:bg-amber-900/60 border border-amber-800/60 rounded-lg transition-colors flex items-center gap-1.5"
                        title="Release all allocated resources back to base"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Release All ({assignedResourcesList.length})</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Assigned Resources List */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider">
                      Currently Assigned Resources ({assignedResourcesList.length})
                    </span>
                    <span className="text-[11px] italic">Simulated Deployment Fleet</span>
                  </div>

                  {assignedResourcesList.length === 0 ? (
                    <div className="p-8 text-center rounded-lg bg-slate-950/40 border border-dashed border-slate-800 space-y-2">
                      <Truck className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-xs text-slate-300 font-medium">No resources allocated to this incident yet</p>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        Click "Allocate Resource" to dispatch fire units, ambulances, medical teams, or rescue squads based on category triage.
                      </p>
                      <div className="pt-2">
                        <button
                          onClick={() => setIsAssignModalOpen(true)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors"
                        >
                          Select & Dispatch Resource
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2.5">
                      {assignedResourcesList.map(res => {
                        const resType = res.type || res.category;
                        const ResIcon = getResourceTypeIcon(resType);
                        const resColors = getResourceTypeColor(resType);

                        return (
                          <div
                            key={res.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center border shrink-0 mt-0.5 ${resColors.bg} ${resColors.border} ${resColors.text}`}
                              >
                                <ResIcon className="w-4 h-4" />
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-bold text-white">{res.id}</span>
                                  <span className="text-slate-600">·</span>
                                  <span className="text-xs font-medium text-slate-300">{res.type}</span>
                                  <ResourceStatusBadge status={res.status} />
                                </div>

                                <h4 className="text-xs font-bold text-white truncate max-w-md">
                                  {res.name}
                                </h4>

                                <div className="text-[11px] text-slate-400 space-x-3">
                                  <span>Station: <strong className="text-slate-300 font-normal">{res.assignedLocation}</strong></span>
                                  {res.contactNumber && <span className="font-mono">{res.contactNumber}</span>}
                                  {res.crewCount && <span>Crew: {res.crewCount}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              <button
                                onClick={() => releaseResourceFromIncident(incident.id, res.id)}
                                className="px-3 py-1.5 text-xs font-medium text-amber-300 hover:text-white bg-slate-900 hover:bg-amber-950/80 border border-slate-700 hover:border-amber-700 rounded-lg transition-colors flex items-center gap-1.5"
                                title="Release this resource back to Available status"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Release Resource</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'verification' && (
              <div className="space-y-4">
                {/* Status Switcher & Note */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Incident Verification Status</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Current: <strong className="text-white">{incident.verificationStatus || 'Unverified'}</strong>
                        {incident.verifiedBy && ` (Assessed by ${incident.verifiedBy})`}
                      </p>
                    </div>
                    <VerificationBadge status={incident.verificationStatus || 'Unverified'} size="md" />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Change Status with Administrator Note:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Optional verification note or cross-check details..."
                        value={verificationNoteInput}
                        onChange={(e) => setVerificationNoteInput(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <button
                        onClick={() => {
                          updateVerificationStatus(incident.id, 'Verified', verificationNoteInput || 'Administrator verified report on-scene / verified call');
                          setVerificationNoteInput('');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          incident.verificationStatus === 'Verified'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 text-emerald-300 border-emerald-800 hover:bg-emerald-950'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified</span>
                      </button>

                      <button
                        onClick={() => {
                          updateVerificationStatus(incident.id, 'Under Review', verificationNoteInput || 'Report queued for detailed verification review');
                          setVerificationNoteInput('');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          incident.verificationStatus === 'Under Review'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-slate-900 text-amber-300 border-amber-800 hover:bg-amber-950'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Under Review</span>
                      </button>

                      <button
                        onClick={() => {
                          updateVerificationStatus(incident.id, 'Unable to Verify', verificationNoteInput || 'Unable to establish contact or physical confirmation');
                          setVerificationNoteInput('');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          incident.verificationStatus === 'Unable to Verify'
                            ? 'bg-slate-700 text-white border-slate-600'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Unable to Verify</span>
                      </button>

                      <button
                        onClick={() => {
                          updateVerificationStatus(incident.id, 'Unverified', verificationNoteInput || 'Reset to unverified status');
                          setVerificationNoteInput('');
                        }}
                        className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                          incident.verificationStatus === 'Unverified'
                            ? 'bg-slate-700 text-white border-slate-600'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Unverified</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Duplicate Matches */}
                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Copy className="w-4 h-4 text-cyan-400" />
                      <span>Possible Duplicate Matches</span>
                    </h4>
                    <span className="font-mono text-[11px] text-cyan-300">
                      {incident.duplicateMatches?.length || 0} matching reports
                    </span>
                  </div>

                  {(!incident.duplicateMatches || incident.duplicateMatches.length === 0) ? (
                    <p className="text-xs text-slate-400 italic">
                      No matching duplicate reports identified for this incident.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {incident.duplicateMatches.map((dm) => (
                        <div
                          key={dm.matchedIncidentId}
                          className="p-3 rounded bg-slate-900 border border-cyan-800/60 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-cyan-300">
                              Matches {dm.matchedIncidentId}
                            </span>
                            <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                              {dm.similarityScore}% Match Score
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-300 pt-1">
                            {dm.reasons.map((r, ri) => (
                              <span key={ri} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Suspicious Review Indicators */}
                {incident.suspiciousIndicators && incident.suspiciousIndicators.length > 0 && (
                  <div className="p-3.5 rounded-lg bg-slate-950 border border-amber-900/60 space-y-2">
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span>Reasons for Review ({incident.suspiciousIndicators.length})</span>
                    </h4>
                    <div className="space-y-1.5">
                      {incident.suspiciousIndicators.map((ind, idx) => (
                        <div key={idx} className="p-2.5 rounded bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200">
                          {ind.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification History Log */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" />
                    <span>Verification Audit History ({incident.verificationHistory?.length || 0})</span>
                  </h4>

                  {(!incident.verificationHistory || incident.verificationHistory.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">No verification transitions recorded yet.</p>
                  ) : (
                    <div className="space-y-2 border-l-2 border-slate-800 ml-2 pl-4">
                      {incident.verificationHistory.map((rec) => (
                        <div key={rec.id} className="relative space-y-0.5 text-xs">
                          <div className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">
                              {rec.previousStatus} → <span className="text-emerald-400">{rec.newStatus}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {new Date(rec.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            By {rec.author}
                          </div>
                          {rec.note && (
                            <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800/80 mt-1">
                              {rec.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Full Audit Trail & Logs ({incident.timeline.length} Events)
                </h4>

                <div className="space-y-2.5 border-l-2 border-slate-800 ml-2 pl-4">
                  {incident.timeline.map((event) => (
                    <div key={event.id} className="relative group space-y-1">
                      <div className="absolute -left-[22px] top-1.5 w-2.5 h-2.5 rounded-full bg-slate-700 ring-4 ring-slate-900" />
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">
                          {event.action}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {new Date(event.timestamp).toLocaleTimeString()} · {new Date(event.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Operator: <span className="text-slate-300 font-medium">{event.author}</span>
                      </div>
                      {event.note && (
                        <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800/80 mt-1">
                          {event.note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="text-slate-400 font-mono text-[11px]">
              Reported: {new Date(incident.timestamp).toLocaleString()}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Allocation Dispatch Modal */}
      <AssignResourceModal
        isOpen={isAssignModalOpen}
        incident={incident}
        onClose={() => setIsAssignModalOpen(false)}
      />

      {/* Emergency Video Recorder Modal */}
      <EmergencyVideoRecorderModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onVideoRecorded={async (blob, meta) => {
          await saveIncidentVideo(incident.id, blob, meta);
        }}
        incidentTitle={incident.title}
        incidentCategory={incident.category}
      />
    </>
  );
};
