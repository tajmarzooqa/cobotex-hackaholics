import { EmergencyCategory, SeverityLevel } from '../types';

interface SeveritySuggestion {
  severity: SeverityLevel;
  reason: string;
  score: number;
}

const CRITICAL_KEYWORDS = [
  'trapped', 'collapse', 'collapsed', 'explosion', 'blast', 'unconscious',
  'cardiac', 'stroke', 'not breathing', 'fatal', 'death', 'massive fire',
  'gas leak', 'toxic', 'chemical spill', 'drowning', 'submerged', 'flash flood',
  'pileup', 'multi-vehicle', 'head-on', 'infant', 'structural failure', 'crushed'
];

const HIGH_KEYWORDS = [
  'bleeding', 'fracture', 'burns', 'spreading', 'rising water', 'severe',
  'highway', 'collision', 'smoke inhalation', 'injured', 'broken bone',
  'heavy flooding', 'power lines down', 'electrical fire', 'evacuate', 'evacuating'
];

const MEDIUM_KEYWORDS = [
  'minor injury', 'blocked', 'traffic stalled', 'water leak', 'fender bender',
  'smoke odor', 'small fire', 'containment', 'chest pain stable', 'dizzy'
];

export function calculateSuggestedSeverity(
  category: EmergencyCategory,
  affectedCount: number,
  title: string,
  description: string
): SeveritySuggestion {
  const combinedText = `${title} ${description}`.toLowerCase();
  let baseScore = 20; // 0-100 scale

  // 1. Category weighting
  switch (category) {
    case 'Building Collapse':
      baseScore += 45;
      break;
    case 'Fire Emergency':
      baseScore += 35;
      break;
    case 'Flood':
      baseScore += 30;
      break;
    case 'Medical Emergency':
      baseScore += 30;
      break;
    case 'Road Accident':
      baseScore += 25;
      break;
    case 'Other Emergencies':
      baseScore += 15;
      break;
  }

  // 2. People affected weighting
  if (affectedCount >= 10) {
    baseScore += 40;
  } else if (affectedCount >= 5) {
    baseScore += 25;
  } else if (affectedCount >= 2) {
    baseScore += 15;
  } else if (affectedCount === 1) {
    baseScore += 5;
  }

  // 3. Keyword analysis
  let detectedCriticalKeywords: string[] = [];
  let detectedHighKeywords: string[] = [];

  for (const kw of CRITICAL_KEYWORDS) {
    if (combinedText.includes(kw)) {
      detectedCriticalKeywords.push(kw);
    }
  }

  for (const kw of HIGH_KEYWORDS) {
    if (combinedText.includes(kw)) {
      detectedHighKeywords.push(kw);
    }
  }

  if (detectedCriticalKeywords.length > 0) {
    baseScore += 35 + Math.min(detectedCriticalKeywords.length * 5, 20);
  } else if (detectedHighKeywords.length > 0) {
    baseScore += 20 + Math.min(detectedHighKeywords.length * 4, 15);
  }

  // Final score clamping
  const finalScore = Math.min(100, Math.max(5, baseScore));

  // Determine Severity and craft human rationale
  let severity: SeverityLevel;
  let reason: string;

  if (finalScore >= 75 || affectedCount >= 10 || detectedCriticalKeywords.length >= 2 || category === 'Building Collapse') {
    severity = 'Critical';
    if (affectedCount >= 10) {
      reason = `Critical casualty impact: ${affectedCount} individuals directly affected requiring urgent multi-team triage.`;
    } else if (detectedCriticalKeywords.length > 0) {
      reason = `High-hazard indicators detected (${detectedCriticalKeywords.slice(0, 3).join(', ')}). Immediate life-safety intervention required.`;
    } else if (category === 'Building Collapse') {
      reason = 'Structural compromise carries immediate catastrophic collapse and entrapment risk.';
    } else {
      reason = `Severe incident assessment with high risk to human life and rapid escalations.`;
    }
  } else if (finalScore >= 50 || affectedCount >= 4 || detectedHighKeywords.length > 0) {
    severity = 'High';
    if (affectedCount >= 4) {
      reason = `Moderate-to-high scale: ${affectedCount} individuals affected requiring priority EMS/fire dispatch.`;
    } else if (detectedHighKeywords.length > 0) {
      reason = `Urgent keywords detected (${detectedHighKeywords.slice(0, 2).join(', ')}). Threat of escalation present.`;
    } else {
      reason = `Significant ${category.toLowerCase()} requiring priority emergency service response.`;
    }
  } else if (finalScore >= 30 || affectedCount >= 1) {
    severity = 'Medium';
    reason = `Standard priority response: ${category.toLowerCase()} with localized impact (${affectedCount} person(s)).`;
  } else {
    severity = 'Low';
    reason = `Minor incident with low life-safety risk and isolated property impact.`;
  }

  return {
    severity,
    reason,
    score: finalScore
  };
}
