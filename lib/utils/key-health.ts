import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock3,
  Shield,
  ShieldX,
  XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ApiKey } from '@/types/database';

interface StatusConfig {
  icon: LucideIcon;
  color: string;
  bg: string;
  label: string;
}

function isUnsupportedReason(reason: string | null): boolean {
  if (!reason) return false;

  const normalized = reason.toLowerCase();
  return normalized.includes('not supported')
    || normalized.includes('not trackable')
    || normalized.includes('management api key')
    || normalized.includes('admin api key')
    || normalized.includes('cannot track')
    || normalized.includes('usage-capable')
    || normalized.includes('usage/billing');
}

export function getHealthConfig(key: ApiKey): StatusConfig {
  if (!key.is_active) {
    if (key.last_failure_reason) {
      return {
        icon: ShieldX,
        color: 'text-red-400',
        bg: 'bg-red-500/10 border-red-500/20',
        label: 'Inactive',
      };
    }

    return {
      icon: XCircle,
      color: 'text-zinc-400',
      bg: 'bg-zinc-500/10 border-zinc-500/20',
      label: 'Revoked',
    };
  }

  if (!key.is_valid) {
    return {
      icon: ShieldX,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Inactive',
    };
  }

  if (key.consecutive_failures > 0) {
    return {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/20',
      label: 'Warning',
    };
  }

  return {
    icon: Shield,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    label: 'Healthy',
  };
}

export function getVerificationConfig(key: ApiKey): StatusConfig {
  if (key.is_valid && key.last_validated) {
    return {
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      label: 'Verified',
    };
  }

  if (key.last_validated) {
    return {
      icon: ShieldX,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
      label: 'Failed',
    };
  }

  return {
    icon: Clock3,
    color: 'text-zinc-400',
    bg: 'bg-zinc-500/10 border-zinc-500/20',
    label: 'Unchecked',
  };
}

export function getTrackabilityConfig(key: ApiKey): StatusConfig {
  if (key.has_usage_api) {
    return {
      icon: CheckCircle2,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      label: 'Trackable',
    };
  }

  if (isUnsupportedReason(key.last_failure_reason)) {
    return {
      icon: Ban,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      label: 'Unsupported',
    };
  }

  return {
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    label: 'Not Trackable',
  };
}
