import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  Incident,
  ResponseTeam,
  EmergencyResource,
  EmergencyUnit,
  IncidentStatus,
  SeverityLevel,
  EmergencyCategory,
  LocationInfo,
  ReporterInfo,
  ResponseTeamCategory,
  ResourceType,
  TeamAvailability,
  ResourceStatus,
  VerificationStatus,
  VerificationRecord,
  AssignmentRecord,
  ActivityRecord,
  ActiveTab,
  VideoEvidence,
  getRecommendedTeamCategories
} from '../types';
import { INITIAL_INCIDENTS } from '../data/sampleIncidents';
import { INITIAL_TEAMS } from '../data/sampleTeams';
import { calculateSuggestedSeverity } from '../utils/severityClassifier';
import { detectDuplicates, detectSuspiciousIndicators } from '../utils/verificationEngine';
import { calculatePriorityScore, rankIncidentsByPriority } from '../utils/prioritizationEngine';
import { calculateHaversineDistance } from '../utils/geoUtils';
import {
  saveVideoToDB,
  getVideoFromDB,
  deleteVideoFromDB,
  transferDraftVideo
} from '../services/videoStorage';

interface IncidentContextType {
  incidents: Incident[];
  teams: ResponseTeam[];
  resources: EmergencyResource[]; // alias for teams
  units: EmergencyUnit[]; // alias for teams
  assignmentHistory: AssignmentRecord[];
  activityHistory: ActivityRecord[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;

  // Incident lifecycle
  createIncident: (data: {
    title: string;
    description: string;
    category: EmergencyCategory;
    severity?: SeverityLevel;
    location: LocationInfo;
    affectedCount: number;
    reporter: ReporterInfo;
    tags?: string[];
    hasVideoEvidence?: boolean;
    videoEvidence?: VideoEvidence;
  }) => Incident;
  triggerOneTapSOS: (locationData?: {
    lat?: number;
    lng?: number;
    address?: string;
    accuracy?: number;
    manual?: boolean;
    permissionGranted?: boolean;
  }) => { incident: Incident; isOffline: boolean };
  updateIncident: (id: string, updates: Partial<Incident>, timelineNote?: string) => Incident | null;
  updateStatus: (id: string, newStatus: IncidentStatus, notes?: string, author?: string) => void;
  updateSeverity: (id: string, newSeverity: SeverityLevel, reason?: string) => void;
  updateIncidentNotes: (id: string, note: string) => void;
  deleteIncident: (id: string) => void;

  // Video Evidence Management
  saveIncidentVideo: (
    incidentId: string,
    videoBlob: Blob,
    meta: {
      durationSeconds: number;
      mimeType: string;
      hasAudio?: boolean;
      fileName?: string;
      notes?: string;
    }
  ) => Promise<VideoEvidence>;
  getIncidentVideo: (incidentId: string) => Promise<{ blob: Blob; metadata: VideoEvidence; objectUrl: string } | null>;
  deleteIncidentVideo: (incidentId: string) => Promise<boolean>;

  // Prioritization
  overridePriorityScore: (id: string, customScore: number, reason: string, author?: string) => void;

  // Verification
  updateVerificationStatus: (id: string, newStatus: VerificationStatus, note?: string) => void;

  // Team & Resource dispatch management
  assignTeamToIncident: (incidentId: string, teamId: string, author?: string) => { success: boolean; message: string };
  releaseTeamFromIncident: (incidentId: string, teamId: string, releaseReason?: string, author?: string) => void;
  releaseAllIncidentResources: (incidentId: string) => void;

  // Team CRUD
  createTeam: (teamData: {
    id: string;
    name: string;
    category: ResponseTeamCategory;
    latitude: number;
    longitude: number;
    assignedLocation: string;
    contactInfo?: string;
    contactNumber?: string;
    crewCount?: number;
    callSign?: string;
  }) => ResponseTeam;
  updateTeam: (teamId: string, updates: Partial<ResponseTeam>) => void;
  deleteTeam: (teamId: string) => { success: boolean; message: string };
  updateTeamLocation: (teamId: string, latitude: number, longitude: number, locationName?: string) => void;
  updateTeamAvailability: (teamId: string, availability: TeamAvailability) => void;

  // Backward compatibility methods
  assignResourceToIncident: (incidentId: string, resourceId: string) => { success: boolean; message: string };
  releaseResourceFromIncident: (incidentId: string, resourceId: string) => void;
  updateResourceStatus: (resourceId: string, newStatus: ResourceStatus) => void;
  createResource: (resource: any) => EmergencyResource;
  assignUnitToIncident: (incidentId: string, unitName: string) => void;
  removeUnitFromIncident: (incidentId: string, unitName: string) => void;
  resetToSampleData: () => void;
  clearAllIncidents: () => void;
  generateRandomMockIncident: () => Incident;

  // Metrics
  metrics: {
    total: number;
    critical: number;
    high: number;
    pending: number;
    assigned: number;
    inProgress: number;
    resolved: number;
    totalPeopleAffected: number;
    categoryCounts: Record<EmergencyCategory, number>;
    severityCounts: Record<SeverityLevel, number>;
    // Team metrics
    totalTeams: number;
    availableTeams: number;
    busyTeams: number;
    unavailableTeams: number;
    unassignedIncidents: number;
    averageAssignmentTimeMinutes: number;
    resolutionRate: number;
    // Legacy metrics
    totalResources: number;
    availableResources: number;
    assignedResources: number;
    unavailableResources: number;
    // Verification metrics
    totalVerified: number;
    unverified: number;
    underReview: number;
    unableToVerify: number;
    requiringReview: number;
    possibleDuplicates: number;
    activeSOSCount: number;
    hasVideoEvidenceCount: number;
  };
}

const IncidentContext = createContext<IncidentContextType | undefined>(undefined);

const STORAGE_KEY_INCIDENTS = 'resq_incidents_store_v6';
const STORAGE_KEY_TEAMS = 'resq_teams_store_v6';
const STORAGE_KEY_ASSIGNMENTS = 'resq_assignments_store_v6';
const STORAGE_KEY_ACTIVITIES = 'resq_activities_store_v6';

const INITIAL_ASSIGNMENTS: AssignmentRecord[] = [
  {
    id: 'asg-init-1',
    incidentId: 'RQ-1001',
    incidentTitle: 'Commercial Complex 3rd Floor Fire & Heavy Smoke',
    teamId: 'TEAM-FIR-01',
    teamName: 'Engine 14 Heavy Pumper & Suppression',
    teamCategory: 'Fire Response Team',
    assignedAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    distanceKm: 0.5,
    status: 'Active',
    assignedBy: 'Dispatch Command'
  },
  {
    id: 'asg-init-2',
    incidentId: 'RQ-1002',
    incidentTitle: 'Multi-Storey Residential Facade & Balcony Collapse',
    teamId: 'TEAM-RSC-01',
    teamName: 'Urban Search & Heavy Extrication Squad 3',
    teamCategory: 'Rescue Team',
    assignedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    distanceKm: 3.2,
    status: 'Active',
    assignedBy: 'Dispatch Supervisor Novak'
  },
  {
    id: 'asg-init-3',
    incidentId: 'RQ-1003',
    incidentTitle: 'Multiple Vehicle Pileup on Northbound Expressway',
    teamId: 'TEAM-MED-01',
    teamName: 'Medic 101 Advanced Life Support & Trauma',
    teamCategory: 'Medical Response Team',
    assignedAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    distanceKm: 2.6,
    status: 'Active',
    assignedBy: 'Dispatch Operator Harris'
  },
  {
    id: 'asg-init-4',
    incidentId: 'RQ-1004',
    incidentTitle: 'Flash Flood Overtopping Levee on Creek Promenade',
    teamId: 'TEAM-RSC-02',
    teamName: 'Swiftwater & Flood Evac Boat Unit 2',
    teamCategory: 'Rescue Team',
    assignedAt: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    distanceKm: 3.8,
    status: 'Active',
    assignedBy: 'Dispatch Command'
  }
];

export const IncidentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [incidents, setIncidents] = useState<Incident[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INCIDENTS) || localStorage.getItem('resq_incidents_store_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return rankIncidentsByPriority(
            parsed.map((item: any) => ({
              ...item,
              assignedResourceIds: item.assignedResourceIds || [],
              verificationStatus: item.verificationStatus || 'Unverified',
              verificationHistory: item.verificationHistory || [],
              duplicateMatches: item.duplicateMatches || [],
              suspiciousIndicators: item.suspiciousIndicators || []
            }))
          );
        }
      }
    } catch (e) {
      console.warn('Failed reading incidents from localStorage', e);
    }
    return INITIAL_INCIDENTS;
  });

  const [teams, setTeams] = useState<ResponseTeam[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TEAMS) || localStorage.getItem('resq_resources_store_v4');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize teams with coordinates & categories if needed
          return parsed.map((item: any) => {
            let cat = item.category || 'General Emergency Response Team';
            if (item.type === 'Fire response unit') cat = 'Fire Response Team';
            if (item.type === 'Ambulance' || item.type === 'Medical response team') cat = 'Medical Response Team';
            if (item.type === 'Rescue team') cat = 'Rescue Team';

            const avail: TeamAvailability =
              item.availability || (item.status === 'Assigned' ? 'Busy' : item.status || 'Available');

            return {
              ...item,
              category: cat,
              availability: avail,
              status: avail,
              latitude: item.latitude ?? item.lat ?? 37.7749,
              longitude: item.longitude ?? item.lng ?? -122.4194,
              lat: item.latitude ?? item.lat ?? 37.7749,
              lng: item.longitude ?? item.lng ?? -122.4194,
              contactInfo: item.contactInfo || item.contactNumber || '+1 (555) 019-0000'
            };
          });
        }
      }
    } catch (e) {
      console.warn('Failed reading teams from localStorage', e);
    }
    return INITIAL_TEAMS;
  });

  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ASSIGNMENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading assignment history from localStorage', e);
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [activityHistory, setActivityHistory] = useState<ActivityRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVITIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed reading activities from localStorage', e);
    }
    return [
      {
        id: 'act-1',
        incidentId: 'RQ-1001',
        action: 'Team Assigned',
        timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        details: 'Assigned Engine 14 Heavy Pumper & Suppression (TEAM-FIR-01). Distance: 0.5 km.',
        author: 'Dispatch Command'
      },
      {
        id: 'act-2',
        incidentId: 'RQ-1001',
        action: 'Response Started',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        details: 'Status transitioned to In Progress. Hydrant supply line established.',
        author: 'Captain Torres'
      }
    ];
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    } catch (e) {
      console.error('Error saving incidents to localStorage', e);
    }
  }, [incidents]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(teams));
    } catch (e) {
      console.error('Error saving teams to localStorage', e);
    }
  }, [teams]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(assignmentHistory));
    } catch (e) {
      console.error('Error saving assignments to localStorage', e);
    }
  }, [assignmentHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVITIES, JSON.stringify(activityHistory));
    } catch (e) {
      console.error('Error saving activities to localStorage', e);
    }
  }, [activityHistory]);

  // Priority recalculation timer (runs every 30 seconds to update time elapsed score)
  useEffect(() => {
    const timer = setInterval(() => {
      setIncidents((prev) => rankIncidentsByPriority(prev));
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // Keep selected incident synced
  useEffect(() => {
    if (selectedIncident) {
      const updated = incidents.find((i) => i.id === selectedIncident.id);
      if (updated) {
        setSelectedIncident(updated);
      }
    }
  }, [incidents]);

  // Log activity helper
  const logActivity = (incidentId: string, action: string, details: string, author: string = 'System') => {
    const newAct: ActivityRecord = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      incidentId,
      action,
      details,
      timestamp: new Date().toISOString(),
      author
    };
    setActivityHistory((prev) => [newAct, ...prev]);
  };

  // Create Incident
  const createIncident = (data: {
    title: string;
    description: string;
    category: EmergencyCategory;
    severity?: SeverityLevel;
    location: LocationInfo;
    affectedCount: number;
    reporter: ReporterInfo;
    tags?: string[];
    hasVideoEvidence?: boolean;
    videoEvidence?: VideoEvidence;
  }): Incident => {
    const now = new Date().toISOString();
    const incidentCount = incidents.length + 1;
    const newId = `RQ-${1000 + incidentCount}`;

    const suggested = calculateSuggestedSeverity(
      data.category,
      data.affectedCount,
      data.title,
      data.description
    );

    const chosenSeverity = data.severity || suggested.severity;

    const timelineEvents = [
      {
        id: `tl-${Date.now()}`,
        timestamp: now,
        author: data.reporter.name || 'Citizen Reporter',
        action: 'Incident Reported',
        note: `Emergency logged with ${chosenSeverity} severity. Automated priority queue placement.`
      }
    ];

    if (data.hasVideoEvidence) {
      timelineEvents.push({
        id: `tl-vid-${Date.now()}`,
        timestamp: now,
        author: data.reporter.name || 'Citizen Reporter',
        action: 'Video Evidence Attached',
        note: `Field emergency video footage attached (~${data.videoEvidence?.durationSeconds || 0}s). Stored in IndexedDB evidence registry.`
      });
    }

    const baseIncident: Incident = {
      id: newId,
      title: data.title,
      description: data.description,
      category: data.category,
      severity: chosenSeverity,
      suggestedSeverity: suggested.severity,
      severityReason: suggested.reason,
      status: 'Reported',
      priorityScore: 0,
      verificationStatus: 'Unverified',
      location: data.location,
      affectedCount: data.affectedCount,
      reporter: data.reporter,
      timestamp: now,
      updatedAt: now,
      assignedResourceIds: [],
      assignedUnits: [],
      timeline: timelineEvents,
      tags: data.tags || [data.category.toLowerCase().replace(/\s+/g, '-')],
      hasVideoEvidence: !!data.hasVideoEvidence,
      videoEvidence: data.videoEvidence
    };

    const duplicateMatches = detectDuplicates(baseIncident, incidents);
    const suspiciousIndicators = detectSuspiciousIndicators(baseIncident, incidents);

    const requiresReview = duplicateMatches.length > 0 || suspiciousIndicators.length > 0;
    const initialVerificationStatus: VerificationStatus = requiresReview ? 'Under Review' : 'Unverified';

    const verificationHistory: VerificationRecord[] = [
      {
        id: `vh-${Date.now()}`,
        timestamp: now,
        author: 'Automated Intake Engine',
        previousStatus: 'Unverified',
        newStatus: initialVerificationStatus,
        note: requiresReview
          ? `Flagged for verification: ${duplicateMatches.length} possible duplicate(s), ${suspiciousIndicators.length} suspicious review flag(s).`
          : 'Standard citizen report logged. Pending field verification triage.'
      }
    ];

    const incidentWithReview = {
      ...baseIncident,
      verificationStatus: initialVerificationStatus,
      duplicateMatches,
      suspiciousIndicators,
      verificationHistory
    };

    const priorityBreakdown = calculatePriorityScore(incidentWithReview);
    const fullIncident: Incident = {
      ...incidentWithReview,
      priorityScore: priorityBreakdown.score,
      priorityBreakdown
    };

    logActivity(
      newId,
      'Incident Reported',
      `New emergency reported at ${data.location.address}.${data.hasVideoEvidence ? ' Video evidence attached.' : ''} Initial priority score: ${priorityBreakdown.score}/100.`,
      data.reporter.name || 'Citizen Intake'
    );

    setIncidents((prev) => rankIncidentsByPriority([fullIncident, ...prev]));
    return fullIncident;
  };

  // Video Evidence Management
  const saveIncidentVideo = async (
    incidentId: string,
    videoBlob: Blob,
    meta: {
      durationSeconds: number;
      mimeType: string;
      hasAudio?: boolean;
      fileName?: string;
      notes?: string;
    }
  ): Promise<VideoEvidence> => {
    const evidence = await saveVideoToDB(incidentId, videoBlob, meta);
    updateIncident(
      incidentId,
      {
        hasVideoEvidence: true,
        videoEvidence: evidence
      },
      `Video evidence attached (${evidence.durationSeconds}s, ${(evidence.sizeBytes / 1024 / 1024).toFixed(1)}MB). Sealed in IndexedDB.`
    );
    return evidence;
  };

  const getIncidentVideo = async (incidentId: string) => {
    return getVideoFromDB(incidentId);
  };

  const deleteIncidentVideo = async (incidentId: string): Promise<boolean> => {
    const success = await deleteVideoFromDB(incidentId);
    if (success) {
      updateIncident(
        incidentId,
        {
          hasVideoEvidence: false,
          videoEvidence: undefined
        },
        'Video evidence unlinked and purged from local storage.'
      );
    }
    return success;
  };

  // One-Tap SOS Emergency Activation System
  const triggerOneTapSOS = (locationData?: {
    lat?: number;
    lng?: number;
    address?: string;
    accuracy?: number;
    manual?: boolean;
    permissionGranted?: boolean;
  }): { incident: Incident; isOffline: boolean } => {
    const now = new Date().toISOString();
    const incidentCount = incidents.length + 1;
    const newId = `RQ-${1000 + incidentCount}`;

    const hasCoords = locationData?.lat !== undefined && locationData?.lng !== undefined;
    const lat = hasCoords ? locationData!.lat! : 37.7749;
    const lng = hasCoords ? locationData!.lng! : -122.4194;
    const address = locationData?.address || (hasCoords 
      ? `GPS Fix: ${lat.toFixed(5)}, ${lng.toFixed(5)}` 
      : 'Location Pending GPS / Manual Verification');
    const zone = hasCoords ? 'Real-Time Geolocation Beacon' : 'Awaiting Geolocation';

    const location: LocationInfo = {
      address,
      zone,
      lat,
      lng
    };

    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    const baseIncident: Incident = {
      id: newId,
      title: `EMERGENCY SOS ALERT [${newId}]`,
      description: 'One-Tap SOS Emergency Beacon activated by citizen. Immediate field triage, responder dispatch, and verification requested.',
      category: 'Medical Emergency', // Default initial triage category until user confirms
      severity: 'Critical',
      suggestedSeverity: 'Critical',
      severityReason: 'Automated 1-Tap SOS Emergency Activation. Escalated to Critical priority triage.',
      status: 'Reported',
      priorityScore: 95,
      verificationStatus: 'Unverified',
      verificationNote: 'One-Tap SOS activation awaiting field contact and operator review.',
      location,
      affectedCount: 1,
      reporter: {
        name: 'SOS Emergency Beacon User',
        phone: '',
        relationship: 'Citizen in Distress'
      },
      timestamp: now,
      updatedAt: now,
      assignedResourceIds: [],
      assignedUnits: [],
      isSOS: true,
      gpsAccuracy: locationData?.accuracy,
      sosDeviceState: {
        isOnline,
        permissionGranted: locationData?.permissionGranted ?? hasCoords,
        capturedAt: now
      },
      timeline: [
        {
          id: `tl-${Date.now()}`,
          timestamp: now,
          author: 'SOS Emergency System',
          action: '🚨 ONE-TAP SOS BEACON ACTIVATED',
          note: `Emergency alert initiated via One-Tap SOS. GPS status: ${hasCoords ? `Coordinates locked (${lat.toFixed(4)}, ${lng.toFixed(4)}) ±${Math.round(locationData?.accuracy || 0)}m` : 'Pending GPS fix / manual input'}. Stored in local operations registry.`
        }
      ],
      tags: ['sos-alert', 'one-tap-sos', 'emergency-beacon', 'unverified-awaiting-review']
    };

    const duplicateMatches = detectDuplicates(baseIncident, incidents);
    const suspiciousIndicators = detectSuspiciousIndicators(baseIncident, incidents);

    const initialVerificationStatus: VerificationStatus = 'Unverified';

    const verificationHistory: VerificationRecord[] = [
      {
        id: `vh-${Date.now()}`,
        timestamp: now,
        author: 'SOS Activation Engine',
        previousStatus: 'Unverified',
        newStatus: initialVerificationStatus,
        note: 'SOS beacon logged. Status: Unverified – Awaiting Review.'
      }
    ];

    const incidentWithReview: Incident = {
      ...baseIncident,
      verificationStatus: initialVerificationStatus,
      duplicateMatches,
      suspiciousIndicators,
      verificationHistory
    };

    const priorityBreakdown = calculatePriorityScore(incidentWithReview);
    const effectiveScore = Math.max(88, priorityBreakdown.score);
    const fullIncident: Incident = {
      ...incidentWithReview,
      priorityScore: effectiveScore,
      priorityBreakdown: {
        ...priorityBreakdown,
        score: effectiveScore,
        urgencyLevel: 'Critical',
        explanation: 'SOS EMERGENCY BEACON: High-urgency distress alert triggered via One-Tap SOS. Immediate responder routing recommended.'
      }
    };

    logActivity(
      newId,
      '🚨 SOS Emergency Beacon Activated',
      `Citizen initiated One-Tap SOS at ${address}. Initial priority ${effectiveScore}/100.`,
      'SOS Beacon'
    );

    setIncidents((prev) => rankIncidentsByPriority([fullIncident, ...prev]));

    return {
      incident: fullIncident,
      isOffline: !isOnline
    };
  };

  // Update existing incident fields (for progressive SOS enrichment, notes, casualties, category)
  const updateIncident = (
    id: string,
    updates: Partial<Incident>,
    timelineNote?: string
  ): Incident | null => {
    const now = new Date().toISOString();
    let updatedResult: Incident | null = null;

    setIncidents((prev) => {
      const updatedList = prev.map((item) => {
        if (item.id === id) {
          const newTimeline = timelineNote
            ? [
                {
                  id: `tl-${Date.now()}`,
                  timestamp: now,
                  author: 'SOS User / Operations',
                  action: 'Incident Enriched / Updated',
                  note: timelineNote
                },
                ...item.timeline
              ]
            : item.timeline;

          const merged: Incident = {
            ...item,
            ...updates,
            updatedAt: now,
            timeline: newTimeline
          };

          // Re-calculate priority score if category, severity, or affectedCount changed
          if (updates.category || updates.affectedCount !== undefined || updates.severity) {
            const newBreakdown = calculatePriorityScore(merged);
            merged.priorityScore = merged.isSOS ? Math.max(85, newBreakdown.score) : newBreakdown.score;
            merged.priorityBreakdown = newBreakdown;
          }

          updatedResult = merged;
          return merged;
        }
        return item;
      });

      return rankIncidentsByPriority(updatedList);
    });

    return updatedResult;
  };

  // Update Status
  const updateStatus = (
    id: string,
    newStatus: IncidentStatus,
    notes?: string,
    author: string = 'Incident Commander'
  ) => {
    const now = new Date().toISOString();

    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newTimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            author,
            action: `Status Changed: ${newStatus}`,
            note: notes || `Operational status transitioned to ${newStatus}.`
          };

          // If marked Resolved, release assigned team
          const isResolving = newStatus === 'Resolved';

          return {
            ...item,
            status: newStatus,
            updatedAt: now,
            timeline: [newTimelineEvent, ...item.timeline],
            assignedTeamId: isResolving ? undefined : item.assignedTeamId,
            assignedTeamName: isResolving ? undefined : item.assignedTeamName,
            assignedResourceIds: isResolving ? [] : item.assignedResourceIds,
            assignedUnits: isResolving ? [] : item.assignedUnits
          };
        }
        return item;
      })
    );

    logActivity(id, `Status Changed: ${newStatus}`, notes || `Status updated to ${newStatus}.`, author);

    // If resolving, automatically free up assigned teams!
    if (newStatus === 'Resolved') {
      setTeams((prev) =>
        prev.map((t) => {
          if (t.assignedIncidentId === id) {
            return {
              ...t,
              availability: 'Available',
              status: 'Available',
              assignedIncidentId: undefined,
              assignedIncidentTitle: undefined,
              dispatchedAt: undefined
            };
          }
          return t;
        })
      );

      setAssignmentHistory((prev) =>
        prev.map((asg) =>
          asg.incidentId === id && asg.status === 'Active'
            ? { ...asg, status: 'Released', releasedAt: now, releaseReason: 'Incident Resolved' }
            : asg
        )
      );
    }
  };

  // Update Severity
  const updateSeverity = (id: string, newSeverity: SeverityLevel, reason?: string) => {
    const now = new Date().toISOString();
    setIncidents((prev) =>
      rankIncidentsByPriority(
        prev.map((item) => {
          if (item.id === id) {
            const newTimelineEvent = {
              id: `tl-${Date.now()}`,
              timestamp: now,
              author: 'Admin / Triage Officer',
              action: `Severity Updated: ${newSeverity}`,
              note: reason || `Severity level adjusted to ${newSeverity}.`
            };
            return {
              ...item,
              severity: newSeverity,
              updatedAt: now,
              timeline: [newTimelineEvent, ...item.timeline]
            };
          }
          return item;
        })
      )
    );
    logActivity(id, `Severity Changed: ${newSeverity}`, reason || `Severity updated to ${newSeverity}.`, 'Triage Officer');
  };

  // Update Notes
  const updateIncidentNotes = (id: string, note: string) => {
    const now = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newTimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            author: 'Dispatch Officer',
            action: 'Operational Field Note Added',
            note
          };
          return {
            ...item,
            updatedAt: now,
            timeline: [newTimelineEvent, ...item.timeline]
          };
        }
        return item;
      })
    );
  };

  // Override Priority Score (Feature 1 Admin Review)
  const overridePriorityScore = (
    id: string,
    customScore: number,
    reason: string,
    author: string = 'Lead Dispatcher'
  ) => {
    const clamped = Math.min(100, Math.max(0, Math.round(customScore)));
    const now = new Date().toISOString();

    setIncidents((prev) =>
      rankIncidentsByPriority(
        prev.map((item) => {
          if (item.id === id) {
            const currentBreakdown = item.priorityBreakdown || calculatePriorityScore(item);
            const updatedBreakdown = {
              ...currentBreakdown,
              score: clamped,
              isOverridden: true,
              overriddenBy: author,
              overrideReason: reason,
              explanation: `Administrator override by ${author} to ${clamped}/100. Reason: "${reason}".`
            };

            const timelineEvt = {
              id: `tl-${Date.now()}`,
              timestamp: now,
              author,
              action: `Priority Overridden: ${clamped}/100`,
              note: `Reason: ${reason}`
            };

            return {
              ...item,
              priorityScore: clamped,
              priorityBreakdown: updatedBreakdown,
              updatedAt: now,
              timeline: [timelineEvt, ...item.timeline]
            };
          }
          return item;
        })
      )
    );

    logActivity(id, `Priority Overridden: ${clamped}/100`, `Score adjusted by ${author}. Reason: ${reason}`, author);
  };

  // Verification Status Update
  const updateVerificationStatus = (
    id: string,
    newStatus: VerificationStatus,
    note?: string,
    author: string = 'Verification Officer'
  ) => {
    const now = new Date().toISOString();
    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const record: VerificationRecord = {
            id: `vr-${Date.now()}`,
            timestamp: now,
            author,
            previousStatus: item.verificationStatus,
            newStatus,
            note: note || `Verification status manually changed to ${newStatus}.`
          };

          const newTimelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            author,
            action: `Verification: ${newStatus}`,
            note: note || `Report verification updated to ${newStatus}.`
          };

          return {
            ...item,
            verificationStatus: newStatus,
            verificationNote: note || item.verificationNote,
            verifiedBy: newStatus === 'Verified' ? author : item.verifiedBy,
            verifiedAt: newStatus === 'Verified' ? now : item.verifiedAt,
            updatedAt: now,
            verificationHistory: [record, ...(item.verificationHistory || [])],
            timeline: [newTimelineEvent, ...item.timeline]
          };
        }
        return item;
      })
    );
  };

  // Location-based Team Assignment (Feature 3 & 4)
  const assignTeamToIncident = (
    incidentId: string,
    teamId: string,
    author: string = 'Dispatch Command'
  ): { success: boolean; message: string } => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) {
      return { success: false, message: 'Response team not found.' };
    }

    if (targetTeam.availability !== 'Available') {
      const activeInc = targetTeam.assignedIncidentId
        ? `incident ${targetTeam.assignedIncidentId}`
        : 'another mission';
      return {
        success: false,
        message: `Team "${targetTeam.name}" (${targetTeam.id}) cannot be assigned. It is currently ${targetTeam.availability} (${activeInc}).`
      };
    }

    const targetIncident = incidents.find((i) => i.id === incidentId);
    if (!targetIncident) {
      return { success: false, message: 'Incident not found.' };
    }

    if (targetIncident.assignedTeamId === teamId || targetIncident.assignedResourceIds?.includes(teamId)) {
      return { success: false, message: `Team "${targetTeam.name}" is already assigned to this incident.` };
    }

    const now = new Date().toISOString();
    const dist = calculateHaversineDistance(
      targetIncident.location.lat,
      targetIncident.location.lng,
      targetTeam.latitude,
      targetTeam.longitude
    );

    // 1. Update Team to Busy
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            availability: 'Busy',
            status: 'Busy',
            assignedIncidentId: incidentId,
            assignedIncidentTitle: targetIncident.title,
            dispatchedAt: now
          };
        }
        return t;
      })
    );

    // 2. Update Incident status to Assigned (if Reported/Pending)
    const newStatus: IncidentStatus =
      targetIncident.status === 'Reported' || (targetIncident.status as string) === 'Pending'
        ? 'Assigned'
        : targetIncident.status;

    const timelineEvent = {
      id: `tl-${Date.now()}`,
      timestamp: now,
      author,
      action: `Team Assigned: ${targetTeam.name}`,
      note: `${targetTeam.category} (${targetTeam.id}) dispatched from ${targetTeam.assignedLocation}. Distance: ${dist.km} km (${dist.miles} mi).`
    };

    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: newStatus,
            assignedTeamId: teamId,
            assignedTeamName: targetTeam.name,
            assignedResourceIds: [teamId, ...(inc.assignedResourceIds || [])],
            assignedUnits: [targetTeam.name, ...(inc.assignedUnits || [])],
            updatedAt: now,
            timeline: [timelineEvent, ...inc.timeline]
          };
        }
        return inc;
      })
    );

    // 3. Log Assignment Record
    const assignmentRecord: AssignmentRecord = {
      id: `asg-${Date.now()}`,
      incidentId,
      incidentTitle: targetIncident.title,
      teamId,
      teamName: targetTeam.name,
      teamCategory: targetTeam.category,
      assignedAt: now,
      distanceKm: dist.km,
      status: 'Active',
      assignedBy: author
    };
    setAssignmentHistory((prev) => [assignmentRecord, ...prev]);

    // 4. Log Activity Record
    logActivity(
      incidentId,
      'Team Assigned',
      `Assigned ${targetTeam.name} (${targetTeam.id}). Distance: ${dist.km} km. Status transitioned to ${newStatus}.`,
      author
    );

    return {
      success: true,
      message: `Successfully assigned ${targetTeam.name} to ${targetIncident.id} (${dist.km} km away).`
    };
  };

  // Release Team from Incident
  const releaseTeamFromIncident = (
    incidentId: string,
    teamId: string,
    releaseReason: string = 'Mission Completed',
    author: string = 'Dispatch Command'
  ) => {
    const now = new Date().toISOString();
    const targetTeam = teams.find((t) => t.id === teamId);

    // Release team
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            availability: 'Available',
            status: 'Available',
            assignedIncidentId: undefined,
            assignedIncidentTitle: undefined,
            dispatchedAt: undefined
          };
        }
        return t;
      })
    );

    // Update assignment history
    setAssignmentHistory((prev) =>
      prev.map((asg) =>
        asg.incidentId === incidentId && asg.teamId === teamId && asg.status === 'Active'
          ? { ...asg, status: 'Released', releasedAt: now, releaseReason }
          : asg
      )
    );

    // Update incident
    setIncidents((prev) =>
      prev.map((inc) => {
        if (inc.id === incidentId) {
          const remainingIds = (inc.assignedResourceIds || []).filter((id) => id !== teamId);
          const remainingUnits = inc.assignedUnits.filter((name) => name !== targetTeam?.name);

          const nextTeamId = remainingIds[0];
          const nextTeam = teams.find((t) => t.id === nextTeamId);

          const timelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            author,
            action: `Team Released: ${targetTeam?.name || teamId}`,
            note: `Team returned to station readiness. Reason: ${releaseReason}`
          };

          return {
            ...inc,
            assignedTeamId: nextTeamId || undefined,
            assignedTeamName: nextTeam?.name || undefined,
            assignedResourceIds: remainingIds,
            assignedUnits: remainingUnits,
            updatedAt: now,
            timeline: [timelineEvent, ...inc.timeline]
          };
        }
        return inc;
      })
    );

    logActivity(
      incidentId,
      'Team Released',
      `Released ${targetTeam?.name || teamId}. Reason: ${releaseReason}`,
      author
    );
  };

  // Release All Incident Resources
  const releaseAllIncidentResources = (incidentId: string) => {
    const now = new Date().toISOString();
    const inc = incidents.find((i) => i.id === incidentId);
    if (!inc) return;

    setTeams((prev) =>
      prev.map((t) => {
        if (t.assignedIncidentId === incidentId || inc.assignedResourceIds?.includes(t.id)) {
          return {
            ...t,
            availability: 'Available',
            status: 'Available',
            assignedIncidentId: undefined,
            assignedIncidentTitle: undefined,
            dispatchedAt: undefined
          };
        }
        return t;
      })
    );

    setAssignmentHistory((prev) =>
      prev.map((asg) =>
        asg.incidentId === incidentId && asg.status === 'Active'
          ? { ...asg, status: 'Released', releasedAt: now, releaseReason: 'All Resources Released' }
          : asg
      )
    );

    setIncidents((prev) =>
      prev.map((item) => {
        if (item.id === incidentId) {
          const timelineEvent = {
            id: `tl-${Date.now()}`,
            timestamp: now,
            author: 'Incident Commander',
            action: 'All Response Teams Demobilized',
            note: 'All allocated teams released back to station readiness.'
          };
          return {
            ...item,
            assignedTeamId: undefined,
            assignedTeamName: undefined,
            assignedResourceIds: [],
            assignedUnits: [],
            updatedAt: now,
            timeline: [timelineEvent, ...item.timeline]
          };
        }
        return item;
      })
    );

    logActivity(incidentId, 'All Teams Released', 'All units demobilized back to readiness.', 'Incident Commander');
  };

  // Team CRUD (Feature 2)
  const createTeam = (teamData: {
    id: string;
    name: string;
    category: ResponseTeamCategory;
    latitude: number;
    longitude: number;
    assignedLocation: string;
    contactInfo?: string;
    contactNumber?: string;
    crewCount?: number;
    callSign?: string;
  }): ResponseTeam => {
    const newTeam: ResponseTeam = {
      id: teamData.id.trim(),
      name: teamData.name.trim(),
      category: teamData.category,
      type: teamData.category as any,
      latitude: teamData.latitude,
      longitude: teamData.longitude,
      lat: teamData.latitude,
      lng: teamData.longitude,
      assignedLocation: teamData.assignedLocation.trim(),
      availability: 'Available',
      status: 'Available',
      contactInfo: teamData.contactInfo || teamData.contactNumber || '+1 (555) 019-0000',
      contactNumber: teamData.contactInfo || teamData.contactNumber || '+1 (555) 019-0000',
      crewCount: teamData.crewCount || 4,
      callSign: teamData.callSign || teamData.id
    };

    setTeams((prev) => [newTeam, ...prev]);
    return newTeam;
  };

  const updateTeam = (teamId: string, updates: Partial<ResponseTeam>) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const updated = { ...t, ...updates };
          if (updates.latitude !== undefined) updated.lat = updates.latitude;
          if (updates.longitude !== undefined) updated.lng = updates.longitude;
          if (updates.availability !== undefined) updated.status = updates.availability;
          return updated;
        }
        return t;
      })
    );
  };

  const deleteTeam = (teamId: string): { success: boolean; message: string } => {
    const target = teams.find((t) => t.id === teamId);
    if (!target) {
      return { success: false, message: 'Team not found.' };
    }

    // Strict Rule: Delete teams only when they are not assigned to active incidents
    if (target.availability === 'Busy' || target.assignedIncidentId) {
      return {
        success: false,
        message: `Cannot delete team "${target.name}" (${target.id}). It is currently assigned to active incident ${target.assignedIncidentId}. Release or resolve the incident first.`
      };
    }

    setTeams((prev) => prev.filter((t) => t.id !== teamId));
    return { success: true, message: `Team ${target.name} (${target.id}) deleted successfully.` };
  };

  const updateTeamLocation = (teamId: string, latitude: number, longitude: number, locationName?: string) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          return {
            ...t,
            latitude,
            longitude,
            lat: latitude,
            lng: longitude,
            assignedLocation: locationName || t.assignedLocation
          };
        }
        return t;
      })
    );
  };

  const updateTeamAvailability = (teamId: string, availability: TeamAvailability) => {
    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          const wasBusy = t.availability === 'Busy';
          const isNowFree = availability !== 'Busy';
          return {
            ...t,
            availability,
            status: availability,
            assignedIncidentId: isNowFree && wasBusy ? undefined : t.assignedIncidentId,
            assignedIncidentTitle: isNowFree && wasBusy ? undefined : t.assignedIncidentTitle,
            dispatchedAt: isNowFree && wasBusy ? undefined : t.dispatchedAt
          };
        }
        return t;
      })
    );
  };

  // Backward compatibility alias methods
  const assignResourceToIncident = (incidentId: string, resourceId: string) => {
    return assignTeamToIncident(incidentId, resourceId);
  };

  const releaseResourceFromIncident = (incidentId: string, resourceId: string) => {
    releaseTeamFromIncident(incidentId, resourceId);
  };

  const updateResourceStatus = (resourceId: string, newStatus: ResourceStatus) => {
    const avail: TeamAvailability = newStatus === 'Assigned' ? 'Busy' : (newStatus as TeamAvailability);
    updateTeamAvailability(resourceId, avail);
  };

  const createResource = (resource: any) => {
    return createTeam({
      id: resource.id,
      name: resource.name,
      category: resource.category || 'General Emergency Response Team',
      latitude: resource.latitude || 37.7749,
      longitude: resource.longitude || -122.4194,
      assignedLocation: resource.assignedLocation,
      contactInfo: resource.contactNumber,
      crewCount: resource.crewCount,
      callSign: resource.callSign
    });
  };

  const assignUnitToIncident = (incidentId: string, unitName: string) => {
    const matched = teams.find((t) => t.name === unitName);
    if (matched) {
      assignTeamToIncident(incidentId, matched.id);
    }
  };

  const removeUnitFromIncident = (incidentId: string, unitName: string) => {
    const matched = teams.find((t) => t.name === unitName);
    if (matched) {
      releaseTeamFromIncident(incidentId, matched.id);
    }
  };

  const deleteIncident = (id: string) => {
    setIncidents((prev) => prev.filter((i) => i.id !== id));
    if (selectedIncident?.id === id) {
      setSelectedIncident(null);
    }
    // Free up any team assigned to this incident
    setTeams((prev) =>
      prev.map((t) =>
        t.assignedIncidentId === id
          ? {
              ...t,
              availability: 'Available',
              status: 'Available',
              assignedIncidentId: undefined,
              assignedIncidentTitle: undefined,
              dispatchedAt: undefined
            }
          : t
      )
    );
  };

  const resetToSampleData = () => {
    setIncidents(INITIAL_INCIDENTS);
    setTeams(INITIAL_TEAMS);
    setAssignmentHistory(INITIAL_ASSIGNMENTS);
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
    localStorage.setItem(STORAGE_KEY_TEAMS, JSON.stringify(INITIAL_TEAMS));
    localStorage.setItem(STORAGE_KEY_ASSIGNMENTS, JSON.stringify(INITIAL_ASSIGNMENTS));
  };

  const clearAllIncidents = () => {
    setIncidents([]);
    setSelectedIncident(null);
    setTeams((prev) =>
      prev.map((t) => ({
        ...t,
        availability: 'Available',
        status: 'Available',
        assignedIncidentId: undefined,
        assignedIncidentTitle: undefined,
        dispatchedAt: undefined
      }))
    );
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify([]));
  };

  const generateRandomMockIncident = (): Incident => {
    const mockTemplates: Array<{
      category: EmergencyCategory;
      title: string;
      description: string;
      affected: number;
      zone: string;
      lat: number;
      lng: number;
    }> = [
      {
        category: 'Fire Emergency',
        title: 'Roof Fire at Residential Apartment Block',
        description:
          'Smoke billowing from top-floor solar inverter installation. Neighbors alerting residents on 4th and 5th floors.',
        affected: 8,
        zone: 'Sector 2 - East Quarter',
        lat: 37.768,
        lng: -122.425
      },
      {
        category: 'Road Accident',
        title: 'Commuter Bus and Delivery Van Collision',
        description:
          'Mid-intersection collision during rush hour. Multiple seated passengers sustained bruising, bus driver trapped by steering column.',
        affected: 12,
        zone: 'Sector 1 - Transit Axis',
        lat: 37.785,
        lng: -122.412
      },
      {
        category: 'Medical Emergency',
        title: 'Respiratory Distress Cluster at Community Center',
        description:
          'Several elderly visitors experiencing acute breathing difficulty following chemical fumes from floor resurfacing.',
        affected: 4,
        zone: 'Sector 4 - West Residential',
        lat: 37.756,
        lng: -122.441
      },
      {
        category: 'Building Collapse',
        title: 'Construction Scaffold Shear at Commercial Tower',
        description:
          'High winds detached lower stabilizing anchor cables on 6-story scaffolding facade. Debris falling onto pedestrian walkway.',
        affected: 3,
        zone: 'Sector 3 - Financial District',
        lat: 37.792,
        lng: -122.404
      },
      {
        category: 'Flood',
        title: 'Storm Sewer Backpressure Flooding Underpass',
        description:
          'Flash stormwater back-up submerged highway bypass underpass under 3.5 feet of muddy water with 2 passenger vehicles stalled.',
        affected: 5,
        zone: 'Sector 7 - Creek Basin',
        lat: 37.747,
        lng: -122.402
      }
    ];

    const template = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
    return createIncident({
      title: template.title,
      description: template.description,
      category: template.category,
      location: {
        address: `${Math.floor(Math.random() * 800 + 100)} Mission Way, ${template.zone}`,
        landmark: 'Near public plaza',
        zone: template.zone,
        lat: template.lat + (Math.random() - 0.5) * 0.01,
        lng: template.lng + (Math.random() - 0.5) * 0.01
      },
      affectedCount: template.affected,
      reporter: {
        name: 'Automated 911 Citizen Relay',
        phone: '+1 (555) 019-9110',
        relationship: 'Public Bystander'
      }
    });
  };

  // Metrics Calculation (Feature 6 Advanced Operational Analytics)
  const metrics = useMemo(() => {
    const total = incidents.length;
    let critical = 0;
    let high = 0;
    let pending = 0;
    let assigned = 0;
    let inProgress = 0;
    let resolved = 0;
    let totalPeopleAffected = 0;

    const categoryCounts: Record<EmergencyCategory, number> = {
      'Fire Emergency': 0,
      'Road Accident': 0,
      'Medical Emergency': 0,
      Flood: 0,
      'Building Collapse': 0,
      'Other Emergencies': 0
    };

    const severityCounts: Record<SeverityLevel, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0
    };

    let totalVerified = 0;
    let unverified = 0;
    let underReview = 0;
    let unableToVerify = 0;
    let requiringReview = 0;
    let possibleDuplicates = 0;

    incidents.forEach((inc) => {
      if (inc.severity === 'Critical') critical++;
      if (inc.severity === 'High') high++;

      // Status
      if (inc.status === 'Reported' || (inc.status as string) === 'Pending') {
        pending++;
      } else if (inc.status === 'Assigned') {
        assigned++;
      } else if (inc.status === 'In Progress') {
        inProgress++;
      } else if (inc.status === 'Resolved') {
        resolved++;
      }

      totalPeopleAffected += inc.affectedCount || 0;

      if (categoryCounts[inc.category] !== undefined) {
        categoryCounts[inc.category]++;
      }
      if (severityCounts[inc.severity] !== undefined) {
        severityCounts[inc.severity]++;
      }

      // Verification metrics
      const vStatus = inc.verificationStatus || 'Unverified';
      if (vStatus === 'Verified') totalVerified++;
      else if (vStatus === 'Under Review') underReview++;
      else if (vStatus === 'Unable to Verify') unableToVerify++;
      else unverified++;

      const hasDupes = inc.duplicateMatches && inc.duplicateMatches.length > 0;
      const hasSuspicious = inc.suspiciousIndicators && inc.suspiciousIndicators.length > 0;
      if (hasDupes) possibleDuplicates++;
      if (hasDupes || hasSuspicious || vStatus === 'Under Review') {
        requiringReview++;
      }
    });

    // Team metrics
    const totalTeams = teams.length;
    let availableTeams = 0;
    let busyTeams = 0;
    let unavailableTeams = 0;

    teams.forEach((t) => {
      if (t.availability === 'Available' || t.status === 'Available') {
        availableTeams++;
      } else if (t.availability === 'Busy' || t.status === 'Busy' || t.status === 'Assigned') {
        busyTeams++;
      } else {
        unavailableTeams++;
      }
    });

    const unassignedIncidents = incidents.filter(
      (i) => i.status !== 'Resolved' && (!i.assignedTeamId || i.assignedResourceIds.length === 0)
    ).length;

    // Average assignment time calculation
    const assignedOrResolved = incidents.filter(
      (i) => (i.status === 'Assigned' || i.status === 'In Progress' || i.status === 'Resolved') && i.assignedTeamId
    );

    let totalAssignmentMinutes = 0;
    let assignmentCount = 0;

    assignmentHistory.forEach((asg) => {
      const matchInc = incidents.find((i) => i.id === asg.incidentId);
      if (matchInc) {
        const diff =
          (new Date(asg.assignedAt).getTime() - new Date(matchInc.timestamp).getTime()) / (60 * 1000);
        if (diff >= 0 && diff < 300) {
          totalAssignmentMinutes += diff;
          assignmentCount++;
        }
      }
    });

    const averageAssignmentTimeMinutes =
      assignmentCount > 0 ? Math.round((totalAssignmentMinutes / assignmentCount) * 10) / 10 : 8.5;

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return {
      total,
      critical,
      high,
      pending,
      assigned,
      inProgress,
      resolved,
      totalPeopleAffected,
      categoryCounts,
      severityCounts,
      // Team metrics
      totalTeams,
      availableTeams,
      busyTeams,
      unavailableTeams,
      unassignedIncidents,
      averageAssignmentTimeMinutes,
      resolutionRate,
      // Legacy alias metrics
      totalResources: totalTeams,
      availableResources: availableTeams,
      assignedResources: busyTeams,
      unavailableResources: unavailableTeams,
      // Verification metrics
      totalVerified,
      unverified,
      underReview,
      unableToVerify,
      requiringReview,
      possibleDuplicates,
      activeSOSCount: incidents.filter((i) => i.isSOS && i.status !== 'Resolved').length,
      hasVideoEvidenceCount: incidents.filter((i) => i.hasVideoEvidence).length
    };
  }, [incidents, teams, assignmentHistory]);

  return (
    <IncidentContext.Provider
      value={{
        incidents,
        teams,
        resources: teams,
        units: teams,
        assignmentHistory,
        activityHistory,
        activeTab,
        setActiveTab,
        selectedIncident,
        setSelectedIncident,
        createIncident,
        triggerOneTapSOS,
        updateIncident,
        updateStatus,
        updateSeverity,
        updateIncidentNotes,
        deleteIncident,
        saveIncidentVideo,
        getIncidentVideo,
        deleteIncidentVideo,
        overridePriorityScore,
        updateVerificationStatus,
        assignTeamToIncident,
        releaseTeamFromIncident,
        releaseAllIncidentResources,
        createTeam,
        updateTeam,
        deleteTeam,
        updateTeamLocation,
        updateTeamAvailability,
        assignResourceToIncident,
        releaseResourceFromIncident,
        updateResourceStatus,
        createResource,
        assignUnitToIncident,
        removeUnitFromIncident,
        resetToSampleData,
        clearAllIncidents,
        generateRandomMockIncident,
        metrics
      }}
    >
      {children}
    </IncidentContext.Provider>
  );
};

export function useIncidents() {
  const context = useContext(IncidentContext);
  if (!context) {
    throw new Error('useIncidents must be used within an IncidentProvider');
  }
  return context;
}
