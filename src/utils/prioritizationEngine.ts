import {
  EmergencyCategory,
  SeverityLevel,
  PriorityBreakdown,
  Incident
} from '../types';

export interface CategoryUrgencyWeights {
  'Fire Emergency': number;
  'Building Collapse': number;
  'Flood': number;
  'Medical Emergency': number;
  'Road Accident': number;
  'Other Emergencies': number;
}

export const DEFAULT_CATEGORY_WEIGHTS: CategoryUrgencyWeights = {
  'Fire Emergency': 15,
  'Building Collapse': 15,
  'Flood': 12,
  'Medical Emergency': 12,
  'Road Accident': 10,
  'Other Emergencies': 8
};

/**
 * Calculates dynamic priority score (0 - 100) and transparent breakdown
 * based on Code Clash Round 2 Scoring Model
 */
export function calculatePriorityScore(
  incident: {
    severity: SeverityLevel;
    affectedCount: number;
    timestamp: string;
    category: EmergencyCategory;
    priorityBreakdown?: PriorityBreakdown;
  },
  customWeights: CategoryUrgencyWeights = DEFAULT_CATEGORY_WEIGHTS,
  referenceNow: number = Date.now()
): PriorityBreakdown {
  // Respect manual administrator override if set
  if (incident.priorityBreakdown?.isOverridden && typeof incident.priorityBreakdown.score === 'number') {
    return incident.priorityBreakdown;
  }

  // 1. Severity points (max 40)
  let severityPoints = 10;
  switch (incident.severity) {
    case 'Critical':
      severityPoints = 40;
      break;
    case 'High':
      severityPoints = 30;
      break;
    case 'Medium':
      severityPoints = 20;
      break;
    case 'Low':
    default:
      severityPoints = 10;
      break;
  }

  // 2. People affected points (max 25)
  let affectedPoints = 0;
  const count = incident.affectedCount || 0;
  if (count >= 10) {
    affectedPoints = 25;
  } else if (count >= 5) {
    affectedPoints = 20;
  } else if (count >= 2) {
    affectedPoints = 10;
  } else if (count >= 1) {
    affectedPoints = 5;
  } else {
    affectedPoints = 0;
  }

  // 3. Time elapsed points (max 20)
  const reportTime = new Date(incident.timestamp).getTime();
  const timeElapsedMinutes = Math.max(0, Math.floor((referenceNow - reportTime) / (60 * 1000)));

  let elapsedPoints = 5;
  if (timeElapsedMinutes >= 60) {
    elapsedPoints = 20;
  } else if (timeElapsedMinutes >= 30) {
    elapsedPoints = 15;
  } else if (timeElapsedMinutes >= 10) {
    elapsedPoints = 10;
  } else {
    elapsedPoints = 5;
  }

  // 4. Emergency category urgency weight (max 15)
  const categoryPoints = customWeights[incident.category] ?? 8;

  // Raw combined score (max 40 + 25 + 20 + 15 = 100)
  let rawScore = severityPoints + affectedPoints + elapsedPoints + categoryPoints;

  // Rule: Avoid automatically downgrading critical incidents (keep floor at 70 for Critical)
  if (incident.severity === 'Critical' && rawScore < 70) {
    rawScore = 70;
  }

  const finalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // Urgency classification
  let urgencyLevel: 'Critical' | 'High' | 'Medium' | 'Low' = 'Low';
  if (finalScore >= 80) {
    urgencyLevel = 'Critical';
  } else if (finalScore >= 60) {
    urgencyLevel = 'High';
  } else if (finalScore >= 40) {
    urgencyLevel = 'Medium';
  } else {
    urgencyLevel = 'Low';
  }

  // Transparent human-readable explanation
  const explanation = `Score ${finalScore}/100: [Severity ${incident.severity} = ${severityPoints}pts] + [Impact ${count} affected = ${affectedPoints}pts] + [Elapsed ${timeElapsedMinutes}m = ${elapsedPoints}pts] + [Category "${incident.category}" weight = ${categoryPoints}pts].`;

  return {
    score: finalScore,
    urgencyLevel,
    severityPoints,
    affectedPoints,
    elapsedPoints,
    categoryPoints,
    timeElapsedMinutes,
    explanation,
    isOverridden: false
  };
}

/**
 * Sorts and assigns dynamic priority rank (1 to N) to a list of incidents
 */
export function rankIncidentsByPriority(incidents: Incident[]): Incident[] {
  const now = Date.now();

  // First recalculate latest dynamic score
  const withCalculatedScores = incidents.map(inc => {
    const breakdown = calculatePriorityScore(inc, DEFAULT_CATEGORY_WEIGHTS, now);
    return {
      ...inc,
      priorityScore: breakdown.score,
      priorityBreakdown: breakdown
    };
  });

  // Sort descending by priority score; tie-break with older timestamp first
  withCalculatedScores.sort((a, b) => {
    if (b.priorityScore !== a.priorityScore) {
      return b.priorityScore - a.priorityScore;
    }
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });

  // Assign 1-indexed rank
  return withCalculatedScores.map((inc, index) => ({
    ...inc,
    priorityRank: index + 1
  }));
}
