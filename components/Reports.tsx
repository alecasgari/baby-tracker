"use client";

import React, { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, Filter, Milk, Droplets } from "lucide-react";

import { fetchLogs } from "../lib/services/logs";
import { fetchProfile } from "../lib/services/profiles";
import { supabase } from "../lib/supabaseClient";
import { useLocale } from "../hooks/useLocale";
import type { LogRow, ProfileRow } from "./types";

type DateRange = "today" | "last7" | "custom";
type ActivityFilter = "all" | "feeding" | "diaper";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
}

function toISO(date: Date) {
  return date.toISOString();
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString([], { weekday: "short", day: "numeric" });
}

export function Reports() {
  const { locale } = useLocale();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [range, setRange] = useState<DateRange>("last7");
  const [type, setType] = useState<ActivityFilter>("all");
  const [recordedBy, setRecordedBy] = useState<string>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        setErrorMessage("Please log in to view reports.");
        setLoading(false);
        return;
      }

      try {
        const profileData = await fetchProfile(session.user.id);
        if (isMounted && profileData) setProfile(profileData);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load profile.",
          );
        }
      }

      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadLogs = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const now = new Date();
      let from: string | undefined;
      let to: string | undefined;

      if (range === "today") {
        from = toISO(startOfDay(now));
        to = toISO(endOfDay(now));
      } else if (range === "last7") {
        const start = new Date(now);
        start.setDate(start.getDate() - 6);
        from = toISO(startOfDay(start));
        to = toISO(endOfDay(now));
      } else if (range === "custom" && customFrom && customTo) {
        from = toISO(startOfDay(new Date(customFrom)));
        to = toISO(endOfDay(new Date(customTo)));
      }

      try {
        const data = await fetchLogs(session.user.id, {
          from,
          to,
          type,
          recordedBy: recordedBy === "all" ? undefined : recordedBy,
        });
        if (isMounted) setLogs(data as LogRow[]);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load logs.",
          );
        }
      }
    };

    loadLogs();
    return () => {
      isMounted = false;
    };
  }, [range, type, recordedBy, customFrom, customTo]);

  useEffect(() => {
    let isMounted = true;
    const loadWeekly = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) return;

      const now = new Date();
      const start = new Date(now);
      start.setDate(start.getDate() - 6);

      try {
        const data = await fetchLogs(session.user.id, {
          from: toISO(startOfDay(start)),
          to: toISO(endOfDay(now)),
        });
        if (isMounted) setWeeklyLogs(data as LogRow[]);
      } catch {
        // Keep reports resilient; fall back to empty weekly logs.
        if (isMounted) setWeeklyLogs([]);
      }
    };

    loadWeekly();
    return () => {
      isMounted = false;
    };
  }, []);

  const parents = useMemo(() => {
    if (!profile) return [];
    return [profile.father_name, profile.mother_name].filter(Boolean);
  }, [profile]);

  const weeklyStats = useMemo(() => {
    const feedings = weeklyLogs.filter((log) => log.type === "feeding");
    const diapers = weeklyLogs.filter((log) => log.type === "diaper");
    const totalMl = feedings.reduce((sum, log) => sum + (log.amount ?? 0), 0);
    const dailyAverage = Math.round(totalMl / 7);
    return {
      totalMl,
      dailyAverage,
      totalDiapers: diapers.length,
    };
  }, [weeklyLogs]);

  const chartData = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));
      const key = startOfDay(date).toISOString().slice(0, 10);
      return { key, label: formatShortDate(date), total: 0 };
    });

    const map = new Map(days.map((day) => [day.key, day]));

    weeklyLogs
      .filter((log) => log.type === "feeding")
      .forEach((log) => {
        const key = startOfDay(new Date(log.timestamp)).toISOString().slice(0, 10);
        const entry = map.get(key);
        if (entry) entry.total += log.amount ?? 0;
      });

    return Array.from(map.values());
  }, [weeklyLogs]);

  const maxValue = Math.max(1, ...chartData.map((item) => item.total));

  return (
    <div className="min-h-screen">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">Reports</p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            Weekly insights 📊
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsFilterOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-xs text-muted shadow-soft transition hover:-translate-y-0.5 hover:text-ink"
        >
          <Filter className="h-4 w-4" />
          Filter
        </button>
      </header>

      {isFilterOpen ? (
        <div className="mb-6 grid gap-4 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
          <div className="grid gap-2 text-sm text-ink">
            Date range
            <div className="flex flex-wrap gap-2">
              {(["today", "last7", "custom"] as DateRange[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    range === value
                      ? "bg-ink text-white"
                      : "border border-slate-200 text-muted hover:-translate-y-0.5 hover:text-ink"
                  }`}
                >
                  {value === "today"
                    ? "Today"
                    : value === "last7"
                      ? "Last 7 Days"
                      : "Custom"}
                </button>
              ))}
            </div>
            {range === "custom" ? (
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-xs text-muted">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(event) => setCustomFrom(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                  />
                </label>
                <label className="grid gap-1 text-xs text-muted">
                  To
                  <input
                    type="date"
                    value={customTo}
                    onChange={(event) => setCustomTo(event.target.value)}
                    className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <div className="grid gap-2 text-sm text-ink">
            Activity type
            <div className="flex flex-wrap gap-2">
              {(["all", "feeding", "diaper"] as ActivityFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    type === value
                      ? "bg-ink text-white"
                      : "border border-slate-200 text-muted hover:-translate-y-0.5 hover:text-ink"
                  }`}
                >
                  {value === "all"
                    ? "All"
                    : value === "feeding"
                      ? "Feeding only"
                      : "Diaper only"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 text-sm text-ink">
            Recorded by
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setRecordedBy("all")}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  recordedBy === "all"
                    ? "bg-ink text-white"
                    : "border border-slate-200 text-muted hover:-translate-y-0.5 hover:text-ink"
                }`}
              >
                All
              </button>
              {parents.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setRecordedBy(name)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    recordedBy === name
                      ? "bg-ink text-white"
                      : "border border-slate-200 text-muted hover:-translate-y-0.5 hover:text-ink"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="skeleton skeleton-card h-28" />
            <div className="skeleton skeleton-card h-28" />
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-soft">
            <div className="skeleton skeleton-text w-40" />
            <div className="mt-4 grid grid-cols-7 gap-2">
              {Array.from({ length: 7 }).map((_, idx) => (
                <div key={idx} className="skeleton skeleton-card h-24" />
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-soft">
            <div className="skeleton skeleton-text w-32" />
            <div className="mt-4 space-y-3">
              <div className="skeleton skeleton-text w-full" />
              <div className="skeleton skeleton-text w-5/6" />
              <div className="skeleton skeleton-text w-3/4" />
            </div>
          </div>
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl bg-pastel-pink p-4 text-sm text-ink shadow-soft">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-pastel-blue/80 to-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Milk className="h-4 w-4" />
            Weekly Average Consumption
          </div>
          <p className="mt-3 text-2xl font-semibold text-ink">
            {weeklyStats.dailyAverage} ml
          </p>
          <p className="mt-1 text-xs text-muted">
            Across the last 7 days 🌿
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-pastel-mint/80 to-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Droplets className="h-4 w-4" />
            Total Diapers This Week
          </div>
          <p className="mt-3 text-2xl font-semibold text-ink">
            {weeklyStats.totalDiapers} changes
          </p>
          <p className="mt-1 text-xs text-muted">Nice job keeping track 💛</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted">
          <BarChart3 className="h-4 w-4" />
          Daily milk intake (last 7 days)
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {chartData.map((day) => {
            const height = Math.round((day.total / maxValue) * 100);
            return (
              <div key={day.key} className="flex flex-col items-center gap-2">
                <div className="flex h-24 w-4 items-end rounded-full bg-slate-100/70">
                  <div
                    className="w-full rounded-full bg-gradient-to-t from-pastel-blue to-pastel-lavender"
                    style={{ height: `${Math.max(10, height)}%` }}
                    title={`${day.total} ml`}
                  />
                </div>
                <span className="text-[10px] text-muted">{day.label}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between text-xs text-muted">
          <span>🌙 Calm nights, steady feedings.</span>
          <span>{profile?.baby_name ? `${profile.baby_name} 💫` : "You got this 💫"}</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />
          Filtered activity
        </div>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No activity in this range.</p>
        ) : (
          <div className="mt-3 grid gap-3">
            {logs.slice(0, 12).map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-slate-100 bg-white/70 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow"
              >
                <span className="text-xs text-muted">
                  {new Date(log.timestamp).toLocaleString(locale)}
                </span>
                <span>
                  {log.type === "feeding"
                    ? `🍼 ${log.amount ?? 0} ml`
                    : "🧷 Diaper change"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

