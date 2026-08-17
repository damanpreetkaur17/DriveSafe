"use client";

import { DriverState } from "@/lib/mockData";

interface DriverStateIndicatorProps {
  state: DriverState;
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
}

export default function DriverStateIndicator({
  state,
  confidence,
  size = 'md'
}: DriverStateIndicatorProps) {

  const stateColors = {
    ALERT: {
      bg: 'bg-green-500/20',
      ring: 'ring-green-500/50',
      text: 'text-green-400',
      border: 'border-green-500/30',
    },
    DROWSY: {
      bg: 'bg-amber-500/20',
      ring: 'ring-amber-500/50',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    FATIGUED: {
      bg: 'bg-red-500/20',
      ring: 'ring-red-500/50',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
  };

  const sizes = {
    sm: { container: 'h-24 w-24', ring: 'h-20 w-20', dot: 'h-3 w-3', text: 'text-xs', conf: 'text-[10px]' },
    md: { container: 'h-32 w-32', ring: 'h-28 w-28', dot: 'h-4 w-4', text: 'text-sm', conf: 'text-xs' },
    lg: { container: 'h-48 w-48', ring: 'h-44 w-44', dot: 'h-6 w-6', text: 'text-lg', conf: 'text-sm' },
  };

  const colors = stateColors[state];
  const sizeClasses = sizes[size];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Circular Indicator */}
      <div className={`relative flex items-center justify-center ${sizeClasses.container}`}>
        {/* Outer Ring with Animation */}
        <div className={`absolute ${sizeClasses.ring} animate-pulse rounded-full border-2 ${colors.border} opacity-30`} />

        {/* Main Circle */}
        <div className={`relative flex ${sizeClasses.container} items-center justify-center rounded-full border-2 ${colors.border} ${colors.bg}`}>
          <div className={`${sizeClasses.dot} rounded-full ${colors.text} bg-current`} />
        </div>
      </div>

      {/* State Label */}
      <div className="text-center">
        <div
          style={{ fontFamily: "'Orbitron', sans-serif" }}
          className={`font-bold tracking-wider ${colors.text} ${sizeClasses.text}`}
        >
          {state}
        </div>
        <div className={`mt-1 ${sizeClasses.conf} text-white/40`}>
          {Math.round(confidence * 100)}% confidence
        </div>
      </div>
    </div>
  );
}
