import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Send,
  MapPin,
  Users,
  AlertTriangle,
  User,
  Phone,
  CheckCircle2,
  Navigation,
  FileText,
  Sparkles,
  ArrowRight,
  Compass,
  Video,
  Camera,
  Play,
  RotateCcw,
  Trash2,
  Film
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { EmergencyCategory, SeverityLevel, LocationInfo, ReporterInfo, VideoEvidence } from '../../types';
import { calculateSuggestedSeverity } from '../../utils/severityClassifier';
import { SeverityBadge, getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';
import { EmergencyVideoRecorderModal } from '../video/EmergencyVideoRecorderModal';

export const ReportForm: React.FC = () => {
  const { createIncident, saveIncidentVideo, setActiveTab, setSelectedIncident } = useIncidents();

  // Form states
  const [category, setCategory] = useState<EmergencyCategory>('Fire Emergency');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [zone, setZone] = useState('Sector 1 - Central Metro');
  const [affectedCount, setAffectedCount] = useState<number>(1);
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterNotes, setReporterNotes] = useState('');
  const [manualSeverity, setManualSeverity] = useState<SeverityLevel | null>(null);

  // Video Evidence states
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [attachedVideoBlob, setAttachedVideoBlob] = useState<Blob | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoMeta, setVideoMeta] = useState<{
    durationSeconds: number;
    mimeType: string;
    sizeBytes: number;
    hasAudio: boolean;
    fileName?: string;
  } | null>(null);

  // Geographic coordinates state (Feature 5)
  const [latitude, setLatitude] = useState<string>('37.7749');
  const [longitude, setLongitude] = useState<string>('-122.4194');
  const [isGpsCaptured, setIsGpsCaptured] = useState(false);

  // Validation & UI states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successReport, setSuccessReport] = useState<any | null>(null);
  const [isGeolocating, setIsGeolocating] = useState(false);

  const categories: EmergencyCategory[] = [
    'Fire Emergency',
    'Road Accident',
    'Medical Emergency',
    'Flood',
    'Building Collapse',
    'Other Emergencies'
  ];

  // Dynamic live severity calculation
  const suggestedInfo = useMemo(() => {
    return calculateSuggestedSeverity(category, affectedCount, title, description);
  }, [category, affectedCount, title, description]);

  const activeSeverity = manualSeverity || suggestedInfo.severity;

  // Preset location quick picks
  const quickLocations = [
    { address: '840 Metro Commerce Way, Suite 400', landmark: 'Opposite Central Station', zone: 'Sector 1 - Central Metro', lat: 37.784, lng: -122.407 },
    { address: 'Interstate 80 Highway Milepost 12', landmark: 'Bay Bridge Approach', zone: 'Sector 5 - Highway Corridor', lat: 37.798, lng: -122.389 },
    { address: '1240 Harbor Riverside Promenade', landmark: 'Pier 14 Walkway', zone: 'Sector 7 - Creek Basin', lat: 37.762, lng: -122.421 },
    { address: '450 North Hill Residential District', landmark: 'Near Hillside Elementary', zone: 'Sector 4 - West Residential', lat: 37.751, lng: -122.438 }
  ];

  const handleUseCurrentLocation = () => {
    setIsGeolocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGeolocating(false);
          const lat = pos.coords.latitude.toFixed(5);
          const lng = pos.coords.longitude.toFixed(5);
          setLatitude(lat);
          setLongitude(lng);
          setIsGpsCaptured(true);
          setAddress(`GPS Device Coordinates: ${lat}, ${lng}`);
          setLandmark('Browser Geolocation Sensor');
          setZone('Sector 1 - Central Metro');
        },
        (err) => {
          setIsGeolocating(false);
          setIsGpsCaptured(false);
          setAddress('310 Market Street, Downtown');
          setLandmark('Manual Fallback Location');
          setLatitude('37.7749');
          setLongitude('-122.4194');
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setIsGeolocating(false);
      setIsGpsCaptured(false);
      setAddress('310 Market Street, Downtown');
      setLatitude('37.7749');
      setLongitude('-122.4194');
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = 'Incident title is required';
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!description.trim()) {
      newErrors.description = 'Incident description is required';
    } else if (description.trim().length < 10) {
      newErrors.description = 'Please provide sufficient description for emergency triage (min 10 characters)';
    }

    if (!address.trim()) {
      newErrors.address = 'Emergency address or landmark is required';
    }

    if (affectedCount < 0) {
      newErrors.affectedCount = 'Cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleVideoRecorded = (
    blob: Blob,
    meta: {
      durationSeconds: number;
      mimeType: string;
      sizeBytes: number;
      hasAudio: boolean;
      fileName?: string;
    }
  ) => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    const url = URL.createObjectURL(blob);
    setAttachedVideoBlob(blob);
    setVideoPreviewUrl(url);
    setVideoMeta(meta);
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setAttachedVideoBlob(null);
    setVideoPreviewUrl(null);
    setVideoMeta(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const parsedLat = parseFloat(latitude) || 37.7749;
    const parsedLng = parseFloat(longitude) || -122.4194;

    const locationData: LocationInfo = {
      address: address.trim(),
      landmark: landmark.trim() || undefined,
      zone,
      lat: parsedLat,
      lng: parsedLng
    };

    const reporterData: ReporterInfo = {
      name: reporterName.trim() || undefined,
      phone: reporterPhone.trim() || undefined,
      notes: reporterNotes.trim() || undefined
    };

    let initialVideoEvidence: VideoEvidence | undefined = undefined;
    if (attachedVideoBlob && videoMeta) {
      initialVideoEvidence = {
        id: `vid-${Date.now()}`,
        incidentId: '',
        recordedAt: new Date().toISOString(),
        durationSeconds: videoMeta.durationSeconds,
        mimeType: videoMeta.mimeType,
        sizeBytes: videoMeta.sizeBytes,
        hasAudio: videoMeta.hasAudio,
        fileName: videoMeta.fileName || 'emergency_evidence.webm',
        storedInIndexedDB: true
      };
    }

    const newIncident = createIncident({
      title: title.trim(),
      description: description.trim(),
      category,
      severity: activeSeverity,
      location: locationData,
      affectedCount: Number(affectedCount) || 0,
      reporter: reporterData,
      hasVideoEvidence: !!attachedVideoBlob,
      videoEvidence: initialVideoEvidence
    });

    // If video was recorded, asynchronously seal it to IndexedDB with the confirmed incident ID
    if (attachedVideoBlob && videoMeta) {
      saveIncidentVideo(newIncident.id, attachedVideoBlob, {
        durationSeconds: videoMeta.durationSeconds,
        mimeType: videoMeta.mimeType,
        hasAudio: videoMeta.hasAudio,
        fileName: videoMeta.fileName || `emergency_evidence_${newIncident.id}.webm`
      }).catch((err) => {
        console.warn('Failed writing video to IndexedDB:', err);
      });
    }

    setIsSubmitting(false);
    setSuccessReport(newIncident);

    // Clear form inputs immediately
    setTitle('');
    setDescription('');
    setAddress('');
    setLandmark('');
    setAffectedCount(1);
    setReporterName('');
    setReporterPhone('');
    setReporterNotes('');
    setManualSeverity(null);
    setErrors({});
  };

  if (successReport) {
    return (
      <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-xl bg-slate-900 border border-emerald-600/50 shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-800 text-xs font-mono text-emerald-400">
            <span>Incident ID: {successReport.id}</span>
            <span>·</span>
            <span>Live In System</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Emergency Report Successfully Dispatched
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            The emergency report has been prioritized with{' '}
            <span className="font-semibold text-rose-400">{successReport.severity} severity</span>{' '}
            and routed immediately to the central operations board.
          </p>

          {successReport.hasVideoEvidence && (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-rose-300 bg-rose-950/70 border border-rose-700/80 py-1.5 px-3 rounded-full animate-pulse mt-2">
              <Film className="w-4 h-4 text-rose-400" />
              <span>Emergency Video Evidence Attached & Sealed in IndexedDB</span>
            </div>
          )}
        </div>

        {/* Incident Summary Card */}
        <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white text-sm">{successReport.title}</span>
            <SeverityBadge severity={successReport.severity} />
          </div>
          <p className="text-slate-400 line-clamp-2">{successReport.description}</p>
          <div className="flex items-center gap-4 text-slate-400 pt-2 border-t border-slate-800/80 font-mono text-[11px]">
            <span>Location: {successReport.location.address}</span>
            <span>·</span>
            <span>Affected: {successReport.affectedCount}</span>
            {successReport.hasVideoEvidence && (
              <>
                <span>·</span>
                <span className="text-rose-400 font-bold flex items-center gap-1">
                  <Video className="w-3 h-3" /> Video Attached
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              setSelectedIncident(successReport);
            }}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span>Open Incident Details</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setActiveTab('incidents');
            }}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            View Management Board
          </button>

          <button
            onClick={() => {
              if (videoPreviewUrl) {
                URL.revokeObjectURL(videoPreviewUrl);
              }
              setAttachedVideoBlob(null);
              setVideoPreviewUrl(null);
              setVideoMeta(null);
              setSuccessReport(null);
              setTitle('');
              setDescription('');
              setAddress('');
              setLandmark('');
              setAffectedCount(1);
              setReporterName('');
              setReporterPhone('');
              setReporterNotes('');
              setManualSeverity(null);
            }}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-slate-200"
          >
            Report Another Incident
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Dispatch Intake</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight mt-1">
            File New Emergency Report
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Submit critical incidents for instant algorithmic triage and rapid unit deployment.
          </p>
        </div>

        <div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-1 rounded">
            Live Intake System Active
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Emergency Category */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">1. Select Emergency Category</h3>
              <p className="text-xs text-slate-400">Classifies the domain hazard and alerts specialized response crews</p>
            </div>
            <span className="text-xs text-rose-400 font-semibold">* Required</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat);
              const isSelected = category === cat;
              const colors = getCategoryColor(cat);

              return (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-slate-800 border-rose-500 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                      : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                      isSelected ? `${colors.bg} ${colors.border} ${colors.text}` : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium leading-tight ${isSelected ? 'text-white font-bold' : 'text-slate-300'}`}>
                    {cat}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Incident Details */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">2. Incident Details & Location</h3>
            <p className="text-xs text-slate-400">Provide clear situational descriptions to enable accurate severity rating</p>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Incident Title <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Major Chemical Fume Leak at West Chemical Plant"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full bg-slate-950 border text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none placeholder:text-slate-500 ${
                  errors.title ? 'border-rose-500' : 'border-slate-700 focus:border-rose-500'
                }`}
              />
              {errors.title && <p className="text-xs text-rose-400">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Incident Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Describe what happened, current hazards, smoke/fire conditions, structural damage, trapped persons, or medical trauma..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={`w-full bg-slate-950 border text-xs text-white rounded-lg p-3.5 focus:outline-none placeholder:text-slate-500 leading-relaxed ${
                  errors.description ? 'border-rose-500' : 'border-slate-700 focus:border-rose-500'
                }`}
              />
              {errors.description && <p className="text-xs text-rose-400">{errors.description}</p>}
            </div>

            {/* People affected stepper */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <label className="text-xs font-semibold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Number of People Affected / Casualties</span>
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Helps triage multi-casualty incidents and mass medical response
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAffectedCount(Math.max(0, affectedCount - 1))}
                  className="w-8 h-8 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={affectedCount}
                  onChange={(e) => setAffectedCount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-16 bg-slate-900 border border-slate-700 text-center text-sm font-bold font-mono text-white rounded py-1.5 focus:outline-none focus:border-rose-500"
                />
                <button
                  type="button"
                  onClick={() => setAffectedCount(affectedCount + 1)}
                  className="w-8 h-8 rounded bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center justify-center font-bold text-sm"
                >
                  +
                </button>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 block">
                  Location & Address <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isGeolocating}
                  className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{isGeolocating ? 'Locating GPS...' : 'Use My Current Location'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    placeholder="Street address or intersection..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full bg-slate-950 border text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none placeholder:text-slate-500 ${
                      errors.address ? 'border-rose-500' : 'border-slate-700 focus:border-rose-500'
                    }`}
                  />
                  {errors.address && <p className="text-xs text-rose-400 mt-1">{errors.address}</p>}
                </div>

                <div>
                  <input
                    type="text"
                    placeholder="Prominent landmark / building name (optional)..."
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Quick Pick Location Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] text-slate-400 font-medium">Quick Pick Presets:</span>
                {quickLocations.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAddress(loc.address);
                      setLandmark(loc.landmark);
                      setZone(loc.zone);
                      setLatitude(loc.lat.toString());
                      setLongitude(loc.lng.toString());
                      setIsGpsCaptured(false);
                    }}
                    className="text-[11px] text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800 px-2 py-1 rounded transition-colors truncate max-w-xs"
                  >
                    {loc.address.split(',')[0]}
                  </button>
                ))}
              </div>

              {/* Exact Geographic Coordinates (Feature 5) */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Geographic Coordinates (Lat / Lng)</span>
                  </span>
                  {isGpsCaptured && (
                    <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Device GPS Active</span>
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Latitude:</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={latitude}
                      onChange={(e) => {
                        setLatitude(e.target.value);
                        setIsGpsCaptured(false);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Longitude:</label>
                    <input
                      type="number"
                      step="0.0001"
                      required
                      value={longitude}
                      onChange={(e) => {
                        setLongitude(e.target.value);
                        setIsGpsCaptured(false);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded p-2 focus:outline-none focus:border-rose-500 font-mono"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight">
                  Coordinates are used by the Haversine Dispatch Engine to recommend nearest available response teams and project vector route lines.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Real-Time Severity Classification Engine */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>3. Severity Classification & Auto-Triage</span>
              </h3>
              <p className="text-xs text-slate-400">
                Algorithmically suggested based on keyword hazards, casualty impact, and emergency category.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 font-medium">Auto-Suggested:</span>
                <SeverityBadge severity={suggestedInfo.severity} />
                <span className="text-xs font-mono text-slate-400">
                  Risk Score: {suggestedInfo.score}/100
                </span>
              </div>

              {manualSeverity && (
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-400 font-medium">Manual Override Active:</span>
                  <SeverityBadge severity={manualSeverity} />
                  <button
                    type="button"
                    onClick={() => setManualSeverity(null)}
                    className="text-[11px] text-slate-400 hover:text-white underline"
                  >
                    Revert to Auto
                  </button>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded border border-slate-800">
              <span className="text-rose-400 font-semibold">Triage Reasoning:</span> {suggestedInfo.reason}
            </p>

            {/* Override Controls */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Administrator / Dispatcher Severity Override:
              </span>
              <div className="grid grid-cols-4 gap-2">
                {(['Low', 'Medium', 'High', 'Critical'] as SeverityLevel[]).map(sev => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setManualSeverity(sev)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      activeSeverity === sev
                        ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Step 4: Optional Contact Information */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">4. Reporter Contact Information</h3>
            <p className="text-xs text-slate-400">Optional details to allow responders to follow up for updates</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Reporter Full Name (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Doe"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Contact Phone Number (Optional)</span>
              </label>
              <input
                type="tel"
                placeholder="e.g. +1 (555) 019-2831"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500 font-mono"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-medium text-slate-300 block">
                Urgent Access or Contact Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Gate code #9941, reporter standing by the blue mailbox in neon jacket"
                value={reporterNotes}
                onChange={(e) => setReporterNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg px-3.5 py-2.5 focus:outline-none focus:border-rose-500 placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Step 5: Emergency Video Evidence (Optional) */}
        <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-rose-400" />
                <span>5. Emergency Video Evidence (Optional)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Attach short situational video (max 30s) to assist first responders in triage and hazard assessment.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-medium">Optional</span>
          </div>

          {attachedVideoBlob && videoPreviewUrl ? (
            /* Video Attached Card */
            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-600/40 space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    Video Evidence Attached
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                  <span>~{videoMeta?.durationSeconds || 0}s</span>
                  <span>·</span>
                  <span>{((attachedVideoBlob.size) / (1024 * 1024)).toFixed(2)} MB</span>
                  <span>·</span>
                  <span className="text-cyan-400">IndexedDB Ready</span>
                </div>
              </div>

              {/* Video Player */}
              <div className="relative aspect-video max-h-52 w-full bg-black rounded-lg overflow-hidden border border-slate-800 mx-auto">
                <video
                  src={videoPreviewUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-[11px] text-slate-400">
                  Video is buffered locally. It will be officially linked to your incident report upon transmission.
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsVideoModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/50 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State: Prompt to record */
            <div className="p-4 sm:p-5 rounded-xl bg-slate-950/70 border border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold text-slate-200">
                  <Camera className="w-4 h-4 text-rose-400" />
                  <span>No video footage attached yet</span>
                </div>
                <p className="text-[11px] text-slate-400 max-w-md">
                  Help incident command view smoke colors, structural collapse degrees, or road blockages. Max 30 seconds. Never approach hazardous areas.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsVideoModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-950 flex items-center justify-center gap-2 transition-all shrink-0"
              >
                <Video className="w-4 h-4" />
                <span>Record Emergency Video</span>
              </button>
            </div>
          )}
        </div>

        {/* Submit Bar */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="text-xs text-slate-400">
            Assigned Severity: <span className="text-white font-bold">{activeSeverity}</span> · Status:{' '}
            <span className="text-blue-400 font-medium">Reported</span>
            {attachedVideoBlob && (
              <span className="ml-2 font-mono text-emerald-400 font-bold">
                · [Video Evidence Attached]
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-[0.98] rounded-lg shadow-md shadow-rose-950 transition-all flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Transmitting Report...' : 'Transmit Emergency Report'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Emergency Video Recorder Modal */}
      <EmergencyVideoRecorderModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onVideoRecorded={handleVideoRecorded}
        existingVideoBlob={attachedVideoBlob}
        incidentTitle={title || 'Citizen Emergency Report'}
        incidentCategory={category}
      />
    </div>
  );
};
