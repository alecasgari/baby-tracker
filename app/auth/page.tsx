"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { login, signUpWithProfile } from "../../lib/auth";

type Mode = "signup" | "login";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [motherName, setMotherName] = useState("");
  const [babyName, setBabyName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (mode === "signup") {
        const data = await signUpWithProfile({
          email,
          password,
          fatherName,
          motherName,
          babyName,
        });
        if (data.session) {
          router.push("/");
          return;
        }
        setSuccessMessage("Account created. Please check your email to verify.");
      } else {
        await login(email, password);
        router.push("/");
        return;
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-6 shadow-soft">
      <div className="mb-6 flex gap-2 rounded-full bg-slate-100 p-1">
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            mode === "signup" ? "bg-white text-ink shadow" : "text-muted"
          }`}
          onClick={() => setMode("signup")}
        >
          Sign up
        </button>
        <button
          type="button"
          className={`flex-1 rounded-full px-4 py-2 text-sm font-medium ${
            mode === "login" ? "bg-white text-ink shadow" : "text-muted"
          }`}
          onClick={() => setMode("login")}
        >
          Log in
        </button>
      </div>

      <h1 className="text-2xl font-semibold text-ink">
        {mode === "signup" ? "Create your family profile" : "Welcome back"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {mode === "signup"
          ? "Start tracking your baby in a calm, minimal space."
          : "Continue where you left off."}
      </p>

      <form
        ref={formRef}
        className="mt-6 grid gap-4 pb-6"
        onSubmit={handleSubmit}
      >
        <label className="grid gap-2 text-sm text-ink">
          Email
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2 text-sm text-ink">
          Password
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {mode === "signup" ? (
          <>
            <label className="grid gap-2 text-sm text-ink">
              Father&apos;s name
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                type="text"
                value={fatherName}
                onChange={(event) => setFatherName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-ink">
              Mother&apos;s name
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                type="text"
                value={motherName}
                onChange={(event) => setMotherName(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm text-ink">
              Baby&apos;s name
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pastel-blue focus:outline-none"
                type="text"
                value={babyName}
                onChange={(event) => setBabyName(event.target.value)}
                required
              />
            </label>
          </>
        ) : null}

        {errorMessage ? (
          <p className="rounded-lg bg-pastel-pink px-3 py-2 text-xs text-ink">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="rounded-lg bg-pastel-mint px-3 py-2 text-xs text-ink">
            {successMessage}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>
      </form>
      <div className="fixed bottom-6 left-0 right-0 px-4 sm:hidden">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => formRef.current?.requestSubmit()}
          className="mx-auto block w-full max-w-[420px] rounded-lg bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading
            ? "Please wait..."
            : mode === "signup"
              ? "Create account"
              : "Log in"}
        </button>
      </div>
    </div>
  );
}

