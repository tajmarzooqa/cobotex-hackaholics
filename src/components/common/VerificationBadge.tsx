import React from 'react';
import {
  CheckCircle2,
  Clock,
  HelpCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { VerificationStatus } from '../../types';

export const VerificationBadge: React.FC<{
  status: VerificationStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}> = ({ status, showIcon = true, size = 'sm' }) => {
  let colorClass = 'text-slate-300 bg-slate-800/80 border-slate-700'; // Default neutral grey for Unverified
  let Icon = HelpCircle;
  let indicatorColor = 'bg-slate-400';

  if (status === 'Verified') {
    // Green for Verified
    colorClass = 'text-emerald-300 bg-emerald-950/70 border-emerald-700/70';
    Icon = CheckCircle2;
    indicatorColor = 'bg-emerald-400';
  } else if (status === 'Under Review') {
    // Amber for Under Review
    colorClass = 'text-amber-300 bg-amber-950/70 border-amber-700/70';
    Icon = Clock;
    indicatorColor = 'bg-amber-400 animate-pulse';
  } else if (status === 'Unable to Verify') {
    // Subtle slate-rose for Unable to Verify
    colorClass = 'text-slate-400 bg-slate-900 border-slate-700';
    Icon = XCircle;
    indicatorColor = 'bg-slate-500';
  } else {
    // Unverified: Neutral grey
    colorClass = 'text-slate-300 bg-slate-800/80 border-slate-700';
    Icon = HelpCircle;
    indicatorColor = 'bg-slate-400';
  }

  const sizeClass = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${colorClass} ${sizeClass} whitespace-nowrap font-mono`}
    >
      {showIcon && <span className={`w-1.5 h-1.5 rounded-full ${indicatorColor}`} aria-hidden="true" />}
      <span>{status}</span>
    </span>
  );
};
