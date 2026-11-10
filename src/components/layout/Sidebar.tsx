import React from 'react';
import {
  LayoutDashboard,
  AlertOctagon,
  MapPin,
  FilePlus,
  Truck,
  BarChart3,
  PhoneCall,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';
import { ActiveTab } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, metrics, generateRandomMockIncident, resetToSampleData } = useIncidents();

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ElementType;
    badge?: number | string;
    badgeAlert?: boolean;
  }> = [
    {
      id: 'dashboard',
      label: 'Command Center',
      icon: LayoutDashboard
    },
    {
      id: 'dispatch',
      label: 'Dispatch Center',
      icon: Radio,
      badge: metrics.unassignedIncidents > 0 ? `${metrics.unassignedIncidents} unassigned` : undefined,
      badgeAlert: metrics.unassignedIncidents > 0
    },
    {
      id: 'incidents',
      label: 'Incident Management',
      icon: AlertOctagon,
      badge: metrics.total,
      badgeAlert: metrics.critical > 0
    },
    {
      id: 'verification',
      label: 'Verification Queue',
      icon: ShieldCheck,
      badge: metrics.requiringReview > 0 ? `${metrics.requiringReview} review` : undefined,
      badgeAlert: metrics.underReview > 0
    },
    {
      id: 'map',
      label: 'Situational Map',
      icon: MapPin,
      badge: `${metrics.pending + metrics.inProgress} active`
    },
    {
      id: 'report',
      label: 'Report Incident',
      icon: FilePlus
    },
    {
      id: 'units',
      label: 'Units & Resources',
      icon: Truck,
      badge: `${metrics.availableResources} ready`
    },
    {
      id: 'analytics',
      label: 'Analytics & Logs',
      icon: BarChart3
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-full lg:h-[calc(100vh-61px)] w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-4 space-y-6 overflow-y-auto">
          {/* Mobile brand header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 lg:hidden">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Navigation</span>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-900 border border-slate-800"
            >
              Close
            </button>
          </div>

          {/* Navigation Links */}
          <div className="space-y-1">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Operations
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded tabular-nums ${
                        item.badgeAlert
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/80 font-bold'
                          : isActive
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Simulator & Tools Quick Card */}
          <div className="pt-2">
            <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-400">
              Dev & Demo Controls
            </div>
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 space-y-2">
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Test emergency dispatching with live simulated incoming reports.
              </p>
              <div className="flex flex-col gap-1.5 pt-1">
                <button
                  onClick={() => {
                    generateRandomMockIncident();
                    setActiveTab('incidents');
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 text-xs font-medium text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/50 rounded-md transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate 911 Report</span>
                </button>
                <button
                  onClick={() => {
                    resetToSampleData();
                    onClose();
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-1.5 px-2.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restore Sample Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950">
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/60">
            <div className="w-8 h-8 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-slate-200 truncate">Central Dispatch</div>
              <div className="text-[10px] text-slate-400 font-mono tabular-nums">911 / (555) 019-9000</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
