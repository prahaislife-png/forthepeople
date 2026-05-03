"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";

interface ServiceCardProps {
  title: string;
  description: string;
  price: string;
  cta: string;
  href: string;
  icon: LucideIcon;
  highlighted?: boolean;
}

export function ServiceCard({ title, description, price, cta, href, icon: Icon, highlighted }: ServiceCardProps) {
  return (
    <div className={`relative rounded-2xl p-6 flex flex-col ${highlighted ? "bg-accent/10 border-2 border-accent shadow-lg shadow-accent/5" : "bg-card border border-border"}`}>
      {highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-bold px-3 py-1 rounded-full">
          Popular
        </span>
      )}
      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 flex-1">{description}</p>
      <div className="mb-4">
        <span className="text-xs text-muted-foreground">{price}</span>
      </div>
      <Link
        href={href}
        className={`w-full text-center py-3 px-4 rounded-lg font-semibold text-sm transition-all ${highlighted ? "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25" : "bg-secondary hover:bg-secondary/80 text-foreground"}`}
      >
        {cta}
      </Link>
    </div>
  );
}
