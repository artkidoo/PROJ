import React, { useMemo } from 'react';
import { BarChart3, CheckCircle2, Clock, FileCheck, Layers } from 'lucide-react';
import type { MarketingAsset } from '../../../types/brandRoom';
import { computeBrandRoomAnalytics } from '../../../lib/brandRoomService';

interface MarketingAnalyticsPanelProps {
  assets: MarketingAsset[];
}

export const MarketingAnalyticsPanel: React.FC<MarketingAnalyticsPanelProps> = ({
  assets,
}) => {
  const metrics = useMemo(() => computeBrandRoomAnalytics(assets), [assets]);

  const maxPlatformCount = Math.max(
    1,
    ...metrics.platformDistribution.map(p => p.count),
  );
  const maxPillarCount = Math.max(
    1,
    ...metrics.pillarDistribution.map(p => p.count),
  );

  return (
    <div className="space-y-6">
      <div className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-[#FF1E1E]">
            Verified Internal Production Telemetry
          </p>
          <h3 className="mt-1 text-base font-bold text-white">
            KeedoHub Marketing Operations Analytics
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            All metrics below reflect live Firestore Brand Room assets, export files, and publishing workflow states. External social reach/impressions are intentionally omitted until verified platform APIs are connected.
          </p>
        </div>
        <span className="text-xs font-mono text-neutral-400 tabular-nums shrink-0">
          Live Snapshot · {metrics.totalAssets} Assets
        </span>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total Marketing Assets', value: metrics.totalAssets, icon: Layers },
          { label: 'Draft Designs', value: metrics.draftCount, icon: Clock },
          { label: 'Approved Designs', value: metrics.approvedCount, icon: FileCheck },
          { label: 'Scheduled Content', value: metrics.scheduledCount, icon: BarChart3 },
          { label: 'Published Content', value: metrics.publishedCount, icon: CheckCircle2 },
          { label: 'Total Asset Reuses', value: metrics.totalReuses, icon: Layers },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="border border-[#1E1E1E] bg-[#0B0B0B] p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-neutral-500">
                <span className="text-[11px] font-mono leading-tight">{stat.label}</span>
                <Icon size={14} className="text-[#FF1E1E] shrink-0" />
              </div>
              <div className="text-2xl font-black text-white font-mono tabular-nums">
                {stat.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Platform & Pillar Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <h4 className="text-sm font-bold text-white">Platform Distribution</h4>
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {metrics.totalExportFiles} Export Files Stored
            </span>
          </div>
          {metrics.platformDistribution.length === 0 ? (
            <p className="text-xs text-neutral-400">
              No marketing assets created yet. Generate or upload assets in Marketing Design Studio or Social Media Library.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.platformDistribution.map(row => (
                <div key={row.platform} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white">{row.platform}</span>
                    <span className="font-mono text-neutral-400 tabular-nums">
                      {row.count} asset{row.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#181818]">
                    <div
                      className="h-full bg-[#FF1E1E]"
                      style={{ width: `${Math.round((row.count / maxPlatformCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
            <h4 className="text-sm font-bold text-white">Content Pillar Distribution</h4>
            <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
              {metrics.pillarDistribution.length} Active Pillars
            </span>
          </div>
          {metrics.pillarDistribution.length === 0 ? (
            <p className="text-xs text-neutral-400">
              Content pillar distribution updates live as assets are created.
            </p>
          ) : (
            <div className="space-y-3">
              {metrics.pillarDistribution.map(row => (
                <div key={row.pillarName} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-white truncate pr-2">
                      {row.pillarName}
                    </span>
                    <span className="font-mono text-neutral-400 tabular-nums shrink-0">
                      {row.count}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-[#181818]">
                    <div
                      className="h-full bg-white"
                      style={{ width: `${Math.round((row.count / maxPillarCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Publishing Activity Table */}
      <section className="border border-[#1E1E1E] bg-[#0B0B0B] p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-3">
          <h4 className="text-sm font-bold text-white">Recent Publishing Activity</h4>
          <span className="text-[11px] font-mono text-neutral-400 tabular-nums">
            {metrics.publishedCount} Published
          </span>
        </div>

        {metrics.recentPublished.length === 0 ? (
          <p className="text-xs text-neutral-400">
            No items marked Published yet. Use Publishing Management or Content Calendar to record live dispatches.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E1E1E] text-[11px] font-mono text-neutral-500">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Platform</th>
                  <th className="py-2 pr-3">Pillar</th>
                  <th className="py-2 pr-3">Published At</th>
                  <th className="py-2">Live Reference</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentPublished.map(item => (
                  <tr key={item.id} className="border-b border-[#141414]">
                    <td className="py-2.5 pr-3 font-medium text-white">{item.title}</td>
                    <td className="py-2.5 pr-3 text-neutral-300">{item.platform}</td>
                    <td className="py-2.5 pr-3 text-neutral-400">{item.contentPillarName}</td>
                    <td className="py-2.5 pr-3 font-mono text-neutral-400 tabular-nums">
                      {new Date(item.publishedAt || item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 font-mono text-[#FF1E1E] truncate max-w-[220px]">
                      {item.publishedUrl || 'Manual Publish Logged'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
