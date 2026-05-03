"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "./AuthProvider";

export function AuthDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = mode === "signin" ? await signIn(email, password) : await signUp(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      setEmail("");
      setPassword("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#3d4f3d]">
            {mode === "signin" ? "Sign in to continue" : "Create an account"}
          </DialogTitle>
          <DialogDescription>
            Sign in to access detailed data, charts, and comparisons.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-medium text-[#5a5040] mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-[#e8e4dc] bg-[#fefcf9] text-sm focus:outline-none focus:ring-2 focus:ring-[#6b7f5a]/30 focus:border-[#6b7f5a]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#5a5040] mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-3 py-2 rounded-lg border border-[#e8e4dc] bg-[#fefcf9] text-sm focus:outline-none focus:ring-2 focus:ring-[#6b7f5a]/30 focus:border-[#6b7f5a]"
              placeholder="Min 6 characters"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-[#3d4f3d] text-white text-sm font-semibold hover:bg-[#2d3d2d] transition-colors disabled:opacity-50"
          >
            {submitting ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-center text-xs text-[#8a7e6b] mt-4">
          {mode === "signin" ? (
            <>Don&apos;t have an account? <button type="button" onClick={() => { setMode("signup"); setError(null); }} className="text-[#6b7f5a] font-semibold hover:underline">Sign up</button></>
          ) : (
            <>Already have an account? <button type="button" onClick={() => { setMode("signin"); setError(null); }} className="text-[#6b7f5a] font-semibold hover:underline">Sign in</button></>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
