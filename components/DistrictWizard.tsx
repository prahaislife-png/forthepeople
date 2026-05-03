"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Compass, ArrowRight, ArrowLeft, MapPin, Check } from "lucide-react";
import { computeRecommendations, type WizardAnswers, type Recommendation } from "@/app/hooks/useWizardScoring";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelectDistrict: (id: number) => void;
}

export function DistrictWizard({ open, onOpenChange, onSelectDistrict }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<WizardAnswers>({
    budget: "balanced",
    household: "single",
    priorities: [],
    workZone: "remote",
  });
  const [results, setResults] = useState<Recommendation[] | null>(null);

  function handleFinish() {
    const recs = computeRecommendations(answers);
    setResults(recs);
    setStep(4);
  }

  function reset() {
    setStep(0);
    setResults(null);
    setAnswers({ budget: "balanced", household: "single", priorities: [], workZone: "remote" });
  }

  const PRIORITIES = [
    { id: "green", label: "Green space & parks" },
    { id: "nightlife", label: "Nightlife & culture" },
    { id: "quiet", label: "Quiet neighborhood" },
    { id: "schools", label: "Good schools" },
    { id: "transit", label: "Transit access" },
    { id: "safety", label: "Low crime" },
  ];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <Compass size={18} className="text-accent" /> Find Your District
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6">
          {/* Progress */}
          <div className="flex gap-1.5 mb-6">
            {[0, 1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-secondary"}`} />
            ))}
          </div>

          {/* Step 0: Budget */}
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">What&apos;s your budget priority?</h3>
              <p className="text-sm text-muted-foreground">This helps us match districts to your financial comfort zone.</p>
              <div className="space-y-2 mt-4">
                {([["low", "Low rent is key", "I want the most affordable option"], ["balanced", "Balanced", "Good value for money"], ["premium", "Premium", "Willing to pay more for quality"]] as const).map(([val, label, desc]) => (
                  <button key={val} onClick={() => setAnswers(a => ({ ...a, budget: val }))} className={`w-full text-left p-3 rounded-lg border transition-colors ${answers.budget === val ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary"}`}>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 1: Household */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Your household?</h3>
              <p className="text-sm text-muted-foreground">Different life stages need different neighborhoods.</p>
              <div className="space-y-2 mt-4">
                {([["single", "Single / Young professional"], ["couple", "Couple"], ["family", "Family with children"], ["retiree", "Retiree"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setAnswers(a => ({ ...a, household: val }))} className={`w-full text-left p-3 rounded-lg border transition-colors ${answers.household === val ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary"}`}>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Priorities */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">What matters most?</h3>
              <p className="text-sm text-muted-foreground">Select all that apply (at least one).</p>
              <div className="space-y-2 mt-4">
                {PRIORITIES.map(p => {
                  const selected = answers.priorities.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setAnswers(a => ({ ...a, priorities: selected ? a.priorities.filter(x => x !== p.id) : [...a.priorities, p.id] }))} className={`w-full text-left p-3 rounded-lg border transition-colors flex items-center justify-between ${selected ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary"}`}>
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                      {selected && <Check size={16} className="text-accent" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Work zone */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Where do you work?</h3>
              <p className="text-sm text-muted-foreground">We&apos;ll boost districts near your commute.</p>
              <div className="space-y-2 mt-4">
                {([["center", "City Center (Praha 1-3)"], ["west", "West (Praha 5, 6)"], ["north", "North (Praha 7, 8, 9)"], ["east", "East (Praha 10, 14, 15)"], ["south", "South (Praha 4, 11, 12)"], ["remote", "Remote / Doesn't matter"]] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setAnswers(a => ({ ...a, workZone: val }))} className={`w-full text-left p-3 rounded-lg border transition-colors ${answers.workZone === val ? "border-accent bg-accent/10" : "border-border bg-card hover:bg-secondary"}`}>
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && results && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Your Top Districts</h3>
              <p className="text-sm text-muted-foreground">Based on your preferences, we recommend:</p>
              <div className="space-y-3 mt-4">
                {results.slice(0, 3).map((rec, i) => (
                  <div key={rec.districtId} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? "bg-accent text-white" : "bg-secondary text-foreground"}`}>{i + 1}</span>
                        <span className="font-bold text-foreground">{rec.name}</span>
                      </div>
                      <span className="text-sm font-bold text-accent">{rec.score} pts</span>
                    </div>
                    {rec.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {rec.reasons.map(r => (
                          <span key={r} className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                      </div>
                    )}
                    <button onClick={() => { onSelectDistrict(rec.districtId); onOpenChange(false); reset(); }} className="mt-3 w-full py-2 rounded-lg text-xs font-semibold bg-accent/10 text-accent hover:bg-accent/20 transition-colors flex items-center justify-center gap-1">
                      <MapPin size={12} /> View {rec.name}
                    </button>
                  </div>
                ))}
              </div>
              <button onClick={reset} className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">Start over</button>
            </div>
          )}

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between mt-8">
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => { if (step === 3) handleFinish(); else setStep(s => s + 1); }} disabled={step === 2 && answers.priorities.length === 0} className="flex items-center gap-1 text-sm font-semibold text-accent hover:text-foreground disabled:opacity-30 transition-colors">
                {step === 3 ? "See results" : "Next"} <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
