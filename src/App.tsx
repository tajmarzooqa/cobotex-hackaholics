/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { IncidentProvider, useIncidents } from './context/IncidentContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CriticalAlertBanner } from './components/dashboard/CriticalAlertBanner';
import { StatCards } from './components/dashboard/StatCards';
import { CategoryChart } from './components/dashboard/CategoryChart';
import { SeverityBreakdown } from './components/dashboard/SeverityBreakdown';
import { RecentIncidentsTable } from './components/dashboard/RecentIncidentsTable';
import { IncidentTable } from './components/incidents/IncidentTable';
import { IncidentDetailModal } from './components/incidents/IncidentDetailModal';
import { DeleteConfirmModal } from './components/incidents/DeleteConfirmModal';
import { ReportForm } from './components/report/ReportForm';
import { TacticalMap } from './components/map/TacticalMap';
import { UnitsManager } from './components/units/UnitsManager';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { VerificationDashboardSummary } from './components/dashboard/VerificationDashboardSummary';
import { VerificationPanel } from './components/verification/VerificationPanel';
import { DispatchCenter } from './components/dispatch/DispatchCenter';
import { SOSEmergencyHero } from './components/sos/SOSEmergencyHero';
import { SOSTriggerModal } from './components/sos/SOSTriggerModal';
import { EmergencyCategory, SeverityLevel, IncidentStatus, Incident } from './types';

const MainContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    selectedIncident,
    setSelectedIncident,
    deleteIncident
  } = useIncidents();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);

  // Filter cross-navigation state from dashboard cards
  const [tableCategoryFilter, setTableCategoryFilter] = useState<EmergencyCategory | 'ALL'>('ALL');
  const [tableSeverityFilter, setTableSeverityFilter] = useState<SeverityLevel | 'ALL'>('ALL');
  const [tableStatusFilter, setTableStatusFilter] = useState<IncidentStatus | 'ALL' | 'ACTIVE'>('ALL');

  const handleStatCardFilter = (type: string, val: string) => {
    if (type === 'severity') {
      setTableSeverityFilter(val as SeverityLevel);
      setTableStatusFilter('ALL');
      setTableCategoryFilter('ALL');
    } else if (type === 'status') {
      setTableStatusFilter(val as any);
      setTableSeverityFilter('ALL');
      setTableCategoryFilter('ALL');
    } else {
      setTableCategoryFilter('ALL');
      setTableSeverityFilter('ALL');
      setTableStatusFilter('ALL');
    }
  };

  const handleCategorySelect = (cat: EmergencyCategory) => {
    setTableCategoryFilter(cat);
    setTableSeverityFilter('ALL');
    setTableStatusFilter('ALL');
  };

  const handleSeveritySelect = (sev: SeverityLevel) => {
    setTableSeverityFilter(sev);
    setTableCategoryFilter('ALL');
    setTableStatusFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onActivateSOS={() => setIsSOSModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Active View Rendering */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* One-Tap SOS Emergency Activation Hero Button */}
              <SOSEmergencyHero onActivateSOS={() => setIsSOSModalOpen(true)} />

              {/* Critical Alert Bar */}
              <CriticalAlertBanner />

              {/* Stat KPI Cards */}
              <StatCards onFilterClick={handleStatCardFilter} />

              {/* Verification & Duplicate Status Strip */}
              <VerificationDashboardSummary />

              {/* Visual Breakdown Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryChart onSelectCategory={handleCategorySelect} />
                <SeverityBreakdown onSelectSeverity={handleSeveritySelect} />
              </div>

              {/* Recent Incidents Feed */}
              <RecentIncidentsTable />
            </div>
          )}

          {activeTab === 'dispatch' && (
            <div className="animate-in fade-in duration-200">
              <DispatchCenter />
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="animate-in fade-in duration-200">
              <VerificationPanel />
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="animate-in fade-in duration-200">
              <IncidentTable
                initialCategoryFilter={tableCategoryFilter}
                initialSeverityFilter={tableSeverityFilter}
                initialStatusFilter={tableStatusFilter}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <div className="animate-in fade-in duration-200">
              <TacticalMap />
            </div>
          )}

          {activeTab === 'report' && (
            <div className="animate-in fade-in duration-200">
              <ReportForm />
            </div>
          )}

          {activeTab === 'units' && (
            <div className="animate-in fade-in duration-200">
              <UnitsManager />
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="animate-in fade-in duration-200">
              <AnalyticsView />
            </div>
          )}
        </main>
      </div>

      {/* Global Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onDeleteRequest={(inc) => {
          setIncidentToDelete(inc);
        }}
      />

      {/* Global Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={!!incidentToDelete}
        incidentId={incidentToDelete?.id || ''}
        incidentTitle={incidentToDelete?.title || ''}
        onCancel={() => setIncidentToDelete(null)}
        onConfirm={() => {
          if (incidentToDelete) {
            deleteIncident(incidentToDelete.id);
            setIncidentToDelete(null);
          }
        }}
      />

      {/* One-Tap SOS Emergency Activation & Intake Modal */}
      <SOSTriggerModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <IncidentProvider>
      <MainContent />
    </IncidentProvider>
  );
}
