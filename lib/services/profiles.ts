import { supabase } from "../supabaseClient";

export interface ProfileUpdateInput {
  father_name?: string;
  mother_name?: string;
  baby_name?: string;
  timezone?: string;
  profile_pic_url?: string | null;
}

export async function fetchProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfile(userId: string, input: ProfileUpdateInput) {
  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function uploadProfilePhoto(userId: string, file: File) {
  const extension = file.name.split(".").pop() || "jpg";
  const filePath = `profiles/${userId}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("profile-pics")
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from("profile-pics").getPublicUrl(filePath);

  return data.publicUrl;
}

