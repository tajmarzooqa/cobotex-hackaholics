import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ShieldAlert,
  MapPin,
  Radio,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Car,
  HeartPulse,
  Waves,
  Building2,
  Users,
  Phone,
  Send,
  Navigation,
  Lock,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Video,
  Camera,
  Film
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { EmergencyCategory, Incident, VideoEvidence } from '../../types';
import { PriorityBadge } from '../common/PriorityBadge';
import { EmergencyVideoRecorderModal } from '../video/EmergencyVideoRecorderModal';

interface SOSTriggerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSTriggerModal: React.FC<SOSTriggerModalProps> = ({ isOpen, onClose }) => {
  const {
    triggerOneTapSOS,
    updateIncident,
    updateStatus,
    saveIncidentVideo,
    getIncidentVideo,
    deleteIncidentVideo,
    setSelectedIncident,
    setActiveTab,
    incidents
  } = useIncidents();

  // Active created SOS incident
  const [sosIncident, setSosIncident] = useState<Incident | null>(null);

  // Video Evidence states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoData, setVideoData] = useState<{ blob: Blob; metadata: VideoEvidence; objectUrl: string } | null>(null);

  // Geolocation states
  const [gpsStatus, setGpsStatus] = useState<'requesting' | 'locked' | 'denied' | 'error' | 'manual'>('requesting');
  const [gpsErrorMsg, setGpsErrorMsg] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Progressive details
  const [selectedCategory, setSelectedCategory] = useState<EmergencyCategory>('Medical Emergency');
  const [affectedCount, setAffectedCount] = useState<number>(1);
  const [contactPhone, setContactPhone] = useState('');
  const [distressNotes, setDistressNotes] = useState('');
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState('');

  // Track if initial SOS trigger was fired
  const hasTriggeredRef = useRef(false);

  // Quick categories
  const categories: { label: string; value: EmergencyCategory; icon: React.ElementType; color: string; border: string; bg: string }[] = [
    {
      label: 'Medical Emergency',
      value: 'Medical Emergency',
      icon: HeartPulse,
      color: 'text-rose-400',
      border: 'border-rose-600',
      bg: 'bg-rose-950/40 hover:bg-rose-900/60'
    },
    {
      label: 'Fire',
      value: 'Fire Emergency',
      icon: Flame,
      color: 'text-orange-400',
      border: 'border-orange-600',
      bg: 'bg-orange-950/40 hover:bg-orange-900/60'
    },
    {
      label: 'Road Accident',
      value: 'Road Accident',
      icon: Car,
      color: 'text-amber-400',
      border: 'border-amber-600',
      bg: 'bg-amber-950/40 hover:bg-amber-900/60'
    },
    {
      label: 'Flood',
      value: 'Flood',
      icon: Waves,
      color: 'text-cyan-400',
      border: 'border-cyan-600',
      bg: 'bg-cyan-950/40 hover:bg-cyan-900/60'
    },
    {
      label: 'Building Collapse',
      value: 'Building Collapse',
      icon: Building2,
      color: 'text-yellow-400',
      border: 'border-yellow-600',
      bg: 'bg-yellow-950/40 hover:bg-yellow-900/60'
    },
    {
      label: 'Other Emergency',
      value: 'Other Emergencies',
      icon: AlertTriangle,
      color: 'text-purple-400',
      border: 'border-purple-600',
      bg: 'bg-purple-950/40 hover:bg-purple-900/60'
    }
  ];

  // Sector presets for manual location fallback
  const sectorPresets = [
    'Sector 1 - Central Commercial Metro',
    'Sector 2 - Residential North District',
    'Sector 3 - Industrial Tech Corridor',
    'Sector 4 - Highway 101 Interchange',
    'Sector 5 - Riverside Promenade Area'
  ];

