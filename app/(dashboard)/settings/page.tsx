'use client';

import { useEffect, useId, useState } from 'react';
import { PageHeader, ErrorState, SkeletonCard } from '@/components/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useProfile, useUpdateProfile } from '@/hooks/use-profile';

export default function SettingsPage() {
  const { data: profile, isLoading, error, refetch } = useProfile();
  const updateMutation = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');

  const fullNameId = useId();
  const companyNameId = useId();

  useEffect(() => {
    if (!profile) return;

    setFullName(profile.full_name ?? '');
    setCompanyName(profile.company_name ?? '');
  }, [profile]);

  const savedFullName = profile?.full_name ?? '';
  const savedCompanyName = profile?.company_name ?? '';
  const isDirty = fullName !== savedFullName || companyName !== savedCompanyName;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    updateMutation.mutate({
      full_name: fullName.trim() || undefined,
      company_name: companyName.trim() || null,
    });
  }

  if (isLoading) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Profile" description="Manage your personal information." />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Profile" description="Manage your personal information." />
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Profile" description="Manage your personal information." />

      <Card className="glass-card max-w-3xl border-zinc-800/70 bg-zinc-950/70 shadow-none">
        <CardHeader className="space-y-1">
          <CardTitle className="text-lg text-white">Workspace Owner Profile</CardTitle>
          <CardDescription className="text-sm text-zinc-500">
            These details appear in account emails and identify the company that owns this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <label htmlFor={fullNameId} className="text-sm font-medium text-zinc-200">
                  Full Name
                </label>
                <Input
                  id={fullNameId}
                  name="full_name"
                  autoComplete="name"
                  placeholder="Ada Lovelace"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  Use your real name so billing emails and workspace ownership screens stay clear.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor={companyNameId} className="text-sm font-medium text-zinc-200">
                  Company Name
                </label>
                <Input
                  id={companyNameId}
                  name="company_name"
                  autoComplete="organization"
                  placeholder="Example AI"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  className="border-zinc-800 bg-zinc-900/80 text-zinc-100 placeholder:text-zinc-500"
                />
                <p className="text-xs text-zinc-500">
                  This is the company-scoped workspace name used across billing, reports, and alerts.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-800/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                Changes save to the profiles table and refresh the dashboard immediately.
              </p>
              <Button
                type="submit"
                disabled={updateMutation.isPending || !isDirty}
                className="bg-brand-600 text-white hover:bg-brand-700"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
