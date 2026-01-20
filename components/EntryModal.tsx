"use client";

import React, { useEffect, useMemo, useState } from "react";

import type { LogRow, ProfileRow } from "./types";

interface EntryModalProps {
  isOpen: boolean;
  profile: ProfileRow | null;
  initialLog?: LogRow | null;
  onClose: () => void;
  onSave: (payload: {
    id?: string;
    type: LogRow["type"];
    amount: number | null;
    timestamp: string;
    recordedBy: string;
  }) => Promise<void>;
}

const QUICK_AMOUNTS = [30, 60, 90, 120, 150, 180, 200];

function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EntryModal({
  isOpen,
  profile,
  initialLog,
  onClose,
  onSave,
}: EntryModalProps) {
  const [timestamp, setTimestamp] = useState(() =>
    toLocalInputValue(new Date()),
  );
  const [amount, setAmount] = useState(90);
  const [isDiaper, setIsDiaper] = useState(false);
  const [recordedBy, setRecordedBy] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const parents = useMemo(() => {
    if (!profile) return [];
    return [profile.father_name, profile.mother_name].filter(Boolean);
  }, [profile]);

  useEffect(() => {
    if (!isOpen) return;
    if (initialLog) {
      setTimestamp(toLocalInputValue(new Date(initialLog.timestamp)));
      setIsDiaper(initialLog.type === "diaper");
      setAmount(initialLog.amount ?? 90);
      setRecordedBy(initialLog.recorded_by);
    } else {
      setTimestamp(toLocalInputValue(new Date()));
      setIsDiaper(false);
      setAmount(90);
      setRecordedBy(parents[0] ?? "");
    }
  }, [initialLog, isOpen, parents]);

  if (!isOpen) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        id: initialLog?.id,
        type: isDiaper ? "diaper" : "feeding",
        amount: isDiaper ? null : amount,
        timestamp: new Date(timestamp).toISOString(),
        recordedBy,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 bg-black/30 px-4 py-6 backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-[480px] flex-col justify-end">
        <div className="rounded-2xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_48px_rgba(15,23,42,0.16)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink">
              {initialLog ? "Edit entry" : "New entry"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-muted"
            >
              Close
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm text-ink">
              Date & time
              <input
                type="datetime-local"
                className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                value={timestamp}
                onChange={(event) => setTimestamp(event.target.value)}
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm text-ink">
              Diaper change
              <input
                type="checkbox"
                checked={isDiaper}
                onChange={(event) => setIsDiaper(event.target.checked)}
              />
            </label>

            {!isDiaper ? (
              <div className="grid gap-3">
                <label className="grid gap-2 text-sm text-ink">
                  Milk amount (ml)
                  <input
                    type="number"
                    min={0}
                    className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                    value={amount}
                    onChange={(event) => setAmount(Number(event.target.value))}
                  />
                </label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAmount(value)}
                      className="rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs text-muted transition hover:-translate-y-0.5 hover:border-pastel-blue hover:text-ink"
                    >
                      {value} ml
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid gap-2 text-sm text-ink">
              Recorded by
              {parents.length > 0 ? (
                <div className="flex gap-2">
                  {parents.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setRecordedBy(name)}
                      className={`flex-1 rounded-full px-3 py-2 text-xs font-medium transition ${
                        recordedBy === name
                          ? "bg-ink text-white"
                          : "border border-slate-200 text-muted hover:-translate-y-0.5 hover:text-ink"
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={recordedBy}
                  onChange={(event) => setRecordedBy(event.target.value)}
                  placeholder="Parent name"
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                />
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!recordedBy || isSaving}
            className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Save entry"}
          </button>
        </div>
      </div>
    </div>
  );
}

