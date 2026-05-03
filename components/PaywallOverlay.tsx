"use client";

import { Lock } from "lucide-react";
import Link from "next/link";

interface PaywallOverlayProps {
  districtId: number;
  districtName: string;
}

export function PaywallOverlay({ districtId, districtName }: PaywallOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-md bg-slate-900/60 rounded-2xl">
      <div className="text-center px-8 py-10 max-w-md">
        <div className="mx-auto w-14 h-14 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Unlock {districtName} Report
        </h3>
        <p className="text-slate-400 text-sm mb-6">
          Get the full district analysis with safety scores, housing trends, school rankings,
          and livability rating.
        </p>
        <div className="space-y-3">
          <Link
            href={`/pricing?district=${districtId}`}
            className="block w-full py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Get Full Report — from 199 Kč
          </Link>
          <Link
            href="/pricing"
            className="block text-sm text-slate-400 hover:text-white transition-colors"
          >
            View all plans →
          </Link>
        </div>
      </div>
    </div>
  );
}
