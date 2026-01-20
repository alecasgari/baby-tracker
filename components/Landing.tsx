"use client";

import Link from "next/link";
import { Baby, Sparkles } from "lucide-react";

export function Landing() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="rounded-3xl bg-white/80 p-6 shadow-soft">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pastel-blue/70 text-ink">
          <Baby className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-ink">
          Minimalist Baby Tracker
        </h1>
        <p className="mt-2 text-sm text-muted">
          Track feedings, diapers, and daily rhythm in a calm space.
        </p>

        <div className="mt-5 grid gap-3">
          <Link
            href="/auth"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800"
          >
            Log in
          </Link>
          <Link
            href="/auth"
            className="rounded-lg border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-ink transition hover:-translate-y-0.5"
          >
            Sign up
          </Link>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-xs text-muted">
        <Sparkles className="h-3 w-3" />
        Calm, pastel, mobile-first ✨
      </div>
    </div>
  );
}

