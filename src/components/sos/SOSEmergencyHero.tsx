import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Radio,
  MapPin,
  AlertTriangle,
  Lock,
  ChevronRight,
  Sparkles,
  Zap,
  Video
} from 'lucide-react';
import { useIncidents } from '../../context/IncidentContext';

interface SOSEmergencyHeroProps {
  onActivateSOS: () => void;
}

export const SOSEmergencyHero: React.FC<SOSEmergencyHeroProps> = ({ onActivateSOS }) => {
  const { metrics, incidents } = useIncidents();
  const [hasGeolocation, setHasGeolocation] = useState<boolean | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  // Check if browser geolocation is supported
  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setHasGeolocation(true);
    } else {
      setHasGeolocation(false);
    }
  }, []);

  const activeSOS = incidents.filter(i => i.isSOS && i.status !== 'Resolved');

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-rose-950/70 via-slate-900 to-slate-950 border-2 border-rose-600/70 p-5 sm:p-7 shadow-2xl shadow-rose-950/50">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
        {/* Left Information Section */}
        <div className="space-y-3.5 text-center lg:text-left max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-600/20 border border-rose-500/40 text-rose-300 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>One-Tap SOS Emergency Activation System</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Need Immediate Emergency Help?
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tap the emergency beacon below to immediately transmit an alert with real-time GPS location and live video evidence to the ResQ incident coordination desk.
          </p>

          {/* Quick status telemetry pills */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1 text-xs text-slate-300">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px]">
              <MapPin className="w-3.5 h-3.5 text-rose-400" />
              <span>
                {hasGeolocation ? 'Browser GPS Ready' : 'Manual GPS Fallback'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px]">
              <Video className="w-3.5 h-3.5 text-cyan-400" />
              <span>Video Evidence Ready</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Dispatch Queue</span>
            </div>

            {activeSOS.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/80 border border-rose-700/80 text-rose-300 font-bold font-mono text-[11px] animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>{activeSOS.length} Active SOS Beacon{activeSOS.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: The Giant Red SOS Button */}
        <div className="flex flex-col items-center justify-center relative py-2">
          {/* Animated concentric pulse rings */}
          <div className="absolute w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-rose-600/20 animate-ping pointer-events-none" />
          <div className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border border-rose-500/40 animate-pulse pointer-events-none" />

          {/* The interactive SOS Button */}
          <button
            onClick={onActivateSOS}
            onMouseDown={() => setIsPressing(true)}
            onMouseUp={() => setIsPressing(false)}
            onTouchStart={() => setIsPressing(true)}
            onTouchEnd={() => setIsPressing(false)}
            className={`relative group w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white font-extrabold shadow-2xl shadow-rose-900/80 border-4 border-rose-400/80 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-4 focus:ring-rose-500/50 ${
              isPressing
                ? 'scale-95 shadow-inner bg-rose-800'
                : 'hover:scale-105 hover:shadow-rose-600/60 active:scale-95'
            }`}
            aria-label="Activate One-Tap Emergency SOS"
          >
            {/* Top icon */}
            <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7 text-white drop-shadow-md group-hover:scale-110 transition-transform mb-0.5" />

            {/* Giant SOS text */}
            <span className="text-3xl sm:text-4xl tracking-wider font-black font-mono drop-shadow-lg text-white">
              SOS
            </span>

            {/* Subtitle label */}
            <span className="text-[10px] sm:text-[11px] tracking-tight font-bold uppercase text-rose-100 max-w-[120px] text-center leading-tight mt-1 px-1">
              Tap For Emergency Help
            </span>
          </button>

          {/* Hint caption under button */}
          <span className="mt-3 text-[11px] font-medium text-rose-300/80 tracking-wide flex items-center gap-1 font-mono">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>Single tap triggers immediate response</span>
          </span>
        </div>
      </div>

      {/* Safety & Demonstration disclaimer notice */}
      <div className="mt-5 pt-3.5 border-t border-rose-800/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 text-center sm:text-left">
          <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span>
            <strong className="text-slate-300 font-semibold">Testing / Demonstration Mode:</strong> Alerts are logged in the ResQ operational coordination database for response triage. In a real life-threatening emergency, always contact local emergency services (911 / 112).
          </span>
        </div>
      </div>
    </div>
  );
};