  // 1. Trigger SOS Immediately when modal opens
  useEffect(() => {
    if (!isOpen) {
      hasTriggeredRef.current = false;
      setSosIncident(null);
      return;
    }

    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    // Instantly create the SOS report without waiting for GPS to complete
    const result = triggerOneTapSOS({
      address: 'GPS Locating... Beacon Active',
      permissionGranted: false
    });

    setSosIncident(result.incident);
    setSelectedIncident(result.incident);
    setSelectedCategory(result.incident.category);

    // Concurrently request real browser geolocation
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setGpsStatus('requesting');
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const accuracy = Math.round(pos.coords.accuracy);

          setCoords({ lat, lng, accuracy });
          setGpsStatus('locked');

          const formattedAddress = `GPS Beacon Fix: ${lat.toFixed(5)}°, ${lng.toFixed(5)}° (±${accuracy}m)`;

          // Automatically update the SOS incident with real coordinates
          updateIncident(
            result.incident.id,
            {
              location: {
                lat,
                lng,
                address: formattedAddress,
                zone: 'GPS Geolocation Beacon'
              },
              gpsAccuracy: accuracy,
              sosDeviceState: {
                isOnline: navigator.onLine,
                permissionGranted: true,
                capturedAt: new Date().toISOString()
              }
            },
            `Real-time GPS lock acquired: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy}m accuracy).`
          );
        },
        (err) => {
          console.warn('Geolocation error during SOS activation:', err);
          let message = 'Location permission denied by user.';
          if (err.code === err.TIMEOUT) message = 'GPS acquisition timed out.';
          else if (err.code === err.POSITION_UNAVAILABLE) message = 'GPS position unavailable on this device.';

          setGpsStatus('denied');
          setGpsErrorMsg(message);
          setIsEditingAddress(true);

          // Update incident to reflect manual location needed
          updateIncident(
            result.incident.id,
            {
              location: {
                lat: 37.7749,
                lng: -122.4194,
                address: 'Location Pending Citizen Confirmation',
                zone: 'Sector 1 - Central Metro (Default)'
              },
              sosDeviceState: {
                isOnline: navigator.onLine,
                permissionGranted: false,
                capturedAt: new Date().toISOString()
              }
            },
            `GPS permission denied/unavailable: ${message}. Waiting for manual address entry.`
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      setGpsStatus('error');
      setGpsErrorMsg('Browser geolocation not supported on this device.');
      setIsEditingAddress(true);
    }
  }, [isOpen]);

  // Keep synced with latest state in context
  useEffect(() => {
    if (sosIncident) {
      const match = incidents.find(i => i.id === sosIncident.id);
      if (match) {
        setSosIncident(match);
      }
    }
  }, [incidents]);

