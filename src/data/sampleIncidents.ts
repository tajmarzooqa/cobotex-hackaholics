import { Incident } from '../types';
import { rankIncidentsByPriority } from '../utils/prioritizationEngine';

const RAW_INCIDENTS: Omit<Incident, 'priorityScore'>[] = [
  {
    id: 'RQ-1001',
    title: 'Commercial Complex 3rd Floor Fire & Heavy Smoke',
    description: 'Electrical explosion reported in warehouse distribution sector, spreading upward through HVAC ventilation shaft. Heavy black smoke visible. Multiple workers evacuating.',
    category: 'Fire Emergency',
    severity: 'Critical',
    suggestedSeverity: 'Critical',
    severityReason: 'High-hazard indicators detected (explosion, massive fire, spreading). 14 people affected in multi-story structure.',
    status: 'In Progress',
    verificationStatus: 'Verified',
    verifiedBy: 'Captain R. Torres (Engine 14)',
    verifiedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    verificationNote: 'On-scene visual confirmation by Engine 14. Fire suppression active.',
    verificationHistory: [
      {
        id: 'vh-1',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        author: 'System Intake',
        previousStatus: 'Unverified',
        newStatus: 'Under Review',
        note: 'High casualty fire report queued for rapid field verification.'
      },
      {
        id: 'vh-2',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        author: 'Captain R. Torres (Engine 14)',
        previousStatus: 'Under Review',
        newStatus: 'Verified',
        note: 'Confirmed structural fire with smoke billowing from 3rd floor ventilation.'
      }
    ],
    duplicateMatches: [
      {
        matchedIncidentId: 'RQ-1007',
        similarityScore: 92,
        reasons: [
          'Identical emergency category (Fire Emergency)',
          'Extreme proximity: ~180m away on Grand Commercial Blvd',
          'High narrative similarity (84%)',
          'Submitted 12 minutes apart'
        ]
      }
    ],
    location: {
      address: '742 Grand Commercial Blvd, Sector 3',
      landmark: 'Behind Metro Logistics Hub',
      zone: 'Sector 3 - Downtown East',
      lat: 37.7749,
      lng: -122.4194
    },
    affectedCount: 14,
    reporter: {
      name: 'Marcus Vance',
      phone: '+1 (555) 234-8891',
      relationship: 'Facility Safety Coordinator',
      notes: 'Main power cut off; emergency exits on north side currently congested.'
    },
    timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    assignedTeamId: 'TEAM-FIR-01',
    assignedTeamName: 'Engine 14 Heavy Pumper & Suppression',
    assignedResourceIds: ['TEAM-FIR-01'],
    assignedUnits: ['Engine 14 Heavy Pumper & Suppression'],
    timeline: [
      {
        id: 'tl-1',
        timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
        author: 'Marcus Vance (Citizen Web)',
        action: 'Incident Reported',
        note: 'Report received with automated Critical severity score (88/100).'
      },
      {
        id: 'tl-2',
        timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
        author: 'Dispatch Operator Harris',
        action: 'Resource Allocated: Heavy Pumper Engine 14',
        note: 'Fire response unit dispatched from Central Firehouse Station 1.'
      },
      {
        id: 'tl-3',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        author: 'Captain Torres (Engine 14)',
        action: 'Status Updated to In Progress',
        note: 'Fire attack team establishing supply line from hydrant #4.'
      }
    ],
    tags: ['commercial-fire', 'smoke-inhalation', 'evacuation'],
    hasVideoEvidence: true,
    videoEvidence: {
      id: 'vid-demo-1001',
      incidentId: 'RQ-1001',
      recordedAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      durationSeconds: 14,
      mimeType: 'video/webm',
      sizeBytes: 2450000,
      hasAudio: true,
      fileName: 'emergency_evidence_RQ-1001.webm',
      resolution: '720p HD',
      storedInIndexedDB: true
    }
  },
  {
    id: 'RQ-1007',
    title: 'Warehouse Distribution Center Black Smoke & Flame Flare',
    description: 'Heavy black smoke coming from roof of distribution facility near Metro logistics. People rushing out into parking lot.',
    category: 'Fire Emergency',
    severity: 'High',
    suggestedSeverity: 'High',
    severityReason: 'Significant fire emergency with heavy smoke in commercial district.',
    status: 'Reported',
    verificationStatus: 'Under Review',
    verificationNote: 'Flagged as potential duplicate of primary incident RQ-1001. Awaiting operator consolidation.',
    verificationHistory: [
      {
        id: 'vh-3',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        author: 'Automated Verification Prober',
        previousStatus: 'Unverified',
        newStatus: 'Under Review',
        note: 'Probable duplicate detected matching active fire RQ-1001 (92% confidence).'
      }
    ],
    duplicateMatches: [
      {
        matchedIncidentId: 'RQ-1001',
        similarityScore: 92,
        reasons: [
          'Identical emergency category (Fire Emergency)',
          'Extreme proximity: ~180m away on Grand Commercial Blvd',
          'High narrative similarity (84%)',
          'Submitted 12 minutes apart'
        ]
      }
    ],
    location: {
      address: '780 Grand Commercial Blvd, Sector 3',
      landmark: 'Across from Metro Hub Parking Lot B',
      zone: 'Sector 3 - Downtown East',
      lat: 37.7758,
      lng: -122.4186
    },
    affectedCount: 8,
    reporter: {
      name: 'Kenneth Miller',
      phone: '+1 (555) 710-4491',
      relationship: 'Passing Delivery Driver'
    },
    timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    assignedResourceIds: [],
    assignedUnits: [],
    timeline: [
      {
        id: 'tl-1007-1',
        timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        author: 'Kenneth Miller',
        action: 'Incident Reported',
        note: 'Second caller reporting smoke on Grand Commercial Blvd.'
      }
    ],
    tags: ['commercial-fire', 'duplicate-candidate']
  },
  {
    id: 'RQ-1002',
    title: 'Multi-Storey Residential Facade & Balcony Collapse',
    description: 'Old masonry facade collapsed into pedestrian sidewalk and crushed two lower balconies after heavy storm. Report of 3 individuals trapped beneath rubble.',
    category: 'Building Collapse',
    severity: 'Critical',
    suggestedSeverity: 'Critical',
    severityReason: 'Structural compromise carries immediate catastrophic collapse and entrapment risk. Trapped individuals reported.',
    status: 'Assigned',
    verificationStatus: 'Verified',
    verifiedBy: 'Dispatch Supervisor Novak',
    verifiedAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    verificationNote: 'Confirmed via 911 audio and police field patrol unit 204 on scene.',
    verificationHistory: [
      {
        id: 'vh-4',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        author: 'System Intake',
        previousStatus: 'Unverified',
        newStatus: 'Under Review',
        note: 'Critical structural disaster queued for verification.'
      },
      {
        id: 'vh-5',
        timestamp: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
        author: 'Dispatch Supervisor Novak',
        previousStatus: 'Under Review',
        newStatus: 'Verified',
        note: 'Cross-checked with patrol officer report. Masonry debris covering sidewalk.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: '1180 Riverfront Avenue, Old District',
      landmark: 'Corner of 12th St and Riverfront',
      zone: 'Zone 2 - Historic District',
      lat: 37.7833,
      lng: -122.4167
    },
    affectedCount: 6,
    reporter: {
      name: 'Sarah Chen',
      phone: '+1 (555) 872-9102',
      relationship: 'Eyewitness',
      notes: 'Can hear shouting from under awning rubble. Gas smell faint.'
    },
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    assignedTeamId: 'TEAM-RSC-01',
    assignedTeamName: 'Urban Search & Heavy Extrication Squad 3',
    assignedResourceIds: ['TEAM-RSC-01'],
    assignedUnits: ['Urban Search & Heavy Extrication Squad 3'],
    timeline: [
      {
        id: 'tl-4',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        author: 'Sarah Chen (Mobile)',
        action: 'Incident Reported',
        note: 'Emergency distress call logged.'
      },
      {
        id: 'tl-5',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        author: 'Dispatch Supervisor Novak',
        action: 'Resource Allocated: Urban Search & Heavy Extrication Squad 3',
        note: 'Rescue team mobilized with acoustic listening detectors and shoring kits.'
      }
    ],
    tags: ['structural-collapse', 'trapped-persons', 'usar-required']
  },
  {
    id: 'RQ-1003',
    title: 'Multiple Vehicle Pileup on Northbound Expressway',
    description: 'Four-car collision in center and left lanes during sudden rainstorm. Two drivers unable to open jammed doors. Paramedics needed for neck trauma and lacerations.',
    category: 'Road Accident',
    severity: 'High',
    suggestedSeverity: 'High',
    severityReason: 'Moderate-to-high scale: 5 individuals affected requiring priority EMS/fire dispatch. Collision with jammed vehicles.',
    status: 'In Progress',
    verificationStatus: 'Verified',
    verifiedBy: 'Officer J. Ramirez (Highway Patrol)',
    verifiedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    verificationNote: 'State Highway Patrol unit 204 first on scene. Confirmed 4 passenger vehicles involved.',
    verificationHistory: [
      {
        id: 'vh-6',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        author: 'Highway Dispatch System',
        previousStatus: 'Unverified',
        newStatus: 'Verified',
        note: 'Verified directly via Highway Patrol official radio dispatch.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: 'Interstate 280 Northbound, Mile Marker 14',
      landmark: 'Near Airport Expressway Overpass',
      zone: 'Sector 5 - Highway Corridor',
      lat: 37.7610,
      lng: -122.4080
    },
    affectedCount: 5,
    reporter: {
      name: 'Officer J. Ramirez',
      phone: '+1 (555) 441-2091',
      relationship: 'Highway Patrol Officer',
      notes: 'Left two lanes blocked. Heavy tow truck and rescue cutter requested.'
    },
    timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    assignedTeamId: 'TEAM-MED-01',
    assignedTeamName: 'Medic 101 Advanced Life Support & Trauma',
    assignedResourceIds: ['TEAM-MED-01'],
    assignedUnits: ['Medic 101 Advanced Life Support & Trauma'],
    timeline: [
      {
        id: 'tl-6',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        author: 'Officer Ramirez (PD Radio)',
        action: 'Incident Reported',
        note: 'High severity multi-vehicle collision logged.'
      },
      {
        id: 'tl-7',
        timestamp: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
        author: 'Dispatch Operator Harris',
        action: 'Resource Allocated: Metro Ambulance 101 – ALS Triage',
        note: 'Ambulance arrived on scene at T+12.'
      }
    ],
    tags: ['multi-vehicle', 'highway-blocked', 'extrication']
  },
  {
    id: 'RQ-1004',
    title: 'Flash Flood Overtopping Levee on Creek Promenade',
    description: 'Heavy precipitation caused flash runoff. Creek water level rose 4 feet above retaining wall. Ground floor apartments flooded, elderly residents requiring boat evacuation.',
    category: 'Flood',
    severity: 'High',
    suggestedSeverity: 'High',
    severityReason: 'Significant flood requiring priority emergency service response. Rising water in residential area.',
    status: 'Assigned',
    verificationStatus: 'Under Review',
    verificationNote: 'Hydro sensor shows water surge. Field responder dispatch in progress for physical verification.',
    verificationHistory: [
      {
        id: 'vh-7',
        timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        author: 'Citizen Intake',
        previousStatus: 'Unverified',
        newStatus: 'Under Review',
        note: 'Awaiting river gauge telemetry cross-verification.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: '420 Valley Stream Way',
      landmark: 'Near Willow Creek Bridge',
      zone: 'Sector 7 - Creek Basin',
      lat: 37.7520,
      lng: -122.4350
    },
    affectedCount: 9,
    reporter: {
      name: 'David K. O\'Connor',
      phone: '+1 (555) 912-3401',
      relationship: 'HOA President',
      notes: 'Basement and 1st floor submerged to waist level.'
    },
    timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    assignedTeamId: 'TEAM-RSC-02',
    assignedTeamName: 'Swiftwater & Flood Evac Boat Unit 2',
    assignedResourceIds: ['TEAM-RSC-02'],
    assignedUnits: ['Swiftwater & Flood Evac Boat Unit 2'],
    timeline: [
      {
        id: 'tl-8',
        timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
        author: 'David O\'Connor',
        action: 'Incident Reported',
        note: 'High water warning verified by storm sensor.'
      },
      {
        id: 'tl-8b',
        timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        author: 'Dispatch Command',
        action: 'Resource Allocated: Swiftwater & Flood Evac Boat Unit 2',
        note: 'Rescue team mobilized with inflatable zodiacs.'
      }
    ],
    tags: ['flash-flood', 'water-rescue', 'boat-deployment']
  },
  {
    id: 'RQ-1005',
    title: 'Severe Cardiac Distress at Transit Terminal',
    description: 'Elderly commuter collapsed at platform B ticket gate. Bystander initiated CPR with automated external defibrillator (AED) retrieved from station kiosk.',
    category: 'Medical Emergency',
    severity: 'High',
    suggestedSeverity: 'High',
    severityReason: 'High-hazard indicators detected (cardiac, unconscious). Urgent life-safety intervention required.',
    status: 'In Progress',
    verificationStatus: 'Verified',
    verifiedBy: 'Station Supervisor Elena Rostova',
    verifiedAt: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
    verificationNote: 'Transit CCTV live feed confirmed medical emergency and AED deployment.',
    verificationHistory: [
      {
        id: 'vh-8',
        timestamp: new Date(Date.now() - 17 * 60 * 1000).toISOString(),
        author: 'Elena Rostova',
        previousStatus: 'Unverified',
        newStatus: 'Verified',
        note: 'Verified in transit command center via terminal platform B camera.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: 'Central Station concourse, Platform B',
      landmark: 'Main Ticket Hall',
      zone: 'Sector 1 - Transit Center',
      lat: 37.7910,
      lng: -122.4010
    },
    affectedCount: 1,
    reporter: {
      name: 'Transit Supervisor Elena Rostova',
      phone: '+1 (555) 602-1188',
      relationship: 'Station Manager',
      notes: 'AED delivered 1 shock; patient has pulse but remains unresponsive.'
    },
    timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    assignedTeamId: 'TEAM-MED-01',
    assignedTeamName: 'Medic 101 Advanced Life Support & Trauma',
    assignedResourceIds: ['TEAM-MED-01'],
    assignedUnits: ['Medic 101 Advanced Life Support & Trauma'],
    timeline: [
      {
        id: 'tl-9',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
        author: 'Elena Rostova',
        action: 'Incident Reported',
        note: 'Code Blue medical emergency broadcast.'
      },
      {
        id: 'tl-10',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        author: 'EMS Dispatch',
        action: 'Resource Allocated: Critical Care Trauma Team Alpha',
        note: 'Specialist physicians deployed to platform level.'
      }
    ],
    tags: ['cardiac-arrest', 'cpr-active', 'transit']
  },
  {
    id: 'RQ-1006',
    title: 'Downed Transformer Pole Blocking Residential Alleyway',
    description: 'Strong wind gust caused secondary utility pole to tilt onto telephone lines. Sparks observed earlier, now quiet. No active fire, but live wire is touching chain link fence.',
    category: 'Other Emergencies',
    severity: 'Medium',
    suggestedSeverity: 'Medium',
    severityReason: 'Standard priority response: other emergencies with localized impact (0 injuries, electrical hazard).',
    status: 'Resolved',
    verificationStatus: 'Verified',
    verifiedBy: 'Power Grid Co & Patrol 204',
    verifiedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    verificationNote: 'Field electrician confirmed transformer pole secured and circuit de-energized.',
    verificationHistory: [
      {
        id: 'vh-9',
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        author: 'Patrol 204',
        previousStatus: 'Under Review',
        newStatus: 'Verified',
        note: 'Inspected on site. Live wire isolated.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: '89 Maplewood Court, West Hill',
      landmark: 'Between #89 and #91 garage lane',
      zone: 'Sector 4 - West Residential',
      lat: 37.7410,
      lng: -122.4490
    },
    affectedCount: 0,
    reporter: {
      name: 'Arthur Pendelton',
      phone: '+1 (555) 304-9821',
      relationship: 'Neighbor',
      notes: 'Power utility crew already isolated circuit.'
    },
    timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    assignedResourceIds: [],
    assignedUnits: [],
    timeline: [
      {
        id: 'tl-11',
        timestamp: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
        author: 'Arthur Pendelton',
        action: 'Incident Reported',
        note: 'Hazard cordoned off.'
      },
      {
        id: 'tl-12',
        timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
        author: 'Power Grid Co & Patrol',
        action: 'Resolved',
        note: 'Wire decommissioned, pole stabilized, fence verified safe.'
      }
    ],
    tags: ['electrical-hazard', 'downed-wire', 'utility']
  },
  {
    id: 'RQ-1008',
    title: 'Disputed Incident with Discrepant Casualty Claims',
    description: 'Reported major pileup on highway overpass with multiple victims trapped, but caller states nobody injured and minor scratch only.',
    category: 'Road Accident',
    severity: 'Medium',
    suggestedSeverity: 'Medium',
    severityReason: 'Assessment flagged for human review due to narrative inconsistencies.',
    status: 'Reported',
    verificationStatus: 'Under Review',
    verificationNote: 'System flagged conflicting casualty claims and location discrepancy. Human review required.',
    verificationHistory: [
      {
        id: 'vh-10',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        author: 'Verification Engine',
        previousStatus: 'Unverified',
        newStatus: 'Under Review',
        note: 'Flagged for human operator review: narrative conflict detected between affected count (22) and statement "nobody injured".'
      }
    ],
    suspiciousIndicators: [
      {
        type: 'inconsistent_description',
        level: 'high',
        message: 'Data inconsistency: Affected count is 22 individuals, but description states "nobody injured".'
      },
      {
        type: 'conflicting_location',
        level: 'medium',
        message: 'Location conflict: Narrative specifies highway overpass while reported address is Harbor Marina promenade.'
      }
    ],
    duplicateMatches: [],
    location: {
      address: 'Harbor Marina Promenade, Dock 4',
      landmark: 'Yacht Club Gate',
      zone: 'Sector 7 - Creek Basin',
      lat: 37.7580,
      lng: -122.4280
    },
    affectedCount: 22,
    reporter: {
      name: 'Unverified Web Caller',
      phone: '+1 (555) 000-1122',
      relationship: 'Anonymous'
    },
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    assignedResourceIds: [],
    assignedUnits: [],
    timeline: [
      {
        id: 'tl-1008-1',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        author: 'Web Intake',
        action: 'Incident Reported',
        note: 'Report intake complete. Sent to verification queue.'
      }
    ],
    tags: ['review-required', 'suspicious-indicators']
  }
];

export const INITIAL_INCIDENTS: Incident[] = rankIncidentsByPriority(RAW_INCIDENTS as any);
