import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
}

export default function StatCard({ label, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className="rounded-lg border border-netflix-border bg-netflix-dark p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-netflix-mid-gray">{label}</p>
          <p className="mt-1 text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-netflix-light-gray">{subtitle}</p>}
        </div>
        <div className="rounded-lg p-2.5" style={{ backgroundColor: `${color}20` }}>
          <Icon size={22} style={{ color }} />
        </div>
      </div>
    </div>
  );
}
