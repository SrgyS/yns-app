'use client'

import { DayOfWeek } from "@prisma/client";
import { DAY_LABELS } from "../constants";

export function useCurrentDay(): DayOfWeek {
  const days = Object.keys(DAY_LABELS) as DayOfWeek[];
  const today = new Date().getDay();
  
  const dayIndex = today === 0 ? 6 : today - 1;
  
  return days[dayIndex];
}
