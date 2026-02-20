import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

interface DaySchedule {
  day: number;        // 0=Sun, 1=Mon, ..., 6=Sat
  label: string;      // "Sunday", "Monday", etc.
  isOpen: boolean;    // false = closed all day
  openTime: string;   // "HH:MM"
  closeTime: string;  // "HH:MM"
}

const DAY_LABELS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const DEFAULT_WEEKLY_SCHEDULE: DaySchedule[] = DAY_LABELS.map((label, i) => ({
  day: i,
  label,
  isOpen: i >= 1 && i <= 5,   // Mon-Fri open, Sat-Sun closed
  openTime: "07:00",
  closeTime: "14:00",
}));

const DEFAULTS = {
  openTime: "07:00",
  closeTime: "14:00",
  manualOverride: "none",
  timezone: "Australia/Sydney",
};

async function getSetting(
  ctx: { db: any },
  key: string
): Promise<string | null> {
  const row = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  return row?.value ?? null;
}

async function upsertSetting(
  ctx: { db: any },
  key: string,
  value: string
): Promise<void> {
  const existing = await ctx.db
    .query("appSettings")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { value });
  } else {
    await ctx.db.insert("appSettings", { key, value });
  }
}

async function requireStaff(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Authentication required");
  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();
  if (!userRoles.some((r: any) => r.role === "staff" || r.role === "admin")) {
    throw new Error("Access denied");
  }
}

// Build weekly schedule from DB or fall back to legacy keys
async function getWeeklySchedule(ctx: { db: any }): Promise<DaySchedule[]> {
  const raw = await getSetting(ctx, "weeklySchedule");
  if (raw) {
    return JSON.parse(raw) as DaySchedule[];
  }
  // Legacy migration: build from single openTime/closeTime
  const openTime = (await getSetting(ctx, "openTime")) ?? DEFAULTS.openTime;
  const closeTime = (await getSetting(ctx, "closeTime")) ?? DEFAULTS.closeTime;
  return DAY_LABELS.map((label, i) => ({
    day: i,
    label,
    isOpen: i >= 1 && i <= 5,
    openTime,
    closeTime,
  }));
}

// Public query — returns stored hours + override + timezone + weekly schedule
export const getBusinessHours = query({
  args: {},
  handler: async (ctx) => {
    const manualOverride =
      (await getSetting(ctx, "manualOverride")) ?? DEFAULTS.manualOverride;
    const timezone =
      (await getSetting(ctx, "timezone")) ?? DEFAULTS.timezone;
    const weeklySchedule = await getWeeklySchedule(ctx);

    // Derive legacy openTime/closeTime from first open day for backward compat
    const firstOpenDay = weeklySchedule.find((d) => d.isOpen);
    const openTime = firstOpenDay?.openTime ?? DEFAULTS.openTime;
    const closeTime = firstOpenDay?.closeTime ?? DEFAULTS.closeTime;

    return { openTime, closeTime, manualOverride, timezone, weeklySchedule };
  },
});

// Public query — computes whether the truck is currently open
export const isCurrentlyOpen = query({
  args: {},
  handler: async (ctx) => {
    const manualOverride =
      (await getSetting(ctx, "manualOverride")) ?? DEFAULTS.manualOverride;
    const timezone =
      (await getSetting(ctx, "timezone")) ?? DEFAULTS.timezone;
    const weeklySchedule = await getWeeklySchedule(ctx);

    // Derive legacy openTime/closeTime from first open day
    const firstOpenDay = weeklySchedule.find((d) => d.isOpen);
    const openTime = firstOpenDay?.openTime ?? DEFAULTS.openTime;
    const closeTime = firstOpenDay?.closeTime ?? DEFAULTS.closeTime;

    if (manualOverride === "forceOpen") {
      return {
        isOpen: true,
        reason: "Manually opened by staff",
        openTime,
        closeTime,
      };
    }
    if (manualOverride === "forceClosed") {
      return {
        isOpen: false,
        reason: "Manually closed by staff",
        openTime,
        closeTime,
      };
    }

    // Get current time and day in the configured timezone
    const now = new Date();
    const timeFormatter = new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const timeParts = timeFormatter.formatToParts(now);
    const hour = timeParts.find((p) => p.type === "hour")?.value ?? "00";
    const minute = timeParts.find((p) => p.type === "minute")?.value ?? "00";
    const currentTime = `${hour}:${minute}`;

    const dayFormatter = new Intl.DateTimeFormat("en-AU", {
      timeZone: timezone,
      weekday: "long",
    });
    const currentDayName = dayFormatter.format(now);
    const currentDayIndex = DAY_LABELS.indexOf(currentDayName);

    const todaySchedule = currentDayIndex >= 0
      ? weeklySchedule[currentDayIndex]
      : null;

    if (!todaySchedule || !todaySchedule.isOpen) {
      return {
        isOpen: false,
        reason: `Closed on ${currentDayName}s`,
        openTime,
        closeTime,
      };
    }

    const isOpen =
      currentTime >= todaySchedule.openTime &&
      currentTime < todaySchedule.closeTime;
    const reason = isOpen
      ? `Open until ${formatTime12(todaySchedule.closeTime)}`
      : `Closed. ${currentDayName} hours: ${formatTime12(todaySchedule.openTime)} - ${formatTime12(todaySchedule.closeTime)}`;

    return {
      isOpen,
      reason,
      openTime: todaySchedule.openTime,
      closeTime: todaySchedule.closeTime,
    };
  },
});

// Staff mutation — update weekly schedule
export const updateWeeklySchedule = mutation({
  args: {
    schedule: v.string(), // JSON-encoded DaySchedule[]
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const schedule: DaySchedule[] = JSON.parse(args.schedule);
    if (!Array.isArray(schedule) || schedule.length !== 7) {
      throw new Error("Schedule must have exactly 7 days");
    }
    const timeRegex = /^\d{2}:\d{2}$/;
    for (const day of schedule) {
      if (typeof day.day !== "number" || day.day < 0 || day.day > 6) {
        throw new Error(`Invalid day number: ${day.day}`);
      }
      if (day.isOpen) {
        if (!timeRegex.test(day.openTime) || !timeRegex.test(day.closeTime)) {
          throw new Error(`Invalid time format for ${day.label}. Use HH:MM`);
        }
        if (day.openTime >= day.closeTime) {
          throw new Error(`Open time must be before close time for ${day.label}`);
        }
      }
    }
    await upsertSetting(ctx, "weeklySchedule", JSON.stringify(schedule));
  },
});

// Staff mutation — update open/close times (legacy, kept for backward compat)
export const updateBusinessHours = mutation({
  args: {
    openTime: v.string(),
    closeTime: v.string(),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(args.openTime) || !timeRegex.test(args.closeTime)) {
      throw new Error("Invalid time format. Use HH:MM");
    }
    await upsertSetting(ctx, "openTime", args.openTime);
    await upsertSetting(ctx, "closeTime", args.closeTime);
  },
});

// Staff mutation — set manual override
export const setManualOverride = mutation({
  args: {
    override: v.union(
      v.literal("none"),
      v.literal("forceOpen"),
      v.literal("forceClosed")
    ),
  },
  handler: async (ctx, args) => {
    await requireStaff(ctx);
    await upsertSetting(ctx, "manualOverride", args.override);
  },
});

// Helper: convert "HH:MM" to 12-hour format
function formatTime12(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}
