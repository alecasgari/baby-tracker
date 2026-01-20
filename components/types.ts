export interface ProfileRow {
  id: string;
  email: string;
  father_name: string;
  mother_name: string;
  baby_name: string;
  profile_pic_url: string | null;
  timezone: string;
  created_at: string;
}

export interface LogRow {
  id: string;
  user_id: string;
  type: "feeding" | "diaper";
  amount: number | null;
  unit: string | null;
  timestamp: string;
  recorded_by: string;
  created_at: string;
}

