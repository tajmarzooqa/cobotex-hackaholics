import React, { useState } from 'react';
import { EmergencyCategory } from '../../types';
import { useIncidents } from '../../context/IncidentContext';
import { getCategoryIcon, getCategoryColor } from '../common/CategoryIcon';

interface CategoryChartProps {
  onSelectCategory?: (category: EmergencyCategory) => void;
}

export const CategoryChart: React.FC<CategoryChartProps> = ({ onSelectCategory }) => {
  const { metrics, setActiveTab } = useIncidents();
  const [hoveredCategory, setHoveredCategory] = useState<EmergencyCategory | null>(null);

  const categories: EmergencyCategory[] = [
    'Fire Emergency',
    'Building Collapse',
    'Road Accident',
    'Flood',
    'Medical Emergency',
    'Other Emergencies'
  ];

  const total = metrics.total || 1;

  // Colors for visualization
  const categoryPalette: Record<EmergencyCategory, string> = {
    'Fire Emergency': '#f43f5e', // rose-500
    'Building Collapse': '#f59e0b', // amber-500
    'Road Accident': '#fb923c', // orange-400
    'Flood': '#06b6d4', // cyan-500
    'Medical Emergency': '#10b981', // emerald-500
    'Other Emergencies': '#a855f7' // purple-500
  };

  // Calculate donut segments
  let cumulativePercentage = 0;
  const segments = categories.map(cat => {
    const count = metrics.categoryCounts[cat] || 0;
    const percentage = (count / total) * 100;
    const startAngle = (cumulativePercentage / 100) * 360;
    cumulativePercentage += percentage;
    const endAngle = (cumulativePercentage / 100) * 360;
    return {
      category: cat,
      count,
      percentage: Math.round(percentage),
      startAngle,
      endAngle,
      color: categoryPalette[cat]
    };
  });

  // SVG Donut Path generator
  const getCoordinatesForAngle = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180.0;
    return {
      x: 100 + radius * Math.cos(rad),
      y: 100 + radius * Math.sin(rad)
    };
  };

  const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    // If full circle
    if (endAngle - startAngle >= 359.9) {
      endAngle = 359.99;
    }
    const startOuter = getCoordinatesForAngle(startAngle, outerRadius);
    const endOuter = getCoordinatesForAngle(endAngle, outerRadius);
    const startInner = getCoordinatesForAngle(endAngle, innerRadius);
    const endInner = getCoordinatesForAngle(startAngle, innerRadius);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `
      M ${startOuter.x} ${startOuter.y}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}
      L ${startInner.x} ${startInner.y}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}
      Z
    `;
  };

  const handleCategoryClick = (cat: EmergencyCategory) => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    setActiveTab('incidents');
  };

  return (
    <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">Incidents by Category</h3>
          <p className="text-xs text-slate-400 mt-0.5">Distribution across primary hazard domains</p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-400">
          {metrics.total} recorded
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* SVG Donut */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <div className="relative w-44 h-44">
            <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
              {metrics.total === 0 ? (
                <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" strokeWidth="28" />
              ) : (
                segments.map(seg => {
                  if (seg.count === 0) return null;
                  const isHovered = hoveredCategory === seg.category;
                  const innerR = isHovered ? 52 : 55;
                  const outerR = isHovered ? 83 : 80;
                  return (
                    <path
                      key={seg.category}
                      d={createArc(seg.startAngle, seg.endAngle, innerR, outerR)}
                      fill={seg.color}
                      className="transition-all duration-200 cursor-pointer hover:opacity-90"
                      onMouseEnter={() => setHoveredCategory(seg.category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={() => handleCategoryClick(seg.category)}
                    />
                  );
                })
              )}
            </svg>

            {/* Donut Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {metrics.total === 0 ? (
                <>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Database</span>
                  <span className="text-xl font-bold font-mono text-slate-400 tabular-nums">0</span>
                  <span className="text-[10px] text-slate-400 font-medium">No Incidents</span>
                </>
              ) : hoveredCategory ? (
                <>
                  <span className="text-xs font-semibold text-slate-300 truncate max-w-[110px]">
                    {hoveredCategory.replace(' Emergency', '')}
                  </span>
                  <span className="text-xl font-bold font-mono text-white tabular-nums">
                    {metrics.categoryCounts[hoveredCategory]}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {Math.round(((metrics.categoryCounts[hoveredCategory] || 0) / total) * 100)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Total</span>
                  <span className="text-2xl font-bold font-mono text-white tabular-nums">
                    {metrics.total}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">Incidents</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Category List Breakdown */}
        <div className="md:col-span-7 space-y-2">
          {metrics.total === 0 && (
            <div className="p-3 mb-2 rounded-lg bg-slate-950/60 border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                No incidents reported yet. Categories will populate dynamically upon intake.
              </p>
            </div>
          )}
          {categories.map(cat => {
            const count = metrics.categoryCounts[cat] || 0;
            const pct = metrics.total === 0 ? 0 : Math.round((count / metrics.total) * 100);
            const Icon = getCategoryIcon(cat);
            const colors = getCategoryColor(cat);
            const isHovered = hoveredCategory === cat;

            return (
              <div
                key={cat}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(cat)}
                className={`cursor-pointer flex items-center justify-between p-2 rounded-lg transition-all ${
                  isHovered ? 'bg-slate-800/90 ring-1 ring-slate-700' : 'hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-6 h-6 rounded flex items-center justify-center border shrink-0 ${colors.bg} ${colors.border} ${colors.text}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-slate-200 truncate">
                    {cat}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-16 hidden sm:block bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: categoryPalette[cat]
                      }}
                    />
                  </div>
                  <span className="font-mono text-xs font-semibold text-white tabular-nums w-6 text-right">
                    {count}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums w-8 text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