  // Load video evidence from IndexedDB for this SOS incident
  useEffect(() => {
    if (!sosIncident?.id) return;
    let active = true;
    let currentUrl: string | null = null;

    getIncidentVideo(sosIncident.id).then((data) => {
      if (!active) return;
      if (data) {
        currentUrl = data.objectUrl;
        setVideoData(data);
      } else {
        setVideoData(null);
      }
    });

    return () => {
      active = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [sosIncident?.id, sosIncident?.hasVideoEvidence, getIncidentVideo]);

  const handleSOSVideoRecorded = async (
    blob: Blob,
    meta: {
      durationSeconds: number;
      mimeType: string;
      sizeBytes: number;
      hasAudio: boolean;
      fileName?: string;
    }
  ) => {
    if (!sosIncident) return;
    try {
      const evidence = await saveIncidentVideo(sosIncident.id, blob, {
        durationSeconds: meta.durationSeconds,
        mimeType: meta.mimeType,
        hasAudio: meta.hasAudio,
        fileName: `sos_evidence_${sosIncident.id}.webm`
      });
      const url = URL.createObjectURL(blob);
      setVideoData({ blob, metadata: evidence, objectUrl: url });
      setSosIncident((prev) => (prev ? { ...prev, hasVideoEvidence: true, videoEvidence: evidence } : null));
      showTransientFeedback('Emergency video evidence attached to SOS Beacon!');
    } catch (err) {
      console.error('Failed to attach video to SOS beacon:', err);
    }
  };

  const handleDeleteSOSVideo = async () => {
    if (!sosIncident) return;
    await deleteIncidentVideo(sosIncident.id);
    if (videoData?.objectUrl) {
      URL.revokeObjectURL(videoData.objectUrl);
    }
    setVideoData(null);
    setSosIncident((prev) => (prev ? { ...prev, hasVideoEvidence: false, videoEvidence: undefined } : null));
    showTransientFeedback('Video evidence cleared from beacon');
  };

  if (!isOpen || !sosIncident) return null;

  // Handle category update
  const handleSelectCategory = (cat: EmergencyCategory) => {
    setSelectedCategory(cat);
    updateIncident(
      sosIncident.id,
      {
        category: cat,
        title: `EMERGENCY SOS: ${cat.toUpperCase()} [${sosIncident.id}]`
      },
      `Citizen confirmed emergency category as: ${cat}.`
    );
    showTransientFeedback(`Category updated to ${cat}`);
  };

  // Handle casualty count
  const handleUpdateCasualties = (count: number) => {
    setAffectedCount(count);
    updateIncident(
      sosIncident.id,
      { affectedCount: count },
      `Casualties/impact count updated to ${count} person(s).`
    );
    showTransientFeedback(`Casualty count updated to ${count}`);
  };

  // Handle manual address submission
  const handleManualAddressSubmit = (addressToSave: string) => {
    if (!addressToSave.trim()) return;
    setManualAddress(addressToSave);
    setIsEditingAddress(false);
    setGpsStatus('manual');

    updateIncident(
      sosIncident.id,
      {
        location: {
          ...sosIncident.location,
          address: addressToSave.trim(),
          zone: 'Manual Location Entry'
        }
      },
      `Citizen manually entered location: ${addressToSave.trim()}`
    );
    showTransientFeedback('Location updated successfully');
  };

  // Handle optional notes and phone
  const handleSaveProgressiveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    updateIncident(
      sosIncident.id,
      {
        description: distressNotes.trim()
          ? `SOS Emergency Alert: ${distressNotes.trim()}`
          : sosIncident.description,
        reporter: {
          ...sosIncident.reporter,
          phone: contactPhone.trim() || sosIncident.reporter.phone
        }
      },
      `Additional details added. Notes: "${distressNotes || 'None'}". Contact: ${contactPhone || 'None'}.`
    );
    showTransientFeedback('Details saved to emergency beacon');
  };

  // Handle cancelling/resolving SOS
  const handleCancelSOS = () => {
    if (window.confirm('Are you sure you want to cancel this emergency beacon? This will mark the incident as Resolved.')) {
      updateStatus(
        sosIncident.id,
        'Resolved',
        'Emergency beacon cancelled / resolved by user on scene.'
      );
      onClose();
    }
  };

  const showTransientFeedback = (msg: string) => {
    setSaveFeedback(msg);
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border-2 border-rose-600/80 rounded-2xl shadow-2xl shadow-rose-950/80 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        {/* Top Emergency Status Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-950 via-slate-950 to-slate-950 border-b border-rose-800/60 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Flashing SOS beacon badge */}
            <div className="relative w-11 h-11 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-900/80 mt-0.5">
              <span className="absolute -inset-1 rounded-xl bg-rose-500 animate-ping opacity-40" />
              <Radio className="w-6 h-6 animate-pulse" />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-black tracking-widest text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-700/80">
                  {sosIncident.id}
                </span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-amber-300 bg-amber-950/80 px-2.5 py-0.5 rounded-full border border-amber-700/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Unverified – Awaiting Review
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-rose-400 font-bold font-mono">
                  CRITICAL
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Emergency Beacon Active</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Close modal (Beacon remains active in registry)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transient save feedback indicator */}
        {saveFeedback && (
          <div className="bg-emerald-950/90 border-b border-emerald-800 text-emerald-300 px-4 py-1.5 text-xs font-medium text-center flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saveFeedback}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1 text-slate-200">
          {/* Section 1: Emergency Report Confirmation Screen */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Emergency Report Transmitted</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                Logged at: {new Date(sosIncident.timestamp).toLocaleTimeString()}
              </span>
            </div>

            {/* Storage & Local Registry transmission state */}
            <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/60 text-xs text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold text-emerald-300">
                  Incident safely recorded in ResQ Local Registry
                </p>
                <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                  Beacon is live in the Admin Dashboard, Priority Queue, and Situational Tactical Map. Responders are notified.
                </p>
              </div>
            </div>

            {/* Captured Location & GPS telemetry */}
            <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Captured Incident Location</span>
                </div>

                {gpsStatus === 'requesting' && (
                  <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Acquiring GPS fix...
                  </span>
                )}
                {gpsStatus === 'locked' && coords && (
                  <span className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    GPS Locked (±{coords.accuracy}m)
                  </span>
                )}
                {gpsStatus === 'denied' && (
                  <span className="text-[11px] font-mono text-amber-300 font-bold bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    GPS Permission Denied
                  </span>
                )}
              </div>

              {/* Address display / manual edit toggle */}
              {!isEditingAddress ? (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-mono text-xs font-bold text-white truncate">
                      {sosIncident.location.address}
                    </div>
                    {coords && (
                      <div className="text-[11px] font-mono text-slate-400">
                        Coordinates: {coords.lat.toFixed(5)}°, {coords.lng.toFixed(5)}° · Zone: {sosIncident.location.zone}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setManualAddress(sosIncident.location.address);
                      setIsEditingAddress(true);
                    }}
                    className="text-xs text-rose-400 hover:text-rose-300 font-medium underline shrink-0 whitespace-nowrap"
                  >
                    Edit Location
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <p className="text-[11px] text-amber-300">
                    {gpsErrorMsg || 'Enter or refine your location address manually so teams can reach you:'}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 542 Market St, Floor 3, or nearest cross street..."
                      value={manualAddress}
                      onChange={(e) => setManualAddress(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleManualAddressSubmit(manualAddress)}
                      className="px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Save Location
                    </button>
                  </div>

                  {/* Preset quick sectors */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Quick Sectors:</span>
                    {sectorPresets.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => handleManualAddressSubmit(sec)}
                        className="text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        {sec.split('-')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Emergency Video Evidence (Triggered on SOS Help) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Emergency Video Evidence (Live Camera)</span>
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.2 rounded font-normal lowercase">
                    indexedDB
                  </span>
                </h3>
              </div>

              {videoData ? (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/80 font-bold animate-pulse">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Video Attached
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-medium">Optional Field Footage (Max 30s)</span>
              )}
            </div>

            {videoData ? (
              <div className="space-y-3">
                <div className="relative aspect-video max-h-52 w-full bg-black rounded-lg overflow-hidden border border-slate-800 shadow-md">
                  <video
                    src={videoData.objectUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono text-[11px] pt-1 border-t border-slate-800/80">
                  <span className="text-emerald-400 font-semibold truncate max-w-[260px] sm:max-w-none">
                    ✓ Attached to SOS Beacon {sosIncident.id} (~{videoData.metadata.durationSeconds}s · {(videoData.metadata.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsVideoModalOpen(true)}
                      className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Retake Video
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteSOSVideo}
                      className="px-2.5 py-1 text-rose-400 hover:text-rose-300 bg-rose-950/40 border border-rose-900/50 rounded hover:bg-rose-900/60 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-lg bg-gradient-to-r from-rose-950/30 to-slate-900/80 border border-dashed border-rose-700/40">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-xs font-semibold text-slate-200 flex items-center justify-center sm:justify-start gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>Record live emergency video evidence</span>
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Show flame severity, flood depth, or road hazards to approaching dispatch squads. Max 30s.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-lg shadow-md shadow-rose-950 flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Record Emergency Video</span>
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Quick Emergency Categories (Requirement 3) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Specify Emergency Category (Single Tap)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Selected: <strong className="text-white">{selectedCategory}</strong>
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Tap an emergency type below to update the dispatcher's recommendation engine in real time:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.value;

                return (
                  <button
                    key={cat.value}
                    onClick={() => handleSelectCategory(cat.value)}
                    type="button"
                    className={`p-3.5 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? `${cat.bg} ${cat.border} ring-2 ring-rose-500 shadow-md`
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                          isSelected
                            ? 'bg-rose-600/30 border-rose-500 text-rose-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      )}
                    </div>

                    <div>
                      <span className="text-xs font-bold text-white block">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.value === 'Medical Emergency' && 'Ambulance & ALS'}
                        {cat.value === 'Fire Emergency' && 'Fire Pumper & Rescue'}
                        {cat.value === 'Road Accident' && 'Trauma & Extrication'}
                        {cat.value === 'Flood' && 'Watercraft Rescue'}
                        {cat.value === 'Building Collapse' && 'USAR Heavy Squad'}
                        {cat.value === 'Other Emergencies' && 'General Dispatch'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Progressive Details Accordion (Casualties, Notes, Phone) */}
          <div className="rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptionalDetails(!showOptionalDetails)}
              className="w-full p-3.5 flex items-center justify-between text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Provide Additional Details (Casualties, Contact, Notes)</span>
              </div>
              {showOptionalDetails ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showOptionalDetails && (
              <form onSubmit={handleSaveProgressiveDetails} className="p-4 pt-1 space-y-4 border-t border-slate-800/80 text-xs">
                {/* People affected chips */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Estimated People Impacted / In Distress:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: '1 Person', count: 1 },
                      { label: '2–4 People', count: 3 },
                      { label: '5–9 People', count: 7 },
                      { label: '10+ People', count: 12 }
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleUpdateCasualties(item.count)}
                        className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors ${
                          affectedCount === item.count
                            ? 'bg-rose-600 text-white border-rose-500'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Optional Phone & Quick Message */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Contact Phone (Optional):
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Quick Situation Description:
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Smoke visible, patient unresponsive, trapped inside..."
                      value={distressNotes}
                      onChange={(e) => setDistressNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3 h-3" />
                    <span>Save Additional Information</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 4: Safety Guidance Checklist */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Immediate Safety Instructions While Help Is Dispatched</span>
            </h4>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              <li>Remain in a safe location unless imminent danger threatens.</li>
              <li>Keep your mobile device turned on and reachable.</li>
              <li>Do not leave the reported coordinates without updating your beacon.</li>
              <li>If you can safely help others without risking yourself, do so.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            onClick={handleCancelSOS}
            className="text-xs text-slate-400 hover:text-rose-400 font-medium underline transition-colors order-2 sm:order-1"
          >
            I am safe now / Cancel Emergency Beacon
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end order-1 sm:order-2">
            <button
              onClick={() => {
                onClose();
                setActiveTab('map');
              }}
              className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>View On Map</span>
            </button>

            <button
              onClick={() => {
                onClose();
                setActiveTab('dispatch');
              }}
              className="flex-1 sm:flex-none px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Dispatch Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Video Recorder Modal */}
      <EmergencyVideoRecorderModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onVideoRecorded={handleSOSVideoRecorded}
        existingVideoBlob={videoData?.blob}
        incidentTitle={sosIncident?.title || 'One-Tap SOS Emergency Beacon'}
        incidentCategory={selectedCategory}
      />
    </div>
  );
};
