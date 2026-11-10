import React from 'react';
import {
  Truck,
  Flame,
  HeartPulse,
  LifeBuoy,
  ShieldCheck,
  Radio,
  AlertCircle,
  LucideIcon
} from 'lucide-react';
import { ResourceType, ResourceStatus } from '../../types';

export const getResourceTypeIcon = (type: ResourceType): LucideIcon => {
  switch (type) {
    case 'Ambulance':
      return HeartPulse;
    case 'Fire response unit':
      return Flame;
    case 'Medical response team':
      return ShieldCheck;
    case 'Rescue team':
      return LifeBuoy;
    default:
      return Truck;
  }
};

export const getResourceTypeColor = (type: ResourceType): { text: string; bg: string; border: string; accent: string } => {
  switch (type) {
    case 'Ambulance':
      return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', accent: '#06b6d4' };
    case 'Fire response unit':
      return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', accent: '#f43f5e' };
    case 'Medical response team':
      return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', accent: '#10b981' };
    case 'Rescue team':
      return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', accent: '#f59e0b' };
    default:
      return { text: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30', accent: '#94a3b8' };
  }
};

export const ResourceStatusBadge: React.FC<{
  status: ResourceStatus;
  assignedIncidentId?: string;
  showIcon?: boolean;
}> = ({ status, assignedIncidentId, showIcon = true }) => {
  let colorClass = 'text-slate-300 bg-slate-800/80 border-slate-700';
  let indicatorColor = 'bg-slate-400';

  if (status === 'Available') {
    colorClass = 'text-emerald-300 bg-emerald-950/70 border-emerald-700/60';
    indicatorColor = 'bg-emerald-400';
  } else if (status === 'Assigned') {
    colorClass = 'text-blue-300 bg-blue-950/70 border-blue-700/60';
    indicatorColor = 'bg-blue-400 animate-pulse';
  } else if (status === 'Unavailable') {
    colorClass = 'text-slate-400 bg-slate-900 border-slate-700';
    indicatorColor = 'bg-slate-500';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded border ${colorClass} whitespace-nowrap font-mono`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`} aria-hidden="true" />}
      <span>{status}</span>
      {status === 'Assigned' && assignedIncidentId && (
        <span className="text-[10px] text-blue-200/80 font-normal">({assignedIncidentId})</span>
      )}
    </span>
  );
};
