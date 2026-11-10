import { Incident, DuplicateMatch, SuspiciousIndicator, VerificationStatus } from '../types';

/**
 * Calculates distance in kilometers between two GPS coordinates using Haversine formula
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Clean text to meaningful tokens for similarity analysis
 */
function tokenizeText(text: string): Set<string> {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'is', 'are', 'was', 'were', 'it', 'this', 'that', 'from', 'near', 'reported', 'there'
  ]);
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
  );
}

/**
 * Computes Jaccard word similarity between two texts (0 to 1)
 */
function computeJaccardSimilarity(text1: string, text2: string): number {
  const set1 = tokenizeText(text1);
  const set2 = tokenizeText(text2);
  if (set1.size === 0 || set2.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of set1) {
    if (set2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = new Set([...set1, ...set2]).size;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Identifies possible duplicate reports based on geographic proximity, category,
 * description similarity, and submission timestamps.
 */
export function detectDuplicates(target: Incident, allIncidents: Incident[]): DuplicateMatch[] {
  const duplicates: DuplicateMatch[] = [];
  const targetTime = new Date(target.timestamp).getTime();

  for (const other of allIncidents) {
    if (other.id === target.id) continue;

    const reasons: string[] = [];
    let score = 0;

    // 1. Category comparison
    const isSameCategory = target.category === other.category;
    const isRelatedCategory =
      (target.category === 'Fire Emergency' && other.category === 'Building Collapse') ||
      (target.category === 'Building Collapse' && other.category === 'Fire Emergency') ||
      (target.category === 'Road Accident' && other.category === 'Medical Emergency') ||
      (target.category === 'Medical Emergency' && other.category === 'Road Accident');

    if (isSameCategory) {
      score += 30;
      reasons.push(`Identical emergency category (${target.category})`);
    } else if (isRelatedCategory) {
      score += 15;
      reasons.push(`Related emergency category (${other.category})`);
    }

    // 2. Geographic proximity comparison
    let distanceKm: number | null = null;
    if (
      target.location?.lat &&
      target.location?.lng &&
      other.location?.lat &&
      other.location?.lng
    ) {
      distanceKm = calculateDistanceKm(
        target.location.lat,
        target.location.lng,
        other.location.lat,
        other.location.lng
      );

      if (distanceKm <= 0.4) {
        score += 35;
        reasons.push(`Extreme proximity: ~${Math.round(distanceKm * 1000)}m away`);
      } else if (distanceKm <= 1.2) {
        score += 25;
        reasons.push(`Close proximity: ~${distanceKm.toFixed(1)} km away`);
      } else if (distanceKm <= 2.5) {
        score += 10;
        reasons.push(`Same vicinity: ~${distanceKm.toFixed(1)} km away`);
      }
    }

    // Address text overlap check
    const addressSimilarity = computeJaccardSimilarity(
      target.location.address || '',
      other.location.address || ''
    );
    if (addressSimilarity >= 0.4) {
      score += 15;
      reasons.push(`High street address overlap (${Math.round(addressSimilarity * 100)}%)`);
    }

    // 3. Description & Title similarity
    const titleSimilarity = computeJaccardSimilarity(target.title, other.title);
    const descSimilarity = computeJaccardSimilarity(target.description, other.description);
    const textSimilarity = Math.max(titleSimilarity, descSimilarity);

    if (textSimilarity >= 0.5) {
      score += 30;
      reasons.push(`Significant narrative similarity (${Math.round(textSimilarity * 100)}%)`);
    } else if (textSimilarity >= 0.25) {
      score += 15;
      reasons.push(`Shared incident keywords (${Math.round(textSimilarity * 100)}%)`);
    }

    // 4. Timestamp proximity
    const otherTime = new Date(other.timestamp).getTime();
    const timeDiffMinutes = Math.abs(targetTime - otherTime) / (1000 * 60);

    if (timeDiffMinutes <= 45) {
      score += 15;
      reasons.push(`Submitted ${Math.round(timeDiffMinutes)} minutes apart`);
    } else if (timeDiffMinutes <= 180) {
      score += 10;
      reasons.push(`Submitted ${Math.round(timeDiffMinutes / 60)} hours apart`);
    }

    // Threshold for duplicate detection match
    if (score >= 50 && (isSameCategory || isRelatedCategory)) {
      duplicates.push({
        matchedIncidentId: other.id,
        similarityScore: Math.min(100, Math.round(score)),
        reasons
      });
    }
  }

  return duplicates.sort((a, b) => b.similarityScore - a.similarityScore);
}

/**
 * Identifies suspicious indicators requiring human review:
 * - Conflicting location information
 * - Repeated identical submissions
 * - Inconsistent incident descriptions
 * - Unusual repeated reporting patterns
 * 
 * IMPORTANT: A suspicious indicator is NOT proof of a false emergency.
 */
export function detectSuspiciousIndicators(
  target: Incident,
  allIncidents: Incident[]
): SuspiciousIndicator[] {
  const indicators: SuspiciousIndicator[] = [];
  const lowerDesc = target.description.toLowerCase();
  const lowerTitle = target.title.toLowerCase();
  const lowerAddress = (target.location.address || '').toLowerCase();
  const fullText = `${lowerTitle} ${lowerDesc}`;

  // 1. Conflicting location information check
  const waterKeywords = ['creek', 'river', 'pier', 'marina', 'harbor', 'canal', 'promenade'];
  const highwayKeywords = ['highway', 'freeway', 'interstate', 'i-280', 'i-80', 'expressway'];
  const indoorKeywords = ['apartment', 'residential', 'bedroom', 'kitchen', 'basement'];

  const mentionsWater = waterKeywords.some(kw => fullText.includes(kw));
  const mentionsHighway = highwayKeywords.some(kw => fullText.includes(kw));
  const addressIsHighway = highwayKeywords.some(kw => lowerAddress.includes(kw));
  const addressIsWater = waterKeywords.some(kw => lowerAddress.includes(kw));

  if (mentionsHighway && addressIsWater) {
    indicators.push({
      type: 'conflicting_location',
      level: 'medium',
      message: 'Location conflict: Narrative specifies highway expressway but reported address is a waterfront basin.'
    });
  } else if (mentionsWater && addressIsHighway) {
    indicators.push({
      type: 'conflicting_location',
      level: 'medium',
      message: 'Location conflict: Narrative specifies flood/waterway location while address points to expressway corridor.'
    });
  }

  if (target.location.address.trim().length < 6 || target.location.address.toLowerCase().includes('unknown')) {
    indicators.push({
      type: 'conflicting_location',
      level: 'low',
      message: 'Vague or minimal address provided; street validation required.'
    });
  }

  // 2. Inconsistent incident descriptions
  // High casualty count with contradictory "no injury" phrases
  const lowHarmPhrases = ['no one hurt', 'no injuries', 'nobody injured', 'minor scratch only', 'just a scratch', 'zero casualty'];
  const hasLowHarmPhrase = lowHarmPhrases.some(phrase => fullText.includes(phrase));

  if (target.affectedCount >= 10 && hasLowHarmPhrase) {
    indicators.push({
      type: 'inconsistent_description',
      level: 'high',
      message: `Data inconsistency: Affected count is ${target.affectedCount} individuals, but description states "${lowHarmPhrases.find(p => fullText.includes(p))}".`
    });
  }

  // Category mismatch checks
  if (target.category === 'Building Collapse' && (fullText.includes('trash fire') || fullText.includes('kitchen pan') || fullText.includes('cat'))) {
    indicators.push({
      type: 'inconsistent_description',
      level: 'medium',
      message: 'Category inconsistency: Reported as Building Collapse but narrative indicates localized non-structural event.'
    });
  }

  if (target.category === 'Flood' && (fullText.includes('wildfire') || fullText.includes('bonfire') || fullText.includes('dry brush fire'))) {
    indicators.push({
      type: 'inconsistent_description',
      level: 'medium',
      message: 'Category inconsistency: Reported as Flood emergency but text describes dry fire conditions.'
    });
  }

  // 3. Repeated identical submissions from same or nearby source
  const exactDuplicates = allIncidents.filter(other => {
    if (other.id === target.id) return false;
    const sameReporter =
      target.reporter.phone &&
      other.reporter.phone &&
      target.reporter.phone === other.reporter.phone;
    const sameText =
      target.title.trim().toLowerCase() === other.title.trim().toLowerCase() ||
      target.description.trim().toLowerCase() === other.description.trim().toLowerCase();
    return sameReporter && sameText;
  });

  if (exactDuplicates.length > 0) {
    indicators.push({
      type: 'repeated_submission',
      level: 'high',
      message: `Repeated submission: Exactly identical text submitted by same contact number (${exactDuplicates.map(e => e.id).join(', ')}). Possible duplicate transmission.`
    });
  }

  // 4. Unusual repeated reporting patterns
  if (target.reporter.phone) {
    const reportsFromSamePhone = allIncidents.filter(
      other => other.reporter.phone && other.reporter.phone === target.reporter.phone
    );
    if (reportsFromSamePhone.length >= 3) {
      indicators.push({
        type: 'unusual_pattern',
        level: 'medium',
        message: `High frequency reporting: Contact number has filed ${reportsFromSamePhone.length} incident reports in the system. Human verification advised.`
      });
    }
  }

  return indicators;
}
