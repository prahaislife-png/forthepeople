"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import { useState } from "react";

interface ShareCardDialogProps {
  tileId: string;
  tileTitle: string;
  districtName: string;
  districtId: number;
  statValue: string;
  statLabel: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ShareCardDialog({ tileId, tileTitle, districtName, districtId, statValue, statLabel, open, onOpenChange }: ShareCardDialogProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/share/praha-${districtId}/${tileId}`;
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      await navigator.share({ title: `${tileTitle} — ${districtName}`, url: shareUrl });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Share2 size={18} className="text-accent" /> Share Stat</DialogTitle>
          <DialogDescription>Share this data card with others</DialogDescription>
        </DialogHeader>

        {/* Preview Card */}
        <div className="mx-auto w-[320px] rounded-xl overflow-hidden border border-border shadow-lg my-4">
          <div className="bg-[#3d4f3d] dark:bg-[#1a2e1a] px-5 py-3">
            <p className="text-white text-xs font-medium">{districtName}</p>
          </div>
          <div className="bg-card px-5 py-5 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{tileTitle}</p>
            <p className="text-4xl font-black text-foreground mt-2">{statValue}</p>
            <p className="text-sm text-muted-foreground mt-1">{statLabel}</p>
          </div>
          <div className="bg-secondary px-5 py-2 flex justify-between items-center">
            <span className="text-[10px] font-bold text-foreground">Move<span className="text-accent">Prague</span></span>
            <span className="text-[10px] text-muted-foreground">{today}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-secondary transition-colors"
          >
            {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy link"}
          </button>
          {typeof navigator !== "undefined" && "share" in navigator && (
            <button
              onClick={handleNativeShare}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#3d4f3d] dark:bg-accent text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Share2 size={14} /> Share
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
