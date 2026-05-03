"use client";

import { useAuth } from "@/components/auth/AuthProvider";

const ADMIN_EMAILS = ["prahaislife@gmail.com"];

export function useAdmin() {
  const { user, loading } = useAuth();
  const isAdmin = !loading && !!user && ADMIN_EMAILS.includes(user.email || "");
  return { isAdmin, loading };
}
