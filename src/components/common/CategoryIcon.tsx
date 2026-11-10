import React from 'react';
import {
  Flame,
  Car,
  HeartPulse,
  Waves,
  Building2,
  AlertTriangle,
  LucideIcon
} from 'lucide-react';
import { EmergencyCategory, SeverityLevel, IncidentStatus } from '../../types';

export const getCategoryIcon = (category: EmergencyCategory): LucideIcon => {
  switch (category) {
    case 'Fire Emergency':
      return Flame;
    case 'Road Accident':
      return Car;
    case 'Medical Emergency':
      return HeartPulse;
    case 'Flood':
      return Waves;
    case 'Building Collapse':
      return Building2;
    default:
      return AlertTriangle;
  }
};

export const getCategoryColor = (category: EmergencyCategory): { text: string; bg: string; border: string } => {
  switch (category) {
    case 'Fire Emergency':
      return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
    case 'Building Collapse':
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    case 'Road Accident':
      return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' };
    case 'Flood':
      return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
    case 'Medical Emergency':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    default:
      return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
  }
};

export const SeverityBadge: React.FC<{ severity: SeverityLevel; showIcon?: boolean }> = ({
  severity,
  showIcon = true
}) => {
  let colorClass = 'text-slate-300 bg-slate-800/80 border-slate-700';
  let indicatorColor = 'bg-slate-400';

  if (severity === 'Critical') {
    colorClass = 'text-rose-300 bg-rose-950/70 border-rose-700/60';
    indicatorColor = 'bg-rose-500 animate-pulse';
  } else if (severity === 'High') {
    colorClass = 'text-amber-300 bg-amber-950/70 border-amber-700/60';
    indicatorColor = 'bg-amber-500';
  } else if (severity === 'Medium') {
    colorClass = 'text-yellow-200 bg-yellow-950/50 border-yellow-700/50';
    indicatorColor = 'bg-yellow-400';
  } else if (severity === 'Low') {
    colorClass = 'text-emerald-300 bg-emerald-950/50 border-emerald-700/50';
    indicatorColor = 'bg-emerald-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded border ${colorClass} whitespace-nowrap`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`} aria-hidden="true" />}
      <span>{severity}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: IncidentStatus }> = ({ status }) => {
  let colorClass = 'text-slate-300 bg-slate-800/80 border-slate-700';

  if (status === 'Reported') {
    colorClass = 'text-blue-300 bg-blue-950/60 border-blue-700/60';
  } else if (status === 'Pending') {
    colorClass = 'text-amber-300 bg-amber-950/60 border-amber-700/60';
  } else if (status === 'In Progress') {
    colorClass = 'text-cyan-300 bg-cyan-950/60 border-cyan-700/60';
  } else if (status === 'Resolved') {
    colorClass = 'text-emerald-300 bg-emerald-950/60 border-emerald-700/60';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${colorClass} whitespace-nowrap`}
    >
      {status}
    </span>
  );
};
