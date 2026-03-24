import { Shield, ShieldX, XCircle, AlertTriangle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ApiKey } from '@/types/database';

interface HealthConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

export function getHealthConfig(key: ApiKey): HealthConfig {
  if (!key.is_active) return { icon: XCircle, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', label: 'Revoked' };
  if (!key.is_valid) return { icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'Error' };
  if (key.consecutive_failures > 0) return { icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Warning' };
  return { icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: 'Healthy' };
}
