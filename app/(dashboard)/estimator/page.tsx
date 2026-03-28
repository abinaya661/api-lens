'use client';

import { Scale, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompareTab } from '@/components/estimator/compare-tab';
import { ForecastTab } from '@/components/estimator/forecast-tab';

export default function EstimatorPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Cost Estimator"
        description="Forecast your spending and compare model pricing across providers."
      />

      <Tabs defaultValue="compare" className="w-full">
        <TabsList className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-1">
          <TabsTrigger
            value="compare"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 gap-1.5"
          >
            <Scale className="w-4 h-4" />
            Compare Models
          </TabsTrigger>
          <TabsTrigger
            value="forecast"
            className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white text-zinc-500 gap-1.5"
          >
            <TrendingUp className="w-4 h-4" />
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
