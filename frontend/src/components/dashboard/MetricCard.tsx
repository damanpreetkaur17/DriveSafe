interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  children?: React.ReactNode;
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  size = 'md',
  children
}: MetricCardProps) {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  };

  const valueClasses = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  };

  return (
    <div className={`rounded-xl border border-white/10 bg-[#07090E] ${sizeClasses[size]}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {label}
        </span>
        {trend && (
          <span className={`text-xs ${
            trend === 'up' ? 'text-red-400' :
            trend === 'down' ? 'text-green-400' :
            'text-white/50'
          }`}>
            {trend === 'up' ? 'â†‘' : trend === 'down' ? 'â†“' : 'â†’'}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`font-mono ${valueClasses[size]} font-semibold text-white`}>
          {value}
        </span>
        {unit && (
          <span className="text-sm text-white/40">{unit}</span>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
