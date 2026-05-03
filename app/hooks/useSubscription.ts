"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { createClient } from "@/app/lib/supabase-browser";

export type UserPlan = "free" | "single" | "explorer" | "pro";

interface SubscriptionState {
  plan: UserPlan;
  loading: boolean;
  purchasedDistricts: number[];
  canAccessReport: (districtId: number) => boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): SubscriptionState {
  const { user } = useAuth();
  const [plan, setPlan] = useState<UserPlan>("free");
  const [purchasedDistricts, setPurchasedDistricts] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!user) {
      setPlan("free");
      setPurchasedDistricts([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const [{ data: sub }, { data: reports }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan, status, current_period_end")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("report_access")
        .select("district_id")
        .eq("user_id", user.id),
    ]);

    if (sub && sub.status === "active") {
      setPlan(sub.plan as UserPlan);
    } else {
      setPlan("free");
    }

    setPurchasedDistricts(reports?.map((r) => r.district_id) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const canAccessReport = (districtId: number): boolean => {
    if (districtId === 7) return true;
    if (plan === "explorer" || plan === "pro") return true;
    if (purchasedDistricts.includes(districtId)) return true;
    return false;
  };

  return { plan, loading, purchasedDistricts, canAccessReport, refresh: fetchSubscription };
}
