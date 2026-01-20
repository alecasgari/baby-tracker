import { supabase } from "../supabaseClient";

export interface LogFilters {
  from?: string;
  to?: string;
  type?: "feeding" | "diaper" | "all";
  recordedBy?: string;
}

export interface LogInput {
  userId: string;
  type: "feeding" | "diaper";
  amount: number | null;
  timestamp: string;
  recordedBy: string;
}

export async function fetchLogs(userId: string, filters?: LogFilters) {
  let query = supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (filters?.from) {
    query = query.gte("timestamp", filters.from);
  }
  if (filters?.to) {
    query = query.lte("timestamp", filters.to);
  }
  if (filters?.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters?.recordedBy) {
    query = query.eq("recorded_by", filters.recordedBy);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }
  return data ?? [];
}

export async function createLog(input: LogInput) {
  const { data, error } = await supabase
    .from("logs")
    .insert({
      user_id: input.userId,
      type: input.type,
      amount: input.amount,
      unit: input.type === "feeding" ? "ml" : null,
      timestamp: input.timestamp,
      recorded_by: input.recordedBy,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateLog(
  userId: string,
  logId: string,
  input: Omit<LogInput, "userId">,
) {
  const { data, error } = await supabase
    .from("logs")
    .update({
      type: input.type,
      amount: input.amount,
      unit: input.type === "feeding" ? "ml" : null,
      timestamp: input.timestamp,
      recorded_by: input.recordedBy,
    })
    .eq("id", logId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

