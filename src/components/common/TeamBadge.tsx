import React from 'react';
import {
  Flame,
  HeartPulse,
  LifeBuoy,
  ShieldAlert,
  Radio,
  Truck,
  CheckCircle2,
  Clock,
  XCircle
} from 'lucide-react';
import { ResponseTeamCategory, TeamAvailability } from '../../types';

export function getTeamCategoryIcon(category: string): React.ElementType {
  switch (category) {
    case 'Fire Response Team':
    case 'Fire response unit':
      return Flame;
    case 'Medical Response Team':
    case 'Ambulance':
      return HeartPulse;
    case 'Rescue Team':
      return LifeBuoy;
    case 'Disaster Management Team':
      return ShieldAlert;
    case 'General Emergency Response Team':
    default:
      return Radio;
  }
}

export function getTeamCategoryColor(category: string): {
  bg: string;
  border: string;
  text: string;
} {
  switch (category) {
    case 'Fire Response Team':
    case 'Fire response unit':
      return {
        bg: 'bg-orange-950/60',
        border: 'border-orange-800/80',
        text: 'text-orange-400'
      };
    case 'Medical Response Team':
    case 'Ambulance':
      return {
        bg: 'bg-rose-950/60',
        border: 'border-rose-800/80',
        text: 'text-rose-400'
      };
    case 'Rescue Team':
      return {
        bg: 'bg-amber-950/60',
        border: 'border-amber-800/80',
        text: 'text-amber-400'
      };
    case 'Disaster Management Team':
      return {
        bg: 'bg-indigo-950/60',
        border: 'border-indigo-800/80',
        text: 'text-indigo-400'
      };
    case 'General Emergency Response Team':
    default:
      return {
        bg: 'bg-cyan-950/60',
        border: 'border-cyan-800/80',
        text: 'text-cyan-400'
      };
  }
}

export const TeamCategoryBadge: React.FC<{
  category: string;
  size?: 'sm' | 'md';
}> = ({ category, size = 'sm' }) => {
  const Icon = getTeamCategoryIcon(category);
  const colors = getTeamCategoryColor(category);

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${colors.bg} ${colors.border} ${colors.text} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } whitespace-nowrap`}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{category}</span>
    </span>
  );
};

export const TeamAvailabilityBadge: React.FC<{
  availability: TeamAvailability | string;
  size?: 'sm' | 'md';
}> = ({ availability, size = 'sm' }) => {
  const isAvailable = availability === 'Available';
  const isBusy = availability === 'Busy' || availability === 'Assigned';

  let colorClass = 'text-slate-400 bg-slate-900 border-slate-700';
  let dotColor = 'bg-slate-500';
  let label = 'Unavailable';

  if (isAvailable) {
    colorClass = 'text-emerald-300 bg-emerald-950/70 border-emerald-700/80';
    dotColor = 'bg-emerald-400';
    label = 'Available';
  } else if (isBusy) {
    colorClass = 'text-amber-300 bg-amber-950/70 border-amber-700/80';
    dotColor = 'bg-amber-400 animate-pulse';
    label = 'Busy';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono font-medium rounded border ${colorClass} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } whitespace-nowrap`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{label}</span>
    </span>
  );
};

export { TeamCategoryBadge as TeamBadge };
