'use client';

import { Suspense, startTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Scale, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompareTab } from '@/components/estimator/compare-tab';
import { ForecastTab } from '@/components/estimator/forecast-tab';

type EstimatorTab = 'compare' | 'forecast';

function getActiveTab(value: string | null): EstimatorTab {
  return value === 'forecast' ? 'forecast' : 'compare';
}

function EstimatorPageContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = getActiveTab(searchParams.get('tab'));

  function handleTabChange(value: string) {
    const nextTab = getActiveTab(value);
    const nextParams = new URLSearchParams(searchParams.toString());

    if (nextTab === 'compare') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', nextTab);
    }

    const nextQuery = nextParams.toString();

    startTransition(() => {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Cost Estimator"
        description="Forecast your spending and compare model pricing across providers."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="border border-zinc-800 bg-zinc-900/50 p-1">
          <TabsTrigger
            value="compare"
            className="gap-1.5 text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            <Scale className="h-4 w-4" aria-hidden="true" />
            Compare Models
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="gap-1.5 text-zinc-500 data-[state=active]:bg-zinc-800 data-[state=active]:text-white"
          >
            <TrendingUp className="h-4 w-4" aria-hidden="true" />
            Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="compare" className="mt-6">
          <CompareTab />
        </TabsContent>
        <TabsContent value="forecast" className="mt-6">
          <ForecastTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function EstimatorPage() {
  return (
    <Suspense
      fallback={
        <div className="animate-fade-in space-y-6">
          <PageHeader
            title="Cost Estimator"
            description="Forecast your spending and compare model pricing across providers."
          />
        </div>
      }
    >
      <EstimatorPageContent />
    </Suspense>
  );
}
