export type EmergencyCategory =
  | 'Fire Emergency'
  | 'Road Accident'
  | 'Medical Emergency'
  | 'Flood'
  | 'Building Collapse'
  | 'Other Emergencies';

export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Round 2 Incident Status lifecycle: Reported -> Assigned -> In Progress -> Resolved (Pending retained for backward compatibility)
export type IncidentStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved' | 'Pending';

export type VerificationStatus =
  | 'Unverified'
  | 'Under Review'
  | 'Verified'
  | 'Unable to Verify';

// Round 2 Response Team Categories
export type ResponseTeamCategory =
  | 'Fire Response Team'
  | 'Medical Response Team'
  | 'Rescue Team'
  | 'Disaster Management Team'
  | 'General Emergency Response Team';

// Backward compatibility alias for legacy resource types
export type ResourceType =
  | ResponseTeamCategory
  | 'Ambulance'
  | 'Fire response unit'
  | 'Medical response team'
  | 'Rescue team';

// Round 2 Availability Statuses
export type TeamAvailability = 'Available' | 'Busy' | 'Unavailable';
export type ResourceStatus = TeamAvailability | 'Assigned'; // 'Assigned' is mapped to 'Busy' in Round 2

export interface LocationInfo {
  address: string;
  landmark?: string;
  zone: string;
  lat: number;
  lng: number;
}

export interface ReporterInfo {
  name?: string;
  phone?: string;
  relationship?: string;
  notes?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  author: string;
  action: string;
  note?: string;
}

export interface DuplicateMatch {
  matchedIncidentId: string;
  similarityScore: number; // 0 - 100
  reasons: string[];
}

export interface SuspiciousIndicator {
  type: 'conflicting_location' | 'repeated_submission' | 'inconsistent_description' | 'unusual_pattern';
  level: 'low' | 'medium' | 'high';
  message: string;
}

export interface VerificationRecord {
  id: string;
  timestamp: string;
  author: string;
  previousStatus: VerificationStatus;
  newStatus: VerificationStatus;
  note?: string;
}

export interface PriorityBreakdown {
  score: number; // 0 - 100 normalized
  urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low';
  severityPoints: number; // 10, 20, 30, 40
  affectedPoints: number; // 5, 10, 20, 25
  elapsedPoints: number; // 5, 10, 15, 20
  categoryPoints: number; // 8 - 15 urgency weight
  timeElapsedMinutes: number;
  explanation: string;
  isOverridden?: boolean;
  overriddenBy?: string;
  overrideReason?: string;
}

export interface AssignmentRecord {
  id: string;
  incidentId: string;
  incidentTitle: string;
  teamId: string;
  teamName: string;
  teamCategory: ResponseTeamCategory;
  assignedAt: string;
  releasedAt?: string;
  distanceKm: number;
  status: 'Active' | 'Released' | 'Cancelled';
  assignedBy?: string;
  releaseReason?: string;
}

export interface ActivityRecord {
  id: string;
  incidentId: string;
  action: string;
  timestamp: string;
  details: string;
  author: string;
}

export interface VideoEvidence {
  id: string;
  incidentId: string;
  recordedAt: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  hasAudio: boolean;
  fileName?: string;
  resolution?: string;
  notes?: string;
  storedInIndexedDB?: boolean;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: EmergencyCategory;
  severity: SeverityLevel;
  suggestedSeverity: SeverityLevel;
  severityReason: string;
  status: IncidentStatus;
  priorityScore: number; // 0 - 100 dynamically calculated
  priorityRank?: number; // 1 to N
  priorityBreakdown?: PriorityBreakdown;
  verificationStatus: VerificationStatus;
  verificationNote?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  duplicateMatches?: DuplicateMatch[];
  suspiciousIndicators?: SuspiciousIndicator[];
  verificationHistory?: VerificationRecord[];
  location: LocationInfo;
  affectedCount: number;
  reporter: ReporterInfo;
  timestamp: string;
  updatedAt: string;
  assignedTeamId?: string; // Round 2 response team ID
  assignedTeamName?: string;
  assignedResourceIds: string[]; // List of assigned IDs
  assignedUnits: string[]; // Keep for name compatibility
  timeline: TimelineEvent[];
  tags: string[];
  isSOS?: boolean;
  gpsAccuracy?: number;
  sosDeviceState?: {
    isOnline: boolean;
    batteryLevel?: number;
    permissionGranted: boolean;
    capturedAt: string;
  };
  hasVideoEvidence?: boolean;
  videoEvidence?: VideoEvidence;
}

export interface ResponseTeam {
  id: string; // Unique Team ID e.g. "TEAM-FIR-01"
  name: string; // Team Name e.g. "Alpha Fire Engine 1"
  category: ResponseTeamCategory;
  type?: ResourceType; // for backward compatibility
  latitude: number; // Decimal latitude
  longitude: number; // Decimal longitude
  lat?: number; // alias
  lng?: number; // alias
  assignedLocation: string; // Base station / sector
  availability: TeamAvailability; // Available | Busy | Unavailable
  status: ResourceStatus; // alias
  assignedIncidentId?: string; // Currently active incident ID if Busy
  assignedIncidentTitle?: string;
  dispatchedAt?: string;
  contactNumber?: string;
  contactInfo?: string;
  crewCount?: number;
  callSign?: string;
}

// Backward compatibility alias
export type EmergencyResource = ResponseTeam;
export type EmergencyUnit = ResponseTeam;

export type ActiveTab =
  | 'dashboard'
  | 'dispatch'
  | 'incidents'
  | 'verification'
  | 'map'
  | 'report'
  | 'units'
  | 'analytics';

/**
 * Returns suitable team categories for an emergency category
 */
export function getRecommendedTeamCategories(category: EmergencyCategory): ResponseTeamCategory[] {
  switch (category) {
    case 'Fire Emergency':
      return ['Fire Response Team', 'Disaster Management Team', 'General Emergency Response Team'];
    case 'Road Accident':
      return ['Medical Response Team', 'Rescue Team', 'Fire Response Team', 'General Emergency Response Team'];
    case 'Medical Emergency':
      return ['Medical Response Team', 'General Emergency Response Team'];
    case 'Flood':
      return ['Rescue Team', 'Disaster Management Team', 'General Emergency Response Team'];
    case 'Building Collapse':
      return ['Rescue Team', 'Fire Response Team', 'Medical Response Team', 'Disaster Management Team'];
    case 'Other Emergencies':
    default:
      return [
        'Fire Response Team',
        'Medical Response Team',
        'Rescue Team',
        'Disaster Management Team',
        'General Emergency Response Team'
      ];
  }
}

// Backward compatibility alias
export function getRecommendedResourceTypes(category: EmergencyCategory): ResourceType[] {
  return getRecommendedTeamCategories(category) as ResourceType[];
}
