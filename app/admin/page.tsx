"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdmin } from "@/app/hooks/useAdmin";
import { createClient } from "@/app/lib/supabase-browser";
import { DISTRICTS } from "@/app/data/districts";
import {
  Eye, Users, CreditCard, FileText, TrendingUp,
  Activity, ArrowLeft, BarChart3, UserCheck, LogIn,
} from "lucide-react";
import Link from "next/link";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

interface AdminStats {
  totalPageViews: number;
  uniqueVisitors: number;
  paidUsers: number;
  reportPurchases: number;
  totalSignIns: number;
  districtViews: Record<number, number>;
  dailyViews: { date: string; views: number }[];
  recentActivity: {
    id: string;
    event: string;
    userId: string | null;
    metadata: Record<string, unknown>;
    createdAt: string;
  }[];
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      router.push("/");
      return;
    }

    async function fetchStats() {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
      setLoading(false);
    }

    fetchStats();
  }, [isAdmin, adminLoading, router]);

  if (adminLoading || (!isAdmin && !adminLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const districtData = DISTRICTS.map((d) => ({
    name: `P${d.id}`,
    views: stats?.districtViews[d.id] || 0,
  })).sort((a, b) => b.views - a.views);

  const conversionRate = stats && stats.totalPageViews > 0
    ? ((stats.paidUsers / stats.totalPageViews) * 100).toFixed(2)
    : "0";

  const signInRate = stats && stats.totalPageViews > 0
    ? ((stats.totalSignIns / stats.totalPageViews) * 100).toFixed(2)
    : "0";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm">Dashboard</span>
            </Link>
            <h1 className="text-lg font-bold text-foreground">Admin Panel</h1>
          </div>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading || !stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-secondary rounded w-20 mb-3" />
                <div className="h-8 bg-secondary rounded w-16" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={Eye} label="Total Page Views" value={stats.totalPageViews.toLocaleString()} />
              <StatCard icon={Users} label="Unique Visitors" value={stats.uniqueVisitors.toLocaleString()} />
              <StatCard icon={CreditCard} label="Paid Users" value={stats.paidUsers.toLocaleString()} accent />
              <StatCard icon={FileText} label="Report Purchases" value={stats.reportPurchases.toLocaleString()} />
            </div>

            {/* Conversion Funnel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Visitor → Paid</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{conversionRate}%</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn size={14} className="text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Visitor → Signed In</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{signInRate}%</div>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={14} className="text-accent" />
                  <span className="text-xs font-medium text-muted-foreground">Total Sign-ins</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stats.totalSignIns.toLocaleString()}</div>
              </div>
            </div>

            {/* Daily Page Views Chart */}
            {stats.dailyViews.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <BarChart3 size={14} className="text-accent" /> Daily Page Views (Last 30 Days)
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.dailyViews}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="views" stroke="#6b7f5a" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* District Popularity */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Activity size={14} className="text-accent" /> District Views
              </h3>
              {districtData.some((d) => d.views > 0) ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={districtData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="views" fill="#6b7f5a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-11 gap-2">
                  {DISTRICTS.map((d) => (
                    <div key={d.id} className="bg-background border border-border rounded-lg p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">P{d.id}</div>
                      <div className="text-sm font-bold text-foreground">{stats.districtViews[d.id] || 0}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Activity Table */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h3 className="text-sm font-bold text-foreground mb-4">Recent Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 text-muted-foreground font-medium">Time</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Event</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">User</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">District</th>
                      <th className="text-left py-2 text-muted-foreground font-medium">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentActivity.slice(0, 25).map((event) => (
                      <tr key={event.id} className="border-b border-border last:border-0">
                        <td className="py-2 text-muted-foreground whitespace-nowrap">
                          {new Date(event.createdAt).toLocaleString("cs-CZ", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </td>
                        <td className="py-2">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${eventColor(event.event)}`}>
                            {event.event}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground font-mono">{event.userId ? event.userId.slice(0, 8) + "..." : "anonymous"}</td>
                        <td className="py-2 text-foreground">
                          {(event.metadata?.districtId as number) ? `Praha ${event.metadata.districtId}` : "—"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {String(event.metadata?.source || event.metadata?.method || event.metadata?.planKey || "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {stats.recentActivity.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-8">No activity recorded yet. Events will appear here as users interact with the site.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className={accent ? "text-accent" : "text-muted-foreground"} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${accent ? "text-accent" : "text-foreground"}`}>{value}</div>
    </div>
  );
}

function eventColor(event: string): string {
  switch (event) {
    case "payment_completed": return "bg-green-500/10 text-green-600";
    case "payment_started": return "bg-blue-500/10 text-blue-600";
    case "sign_in": return "bg-purple-500/10 text-purple-600";
    case "sign_out": return "bg-slate-500/10 text-slate-500";
    case "report_viewed": return "bg-amber-500/10 text-amber-600";
    case "district_selected": return "bg-accent/10 text-accent";
    case "page_view": return "bg-secondary text-muted-foreground";
    default: return "bg-secondary text-muted-foreground";
  }
}
