"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTimeline, type TimelineItem } from "@/app/hooks/useTimeline";
import { timeAgo } from "@/app/hooks/useLiveData";
import { FileSearch, Train, Building2, FileText, Clock } from "lucide-react";

const ICON_MAP: Record<string, typeof Clock> = {
  contract: FileSearch,
  transit: Train,
  permit: Building2,
  tender: FileText,
};

export function ActivityFeed({ districtId, open, onOpenChange }: { districtId: number; open: boolean; onOpenChange: (v: boolean) => void }) {
  const { items, loading } = useTimeline(districtId, open);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Clock size={18} className="text-accent" /> Activity Feed
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-0">
          {loading && (
            <div className="text-sm text-muted-foreground text-center py-8">Loading activity...</div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-8">No recent activity</div>
          )}
          {items.map((item: TimelineItem, i: number) => {
            const Icon = ICON_MAP[item.icon] || Clock;
            return (
              <div key={item.id} className="flex gap-3 py-3 border-b border-border last:border-0">
                <div className="shrink-0 mt-0.5">
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                    <Icon size={14} className="text-accent" />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-tight truncate">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(item.timestamp)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
