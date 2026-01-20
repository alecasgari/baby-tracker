export interface User {
  id: string;
  email: string;
  fatherName: string;
  motherName: string;
  babyName: string;
  profilePic?: string;
  timezone: string;
}

export type LogType = "feeding" | "diaper";

export interface Log {
  id: string;
  babyId: string;
  type: LogType;
  amount: number;
  timestamp: string;
  note?: string;
  recordedBy: string;
}

