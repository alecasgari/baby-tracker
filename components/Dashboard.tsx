"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Baby, Clock, Milk, Pencil, Plus } from "lucide-react";

import { t } from "../lib/i18n";
import { fetchLogs, createLog, updateLog } from "../lib/services/logs";
import { fetchProfile } from "../lib/services/profiles";
import { supabase } from "../lib/supabaseClient";
import { useLocale } from "../hooks/useLocale";
import { BottomNav } from "./BottomNav";
import { EntryModal } from "./EntryModal";
import { Skeleton } from "./Skeleton";
import { Landing } from "./Landing";
import type { LogRow, ProfileRow } from "./types";

function toLocalDateKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}`;
}

function formatTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function timeAgo(dateString: string, now: Date) {
  const diffMinutes = Math.max(
    0,
    Math.floor((now.getTime() - new Date(dateString).getTime()) / 60000),
  );
  if (diffMinutes < 1) return "just now";
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  if (hours === 0) return `${minutes}m ago`;
  return `${hours}h ${minutes}m ago`;
}

export function Dashboard() {
  const { locale, toggleLocale } = useLocale();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<LogRow | null>(null);

  const isRtl = locale === "fa";

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setErrorMessage(null);
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        if (isMounted) setErrorMessage(sessionError.message);
        setLoading(false);
        return;
      }

      const session = sessionData.session;
      if (!session) {
        if (isMounted) {
          setIsAuthenticated(false);
          setErrorMessage(null);
          setLoading(false);
        }
        return;
      }

      setIsAuthenticated(true);
      const currentUserId = session.user.id;
      setUserId(currentUserId);

      try {
        const profileData = await fetchProfile(currentUserId);
        if (isMounted) {
          if (profileData) {
            setProfile(profileData);
          } else if (session.user) {
            const metadata = session.user.user_metadata ?? {};
            setProfile({
              id: session.user.id,
              email: session.user.email ?? "",
              father_name: metadata.father_name ?? "",
              mother_name: metadata.mother_name ?? "",
              baby_name: metadata.baby_name ?? "",
              profile_pic_url: null,
              timezone:
                Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC",
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load profile.",
          );
        }
      }

      try {
        const logData = await fetchLogs(currentUserId);
        if (isMounted) {
          setLogs(logData as LogRow[]);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load logs.",
          );
        }
      }

      if (isMounted) setLoading(false);
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const groupedLogs = useMemo(() => {
    return logs.reduce<Record<string, LogRow[]>>((acc, log) => {
      const key = toLocalDateKey(new Date(log.timestamp));
      if (!acc[key]) acc[key] = [];
      acc[key].push(log);
      return acc;
    }, {});
  }, [logs]);

  const lastFeeding = logs.find((log) => log.type === "feeding");
  const lastDiaper = logs.find((log) => log.type === "diaper");

  const handleSave = async (payload: {
    id?: string;
    type: LogRow["type"];
    amount: number | null;
    timestamp: string;
    recordedBy: string;
  }) => {
    if (!userId) return;

    if (payload.id) {
      const previousLogs = logs;
      setLogs((prev) =>
        prev.map((log) =>
          log.id === payload.id
            ? {
                ...log,
                type: payload.type,
                amount: payload.amount,
                timestamp: payload.timestamp,
                recorded_by: payload.recordedBy,
                unit: payload.type === "feeding" ? "ml" : null,
              }
            : log,
        ),
      );

      try {
        await updateLog(userId, payload.id, {
          type: payload.type,
          amount: payload.amount,
          timestamp: payload.timestamp,
          recordedBy: payload.recordedBy,
        });
      } catch (error) {
        setLogs(previousLogs);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to update log.",
        );
      }

      return;
    }

    const optimisticLog: LogRow = {
      id: `temp-${Date.now()}`,
      user_id: userId,
      type: payload.type,
      amount: payload.amount,
      unit: payload.type === "feeding" ? "ml" : null,
      timestamp: payload.timestamp,
      recorded_by: payload.recordedBy,
      created_at: new Date().toISOString(),
    };

    setLogs((prev) => [optimisticLog, ...prev]);

    try {
      const data = await createLog({
        userId,
        type: payload.type,
        amount: payload.amount,
        timestamp: payload.timestamp,
        recordedBy: payload.recordedBy,
      });
      setLogs((prev) =>
        prev.map((log) => (log.id === optimisticLog.id ? data : log)),
      );
    } catch (error) {
      setLogs((prev) => prev.filter((log) => log.id !== optimisticLog.id));
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save log.",
      );
    }
  };

  if (isAuthenticated === false) {
    return (
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`min-h-screen ${isRtl ? "text-right" : "text-left"}`}
      >
        <Landing />
        <BottomNav />
      </div>
    );
  }

  return (
    <div
      dir={isRtl ? "rtl" : "ltr"}
      className={`min-h-screen ${isRtl ? "text-right" : "text-left"}`}
    >
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted">
            {t(locale, "dashboardTitle")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-ink">
            {profile?.baby_name
              ? `Welcome, ${profile.baby_name}`
              : "Welcome back"}
          </h1>
        </div>
      </header>

      {loading ? (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-44" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-28 w-full" rounded="lg" />
            <Skeleton className="h-28 w-full" rounded="lg" />
          </div>
          <Skeleton className="h-40 w-full" rounded="lg" />
        </div>
      ) : errorMessage ? (
        <div className="rounded-xl bg-pastel-pink p-4 text-sm text-ink shadow-soft">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-gradient-to-br from-pastel-blue/80 to-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Milk className="h-4 w-4" />
            Last Feeding
          </div>
          <p className="mt-3 text-xl font-semibold text-ink">
            {lastFeeding ? timeAgo(lastFeeding.timestamp, now) : "No data"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {lastFeeding
              ? `${lastFeeding.amount ?? 0} ml · ${lastFeeding.recorded_by}`
              : "Add the first feeding entry."}
          </p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-pastel-mint/80 to-white p-4 shadow-soft transition hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Baby className="h-4 w-4" />
            Last Diaper Change
          </div>
          <p className="mt-3 text-xl font-semibold text-ink">
            {lastDiaper ? timeAgo(lastDiaper.timestamp, now) : "No data"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {lastDiaper
              ? `${formatTime(lastDiaper.timestamp)} · ${lastDiaper.recorded_by}`
              : "Add the first diaper entry."}
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-4">
        {Object.keys(groupedLogs).length === 0 ? (
          <div className="rounded-2xl border border-white/80 bg-white/80 p-4 text-sm text-muted shadow-soft">
            No activity yet. Tap + to add a record.
          </div>
        ) : (
          Object.keys(groupedLogs).map((dateKey) => {
            const dayLogs = groupedLogs[dateKey] ?? [];
            const total = dayLogs
              .filter((log) => log.type === "feeding")
              .reduce((sum, log) => sum + (log.amount ?? 0), 0);
            const isToday = dateKey === toLocalDateKey(new Date());
            return (
              <div
                key={dateKey}
                className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-ink">
                    {formatDateLabel(dateKey)}
                  </h2>
                  <div className="flex items-center gap-1 text-xs text-muted">
                    <Clock className="h-3 w-3" />
                    {dayLogs.length} entries
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  {dayLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-center justify-between rounded-lg border border-slate-100 bg-white/70 px-3 py-2 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow ${
                        isRtl ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-ink">
                        <span className="text-xs text-muted">
                          {formatTime(log.timestamp)}
                        </span>
                        {log.type === "feeding" ? (
                          <Milk className="h-4 w-4 text-muted" />
                        ) : (
                          <Baby className="h-4 w-4 text-muted" />
                        )}
                        <span>
                          {log.type === "feeding"
                            ? `${log.amount ?? 0} ml`
                            : "Diaper change"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingLog(log);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center gap-1 text-xs text-muted transition hover:text-ink"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-xs text-muted">
                  {isToday ? "Today" : "On this day"}, {profile?.baby_name ?? "your baby"}{" "}
                  has consumed {total} ml of milk so far.
                </p>
              </div>
            );
          })
        )}
      </section>

      <button
        type="button"
        onClick={() => {
          setEditingLog(null);
          setIsModalOpen(true);
        }}
        className="fixed bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/95 px-5 py-3 text-sm font-medium text-white shadow-[0_16px_32px_rgba(15,23,42,0.18)] ring-2 ring-white/90 transition hover:-translate-y-1 hover:bg-slate-900 sm:left-auto sm:right-6 sm:translate-x-0"
        aria-label="Add entry"
      >
        <Plus className="h-5 w-5" />
        Add entry
      </button>

      <EntryModal
        isOpen={isModalOpen}
        profile={profile}
        initialLog={editingLog}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      <BottomNav />
    </div>
  );
}

