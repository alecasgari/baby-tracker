"use client";

import React, { useEffect, useState } from "react";
import { Camera, Globe2, Save } from "lucide-react";

import { logout } from "../lib/auth";
import { fetchProfile, updateProfile, uploadProfilePhoto } from "../lib/services/profiles";
import { supabase } from "../lib/supabaseClient";
import { useLocale } from "../hooks/useLocale";
import type { ProfileRow } from "./types";

export function Settings() {
  const { locale, setLocale, toggleLocale } = useLocale();
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({
    father_name: "",
    mother_name: "",
    baby_name: "",
    timezone: "",
    profile_pic_url: "",
  });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;
      if (!session) {
        if (isMounted) setErrorMessage("Please log in to manage settings.");
        return;
      }

      try {
        const profileData = await fetchProfile(session.user.id);
        if (isMounted && profileData) {
          setProfile(profileData);
          setFormState({
            father_name: profileData.father_name ?? "",
            mother_name: profileData.mother_name ?? "",
            baby_name: profileData.baby_name ?? "",
            timezone: profileData.timezone ?? "",
            profile_pic_url: profileData.profile_pic_url ?? "",
          });
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to load profile.",
          );
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const updated = await updateProfile(profile.id, {
        father_name: formState.father_name,
        mother_name: formState.mother_name,
        baby_name: formState.baby_name,
        timezone: formState.timezone,
        profile_pic_url: formState.profile_pic_url || null,
      });
      setProfile(updated);
      setMessage("Profile updated!");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      await logout();
      window.location.href = "/";
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to log out.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;
    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const publicUrl = await uploadProfilePhoto(profile.id, file);
      setFormState((prev) => ({ ...prev, profile_pic_url: publicUrl }));
      setMessage("Photo uploaded. Save to apply.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to upload photo.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isLoadingProfile = !profile && !errorMessage;

  return (
    <div className="min-h-screen">
      <header className="mb-6">
        <p className="text-xs uppercase tracking-widest text-muted">Settings</p>
        <h1 className="mt-2 text-2xl font-semibold text-ink">
          Family profile ⚙️
        </h1>
      </header>

      {errorMessage ? (
        <div className="mb-4 rounded-xl bg-pastel-pink p-4 text-sm text-ink shadow-soft">
          {errorMessage}
        </div>
      ) : null}
      {message ? (
        <div className="mb-4 rounded-xl bg-pastel-mint p-4 text-sm text-ink shadow-soft">
          {message}
        </div>
      ) : null}

      {isLoadingProfile ? (
        <div className="grid gap-4">
          <div className="skeleton skeleton-card h-32" />
          <div className="skeleton skeleton-card h-28" />
          <div className="skeleton skeleton-card h-48" />
        </div>
      ) : null}

      {!isLoadingProfile ? (
        <section className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Globe2 className="h-4 w-4" />
          Language & layout
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLocale("en")}
            className={`rounded-full px-4 py-2 text-xs transition ${
              locale === "en" ? "bg-ink text-white" : "border border-slate-200 text-muted"
            }`}
          >
            English (LTR)
          </button>
          <button
            type="button"
            onClick={() => setLocale("fa")}
            className={`rounded-full px-4 py-2 text-xs transition ${
              locale === "fa" ? "bg-ink text-white" : "border border-slate-200 text-muted"
            }`}
          >
            فارسی (RTL)
          </button>
          <button
            type="button"
            onClick={toggleLocale}
            className="rounded-full border border-slate-200 px-4 py-2 text-xs text-muted transition hover:-translate-y-0.5 hover:text-ink"
          >
            Toggle
          </button>
        </div>
        <p className="mt-3 text-xs text-muted">
          Persian font will apply automatically when RTL is active.
        </p>
        </section>
      ) : null}

      {!isLoadingProfile ? (
        <section className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Camera className="h-4 w-4" />
          Profile picture
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-slate-100">
            {formState.profile_pic_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formState.profile_pic_url}
                alt="Baby profile"
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : null}
          </div>
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-muted transition hover:-translate-y-0.5 hover:text-ink">
            Upload new
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          Ensure a Supabase Storage bucket named <code>profile-pics</code> exists and is public.
        </p>
        </section>
      ) : null}

      {!isLoadingProfile ? (
        <section className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink">Account</p>
              <p className="mt-1 text-xs text-muted">
                Sign out from this device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSaving}
              className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs font-medium text-ink transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Log out
            </button>
          </div>
        </section>
      ) : null}

      {!isLoadingProfile ? (
        <section className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Save className="h-4 w-4" />
          Profile details
        </div>
        <div className="mt-4 grid gap-4">
          <label className="grid gap-2 text-sm text-ink">
            Baby name
            <input
              value={formState.baby_name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, baby_name: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-ink">
            Father&apos;s name
            <input
              value={formState.father_name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, father_name: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-ink">
            Mother&apos;s name
            <input
              value={formState.mother_name}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, mother_name: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
            />
          </label>
          <label className="grid gap-2 text-sm text-ink">
            Timezone
            <input
              value={formState.timezone}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, timezone: event.target.value }))
              }
              className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
              placeholder="Asia/Tehran"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || !profile}
          className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
        </section>
      ) : null}
    </div>
  );
}

