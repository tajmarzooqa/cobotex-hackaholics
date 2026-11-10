import React from 'react';
import {
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

interface StatCardsProps {
  onFilterClick?: (filterType: string, value: string) => void;
}

export const StatCards: React.FC<StatCardsProps> = ({ onFilterClick }) => {
  const { metrics, setActiveTab } = useIncidents();

  const cards = [
    {
      title: 'Total Incidents',
      value: metrics.total,
      subtitle: metrics.total === 0 ? 'No incidents recorded' : 'Recorded across all sectors',
      icon: FileText,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/30',
      filterType: 'status',
      filterValue: 'ALL'
    },
    {
      title: 'Critical Incidents',
      value: metrics.critical,
      subtitle: metrics.critical > 0 ? 'Immediate action required' : 'No active critical alerts',
      icon: AlertTriangle,
      iconColor: 'text-rose-400',
      iconBg: 'bg-rose-500/10 border-rose-500/30',
      isCritical: metrics.critical > 0,
      filterType: 'severity',
      filterValue: 'Critical'
    },
    {
      title: 'Pending / In Progress',
      value: metrics.pending + metrics.inProgress,
      subtitle: `${metrics.pending} pending · ${metrics.inProgress} active dispatch`,
      icon: Clock,
      iconColor: 'text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      filterType: 'status',
      filterValue: 'ACTIVE'
    },
    {
      title: 'Resolved Incidents',
      value: metrics.resolved,
      subtitle: metrics.total === 0 ? '0% resolution rate' : `${Math.round((metrics.resolved / metrics.total) * 100)}% resolution rate`,
      icon: CheckCircle2,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      filterType: 'status',
      filterValue: 'Resolved'
    },
    {
      title: 'People Affected',
      value: metrics.totalPeopleAffected,
      subtitle: metrics.totalPeopleAffected === 0 ? '0 verified casualties' : `${metrics.totalPeopleAffected} total verified impact`,
      icon: Users,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/30',
      filterType: 'all',
      filterValue: ''
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            onClick={() => {
              if (onFilterClick) {
                onFilterClick(card.filterType, card.filterValue);
              }
              setActiveTab('incidents');
            }}
            className={`cursor-pointer group p-4 rounded-xl bg-slate-900/80 border transition-all duration-150 hover:bg-slate-900 ${
              card.isCritical
                ? 'border-rose-600/50 hover:border-rose-500 shadow-sm shadow-rose-950/40 ring-1 ring-rose-500/20'
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${card.iconBg} ${card.iconColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {card.value}
              </span>
            </div>

            <p className="mt-1.5 text-xs text-slate-400 truncate">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
};
