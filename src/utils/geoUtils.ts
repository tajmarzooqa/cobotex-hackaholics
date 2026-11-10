import {
  EmergencyCategory,
  ResponseTeam,
  ResponseTeamCategory
} from '../types';

/**
 * Calculates approximate geographic distance between two lat/lng coordinates
 * using the HAVERSINE FORMULA
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { km: number; miles: number } {
  // If coordinates are invalid or identical
  if (
    typeof lat1 !== 'number' ||
    typeof lon1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lon2 !== 'number' ||
    isNaN(lat1) ||
    isNaN(lon1) ||
    isNaN(lat2) ||
    isNaN(lon2)
  ) {
    return { km: 0, miles: 0 };
  }

  const R = 6371; // Earth's mean radius in kilometers
  const toRad = (angle: number) => (angle * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  const miles = km * 0.621371;

  return {
    km: Math.round(km * 10) / 10,
    miles: Math.round(miles * 10) / 10
  };
}

/**
 * Checks if a response team category matches the emergency category needs
 */
export function isTeamSuitableForCategory(
  teamCategory: ResponseTeamCategory,
  incidentCategory: EmergencyCategory
): boolean {
  switch (incidentCategory) {
    case 'Fire Emergency':
      return (
        teamCategory === 'Fire Response Team' ||
        teamCategory === 'Disaster Management Team' ||
        teamCategory === 'General Emergency Response Team'
      );
    case 'Road Accident':
      return (
        teamCategory === 'Medical Response Team' ||
        teamCategory === 'Rescue Team' ||
        teamCategory === 'Fire Response Team' ||
        teamCategory === 'General Emergency Response Team'
      );
    case 'Medical Emergency':
      return (
        teamCategory === 'Medical Response Team' ||
        teamCategory === 'General Emergency Response Team'
      );
    case 'Flood':
      return (
        teamCategory === 'Rescue Team' ||
        teamCategory === 'Disaster Management Team' ||
        teamCategory === 'General Emergency Response Team'
      );
    case 'Building Collapse':
      return (
        teamCategory === 'Rescue Team' ||
        teamCategory === 'Fire Response Team' ||
        teamCategory === 'Medical Response Team' ||
        teamCategory === 'Disaster Management Team'
      );
    case 'Other Emergencies':
    default:
      return true;
  }
}

export interface TeamRecommendation {
  team: ResponseTeam;
  distanceKm: number;
  distanceMiles: number;
  estimatedTransitMinutes: number;
  isAvailable: boolean;
  isSuitable: boolean;
  recommendationRank: number;
  suitabilityReason: string;
}

/**
 * Evaluates all response teams against an incident, calculates Haversine distances,
 * filters suitable available teams, and ranks them by distance.
 */
export function getTeamRecommendations(
  incidentLat: number,
  incidentLng: number,
  incidentCategory: EmergencyCategory,
  teams: ResponseTeam[]
): {
  suitableAvailableTeams: TeamRecommendation[];
  suitableBusyTeams: TeamRecommendation[];
  allRecommendations: TeamRecommendation[];
  nearestSuitableAvailableTeam: TeamRecommendation | null;
} {
  const evaluated: TeamRecommendation[] = teams.map((team) => {
    const lat = team.latitude ?? team.lat ?? 37.7749;
    const lng = team.longitude ?? team.lng ?? -122.4194;

    const distance = calculateHaversineDistance(incidentLat, incidentLng, lat, lng);
    const isSuitable = isTeamSuitableForCategory(team.category, incidentCategory);
    const isAvail = team.availability === 'Available' || team.status === 'Available';

    // Assume average urban emergency vehicle transit speed ~ 40 km/h with sirens
    const estimatedTransitMinutes = Math.max(1, Math.round((distance.km / 40) * 60));

    let suitabilityReason = 'Full operational category match';
    if (!isSuitable) {
      suitabilityReason = 'Secondary capability (different specialization)';
    }

    return {
      team,
      distanceKm: distance.km,
      distanceMiles: distance.miles,
      estimatedTransitMinutes,
      isAvailable: isAvail,
      isSuitable,
      recommendationRank: 0,
      suitabilityReason
    };
  });

  // Sort suitable available teams strictly by ascending distance
  const suitableAvailable = evaluated
    .filter((r) => r.isSuitable && r.isAvailable)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .map((rec, idx) => ({
      ...rec,
      recommendationRank: idx + 1
    }));

  // Suitable busy teams
  const suitableBusy = evaluated
    .filter((r) => r.isSuitable && !r.isAvailable)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const nearest = suitableAvailable.length > 0 ? suitableAvailable[0] : null;

  return {
    suitableAvailableTeams: suitableAvailable,
    suitableBusyTeams: suitableBusy,
    allRecommendations: evaluated.sort((a, b) => a.distanceKm - b.distanceKm),
    nearestSuitableAvailableTeam: nearest
  };
}
