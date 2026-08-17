"use client";

import { FatigueRisk } from "@/lib/mockData";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

interface FatigueRiskGaugeProps {
  risk: FatigueRisk;
  size?: 'sm' | 'md' | 'lg';
}

export default function FatigueRiskGauge({ risk, size = 'md' }: FatigueRiskGaugeProps) {
  const { level, trend, band } = risk;

  // Calculate arc parameters
  const radius = size === 'lg' ? 80 : size === 'md' ? 60 : 40;
  const strokeWidth = size === 'lg' ? 12 : size === 'md' ? 10 : 8;
  const circumference = radius * Math.PI; // Half circle
  const offset = circumference - (level / 100) * circumference;

  const bandColors = {
    LOW: 'text-green-400',
    MODERATE: 'text-amber-400',
    HIGH: 'text-orange-400',
    CRITICAL: 'text-red-400',
  };

  const trendIcons = {
    INCREASING: <TrendingUp size={14} className="text-red-400" />,
    DECREASING: <TrendingDown size={14} className="text-green-400" />,
    STABLE: <Minus size={14} className="text-white/50" />,
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Arc Gauge */}
      <div className="relative">
        <svg
          width={radius * 2 + strokeWidth}
          height={radius + strokeWidth}
          className="overflow-visible"
        >
          {/* Background Arc */}
          <path
            d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Progress Arc */}
          <path
            d={`M ${strokeWidth / 2} ${radius + strokeWidth / 2} A ${radius} ${radius} 0 0 1 ${radius * 2 + strokeWidth / 2} ${radius + strokeWidth / 2}`}
            fill="none"
            stroke={
              band === 'LOW' ? '#4ade80' :
              band === 'MODERATE' ? '#fbbf24' :
              band === 'HIGH' ? '#fb923c' :
              '#ef4444'
            }
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>

        {/* Center Value */}
        <div className="absolute left-1/2 top-2/3 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="font-mono text-4xl font-bold text-white">{level}%</div>
        </div>
      </div>

      {/* Band & Trend */}
      <div className="text-center">
        <div className={`text-sm font-bold ${bandColors[band]}`}>
          {band}
        </div>
        <div className="mt-1 flex items-center justify-center gap-1 text-xs text-white/50">
          {trendIcons[trend]}
          <span className="uppercase">{trend}</span>
        </div>
      </div>
    </div>
  );
}
