import { supabase } from "./supabaseClient";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "Something went wrong.";
}

async function ensureProfile({
  userId,
  email,
  fatherName,
  motherName,
  babyName,
  timezone,
  profilePicUrl,
}: {
  userId: string;
  email: string;
  fatherName?: string;
  motherName?: string;
  babyName?: string;
  timezone?: string;
  profilePicUrl?: string;
}) {
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (existing) {
    return;
  }

  const tz =
    timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    email,
    father_name: fatherName ?? "",
    mother_name: motherName ?? "",
    baby_name: babyName ?? "",
    profile_pic_url: profilePicUrl ?? null,
    timezone: tz,
  });

  if (profileError) {
    throw new Error(getErrorMessage(profileError));
  }
}

interface SignUpPayload {
  email: string;
  password: string;
  fatherName: string;
  motherName: string;
  babyName: string;
  timezone?: string;
  profilePicUrl?: string;
}

export async function signUpWithProfile({
  email,
  password,
  fatherName,
  motherName,
  babyName,
  timezone,
  profilePicUrl,
}: SignUpPayload) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        father_name: fatherName,
        mother_name: motherName,
        baby_name: babyName,
      },
    },
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  const userId = data.user?.id;
  if (!userId) {
    throw new Error("Signup succeeded but no user id was returned.");
  }

  if (data.session) {
    await ensureProfile({
      userId,
      email,
      fatherName,
      motherName,
      babyName,
      timezone,
      profilePicUrl,
    });
  }

  return data;
}

export async function login(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  if (data.user) {
    const metadata = data.user.user_metadata ?? {};
    await ensureProfile({
      userId: data.user.id,
      email: data.user.email ?? email,
      fatherName: metadata.father_name,
      motherName: metadata.mother_name,
      babyName: metadata.baby_name,
    });
  }

  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(getErrorMessage(error));
  }
}

