import { Flame, TrendingUp, Dumbbell, Award, Layers, MessageCircle, Pencil, Sparkles, Trophy } from "lucide-react";
import { T } from "./programs";
import { getAllProfiles } from "./db";

export let uid = 0;
export const nextId = () => `x${Date.now()}_${uid++}`;

export function todayStr(d = new Date()) {
  return d.toISOString().slice(0, 10);
}
export function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
export function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

export function computeStats(workouts) {
  const cutoff = daysAgo(30);
  let volume30 = 0;
  const daySet = new Set();
  workouts.forEach((w) => {
    daySet.add(w.date);
    if (new Date(w.date) >= cutoff) volume30 += w.volume;
  });

  let streak = 0;
  let cursor = new Date();
  const hasToday = daySet.has(todayStr(cursor));
  if (!hasToday) cursor.setDate(cursor.getDate() - 1);
  while (daySet.has(todayStr(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekAgo = daysAgo(6);
  const sessionsThisWeek = new Set(
    workouts.filter((w) => new Date(w.date) >= weekAgo).map((w) => w.date)
  ).size;

  return { volume30, streak, sessionsThisWeek };
}

export function formatRelativeTime(ts) {
  const diffSec = Math.floor((Date.now() - ts) / 1000);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------------------------------------------------------------------- */
/* ACHIEVEMENT AGGREGATE HELPERS                                           */
/* ---------------------------------------------------------------------- */
const isSquatLift = (n) => /squat/i.test(n);
const isBenchLift = (n) => /bench/i.test(n) && !/row/i.test(n);
const isDeadliftLift = (n) => /deadlift/i.test(n);

function computeLongestStreak(workouts) {
  const days = Array.from(new Set(workouts.map((w) => w.date))).sort();
  let longest = 0, current = 0, prev = null;
  for (const d of days) {
    if (prev) {
      const diff = (new Date(d) - new Date(prev)) / 86400000;
      current = diff === 1 ? current + 1 : 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
    prev = d;
  }
  return longest;
}

function isoWeekKey(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${weekNo}`;
}

function computePerfectWeeks(workouts, target) {
  if (!target) return 0;
  const weekMap = {};
  workouts.forEach((w) => {
    const key = isoWeekKey(w.date);
    weekMap[key] = weekMap[key] || new Set();
    weekMap[key].add(w.date);
  });
  return Object.values(weekMap).filter((s) => s.size >= target).length;
}

function computeBigThreeAndVariety(workouts) {
  let sq = 0, be = 0, de = 0, mSq = 0, mBe = 0, mDe = 0, totalSets = 0, totalReps = 0;
  const uniq = new Set();
  workouts.forEach((w) => {
    w.exercises.forEach((ex) => {
      uniq.add(ex.name);
      ex.sets.forEach((s) => {
        totalSets += 1;
        totalReps += s.reps;
        const vol = s.weight * s.reps;
        if (isSquatLift(ex.name)) { sq += vol; mSq = Math.max(mSq, s.weight); }
        else if (isBenchLift(ex.name)) { be += vol; mBe = Math.max(mBe, s.weight); }
        else if (isDeadliftLift(ex.name)) { de += vol; mDe = Math.max(mDe, s.weight); }
      });
    });
  });
  return {
    bigThreeVolume: { squat: sq, bench: be, deadlift: de },
    bigThreeMaxWeight: { squat: mSq, bench: mBe, deadlift: mDe },
    totalSets, totalReps, uniqueExercises: uniq.size,
  };
}

export async function buildAchievementStats(profile, workouts, prs, communityActivity) {
  const core = computeStats(workouts);
  const { bigThreeVolume, bigThreeMaxWeight, totalSets, totalReps, uniqueExercises } = computeBigThreeAndVariety(workouts);
  const longestStreak = Math.max(computeLongestStreak(workouts), core.streak);
  const perfectWeeks = computePerfectWeeks(workouts, profile.program.daysPerWeek);
  const distinctPRExercises = Object.keys(prs).length;

  const loggedDayNames = new Set(workouts.map((w) => w.dayName));
  const programDayNames = new Set(profile.program.days.map((d) => d.name));
  const fullRotationDone = programDayNames.size > 0 && [...programDayNames].every((n) => loggedDayNames.has(n));

  const earlyBird = workouts.some((w) => w.finishedAt && new Date(w.finishedAt).getHours() < 6);
  const nightOwl = workouts.some((w) => w.finishedAt && new Date(w.finishedAt).getHours() >= 22);
  const weekendDays = new Set(
    workouts.filter((w) => { const d = new Date(w.date + "T00:00:00").getDay(); return d === 0 || d === 6; }).map((w) => w.date)
  ).size;

  const sortedDates = Array.from(new Set(workouts.map((w) => w.date))).sort();
  let hadComeback = false;
  for (let i = 1; i < sortedDates.length; i++) {
    if ((new Date(sortedDates[i]) - new Date(sortedDates[i - 1])) / 86400000 >= 14) { hadComeback = true; break; }
  }

  const daysSinceJoined = profile.createdAt ? (Date.now() - profile.createdAt) / 86400000 : 0;
  const programsTriedIds = communityActivity.programsTriedIds || [];

  let isNumberOne = false, isTopThree = false, isStreakNumberOne = false;
  try {
    const profiles = await getAllProfiles();
    const byVol = [...profiles].sort((a, b) => (b.volume_30d || 0) - (a.volume_30d || 0));
    const byStreak = [...profiles].sort((a, b) => (b.streak || 0) - (a.streak || 0));
    const volIdx = byVol.findIndex((e) => e.name === profile.name);
    const streakIdx = byStreak.findIndex((e) => e.name === profile.name);
    isNumberOne = volIdx === 0;
    isTopThree = volIdx >= 0 && volIdx < 3;
    isStreakNumberOne = streakIdx === 0;
  } catch { /* leaderboard unavailable, skip rank-based achievements this pass */ }

  return {
    totalWorkouts: workouts.length,
    currentStreak: core.streak,
    longestStreak,
    totalVolumeAllTime: workouts.reduce((sum, w) => sum + w.volume, 0),
    totalSets, totalReps, uniqueExercises,
    bigThreeVolume, bigThreeMaxWeight,
    distinctPRExercises,
    perfectWeeks,
    chatCount: communityActivity.chatCount || 0,
    programCommentCount: communityActivity.programCommentCount || 0,
    programsTriedCount: programsTriedIds.length,
    builtCustomProgram: programsTriedIds.includes("custom"),
    fullRotationDone,
    earlyBird, nightOwl, weekendDays, hadComeback,
    daysSinceJoined,
    isNumberOne, isTopThree, isStreakNumberOne,
  };
}

/* ---------------------------------------------------------------------- */
/* ACHIEVEMENTS — ~100 badges across every corner of training              */
/* ---------------------------------------------------------------------- */
function tierFor(index, total) {
  const q = total / 4;
  if (index < q) return "bronze";
  if (index < q * 2) return "silver";
  if (index < q * 3) return "gold";
  return "platinum";
}

const WORKOUT_MILESTONES = [1, 5, 10, 25, 50, 75, 100, 150, 250, 500, 750, 1000];
const workoutAchievements = WORKOUT_MILESTONES.map((n, i) => ({
  id: `workouts-${n}`,
  name: n === 1 ? "First Rep" : `${n.toLocaleString()} Workouts`,
  desc: `Log ${n.toLocaleString()} total workout${n > 1 ? "s" : ""}.`,
  category: "Consistency", icon: "Flame", tier: tierFor(i, WORKOUT_MILESTONES.length),
  check: (s) => s.totalWorkouts >= n,
}));

const STREAK_MILESTONES = [2, 3, 5, 7, 10, 14, 21, 30, 60, 100, 180, 365];
const streakAchievements = STREAK_MILESTONES.map((n, i) => ({
  id: `streak-${n}`,
  name: n >= 365 ? "Ironclad Year" : n >= 30 ? "No Days Off" : `${n}-Day Streak`,
  desc: `Reach a ${n}-day training streak.`,
  category: "Streak", icon: "Flame", tier: tierFor(i, STREAK_MILESTONES.length),
  check: (s) => s.longestStreak >= n,
}));

const VOLUME_MILESTONES = [10000, 25000, 50000, 100000, 250000, 500000, 750000, 1000000, 2000000, 5000000];
const volumeAchievements = VOLUME_MILESTONES.map((n, i) => ({
  id: `volume-${n}`,
  name: `${(n / 1000).toLocaleString()}k lb Lifted`,
  desc: `Move ${n.toLocaleString()} lb total across your training history.`,
  category: "Volume", icon: "TrendingUp", tier: tierFor(i, VOLUME_MILESTONES.length),
  check: (s) => s.totalVolumeAllTime >= n,
}));

const PLATE_TIERS = [135, 225, 315, 405, 495, 585];
const PLATE_NAMES = ["One Plate", "Two Plate", "Three Plate", "Four Plate", "Five Plate", "Six Plate"];
function plateClub(liftLabel, key) {
  return PLATE_TIERS.map((w, i) => ({
    id: `plate-${key}-${w}`,
    name: `${PLATE_NAMES[i]} ${liftLabel}`,
    desc: `Load ${w} lb onto the bar for ${liftLabel}.`,
    category: "Big Three", icon: "Dumbbell", tier: tierFor(i, PLATE_TIERS.length),
    check: (s) => s.bigThreeMaxWeight[key] >= w,
  }));
}
const plateAchievements = [...plateClub("Squat", "squat"), ...plateClub("Bench Press", "bench"), ...plateClub("Deadlift", "deadlift")];

const BIG3_MILESTONES = [5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];
const big3Achievements = BIG3_MILESTONES.map((n, i) => ({
  id: `big3-${n}`,
  name: `Big Three: ${(n / 1000).toLocaleString()}k lb`,
  desc: `Move a combined ${n.toLocaleString()} lb across squat, bench, and deadlift.`,
  category: "Big Three", icon: "Dumbbell", tier: tierFor(i, BIG3_MILESTONES.length),
  check: (s) => s.bigThreeVolume.squat + s.bigThreeVolume.bench + s.bigThreeVolume.deadlift >= n,
}));

const PR_MILESTONES = [1, 5, 10, 20, 35, 50];
const prAchievements = PR_MILESTONES.map((n, i) => ({
  id: `pr-${n}`,
  name: n === 1 ? "First PR" : `${n} PRs Logged`,
  desc: `Set a personal record on ${n} different exercise${n > 1 ? "s" : ""}.`,
  category: "Personal Records", icon: "Award", tier: tierFor(i, PR_MILESTONES.length),
  check: (s) => s.distinctPRExercises >= n,
}));

const VARIETY_MILESTONES = [10, 25, 50, 75, 100, 150];
const varietyAchievements = VARIETY_MILESTONES.map((n, i) => ({
  id: `variety-${n}`,
  name: `${n} Exercises Logged`,
  desc: `Log ${n} different exercises across your training history.`,
  category: "Variety", icon: "Layers", tier: tierFor(i, VARIETY_MILESTONES.length),
  check: (s) => s.uniqueExercises >= n,
}));

const PERFECT_WEEK_MILESTONES = [1, 4, 12, 52];
const perfectWeekAchievements = PERFECT_WEEK_MILESTONES.map((n, i) => ({
  id: `perfectweek-${n}`,
  name: n === 1 ? "Perfect Week" : n === 4 ? "Perfect Month" : n === 12 ? "Perfect Quarter" : "Perfect Year",
  desc: `Hit your weekly session goal ${n} time${n > 1 ? "s" : ""}.`,
  category: "Consistency", icon: "Flame", tier: tierFor(i, PERFECT_WEEK_MILESTONES.length),
  check: (s) => s.perfectWeeks >= n,
}));

const communityAchievements = [
  { id: "chat-1", name: "Joined the Floor", desc: "Post your first message in the Gym Floor.", category: "Community", icon: "MessageCircle", tier: "bronze", check: (s) => s.chatCount >= 1 },
  { id: "chat-10", name: "Regular on the Floor", desc: "Post 10 messages in the Gym Floor.", category: "Community", icon: "MessageCircle", tier: "silver", check: (s) => s.chatCount >= 10 },
  { id: "chat-50", name: "Floor Legend", desc: "Post 50 messages in the Gym Floor.", category: "Community", icon: "MessageCircle", tier: "gold", check: (s) => s.chatCount >= 50 },
  { id: "comment-1", name: "First Word", desc: "Leave your first comment on a program.", category: "Community", icon: "MessageCircle", tier: "bronze", check: (s) => s.programCommentCount >= 1 },
  { id: "comment-10", name: "Coach's Corner", desc: "Leave 10 comments across programs.", category: "Community", icon: "MessageCircle", tier: "silver", check: (s) => s.programCommentCount >= 10 },
  { id: "rank-podium", name: "On the Podium", desc: "Finish top 3 on the leaderboard.", category: "Community", icon: "Trophy", tier: "gold", check: (s) => s.isTopThree },
  { id: "rank-first", name: "Top of the Rack", desc: "Reach #1 on the volume leaderboard.", category: "Community", icon: "Trophy", tier: "platinum", check: (s) => s.isNumberOne },
  { id: "rank-streak-first", name: "Streak Champion", desc: "Reach #1 on the streak leaderboard.", category: "Community", icon: "Trophy", tier: "platinum", check: (s) => s.isStreakNumberOne },
];

const programAchievements = [
  { id: "prog-first", name: "Plan Locked In", desc: "Save your first training program.", category: "Programming", icon: "Pencil", tier: "bronze", check: (s) => s.programsTriedCount >= 1 },
  { id: "prog-custom", name: "Architect", desc: "Build a fully custom program from scratch.", category: "Programming", icon: "Pencil", tier: "silver", check: (s) => s.builtCustomProgram },
  { id: "prog-three", name: "Program Hopper", desc: "Try 3 different programs.", category: "Programming", icon: "Pencil", tier: "silver", check: (s) => s.programsTriedCount >= 3 },
  { id: "prog-five", name: "Method Collector", desc: "Try 5 different programs.", category: "Programming", icon: "Pencil", tier: "gold", check: (s) => s.programsTriedCount >= 5 },
  { id: "prog-rotation", name: "Full Rotation", desc: "Complete every training day in your current split at least once.", category: "Programming", icon: "Pencil", tier: "gold", check: (s) => s.fullRotationDone },
];

const specialAchievements = [
  { id: "early-bird", name: "Early Bird", desc: "Log a workout before 6 AM.", category: "Special", icon: "Sparkles", tier: "silver", check: (s) => s.earlyBird },
  { id: "night-owl", name: "Night Owl", desc: "Log a workout after 10 PM.", category: "Special", icon: "Sparkles", tier: "silver", check: (s) => s.nightOwl },
  { id: "weekend-warrior", name: "Weekend Warrior", desc: "Log workouts on 10 different weekend days.", category: "Special", icon: "Sparkles", tier: "silver", check: (s) => s.weekendDays >= 10 },
  { id: "comeback", name: "The Comeback", desc: "Return to training after a 14+ day break.", category: "Special", icon: "Sparkles", tier: "bronze", check: (s) => s.hadComeback },
  { id: "anniversary", name: "One Year In", desc: "Stick with Loadout for a full year.", category: "Special", icon: "Sparkles", tier: "platinum", check: (s) => s.daysSinceJoined >= 365 },
];

const SET_MILESTONES = [100, 500, 1000];
const setAchievements = SET_MILESTONES.map((n, i) => ({
  id: `sets-${n}`, name: `${n.toLocaleString()} Sets Logged`, desc: `Complete ${n.toLocaleString()} total sets.`,
  category: "Volume", icon: "TrendingUp", tier: tierFor(i, SET_MILESTONES.length), check: (s) => s.totalSets >= n,
}));
const REP_MILESTONES = [5000, 25000, 100000];
const repAchievements = REP_MILESTONES.map((n, i) => ({
  id: `reps-${n}`, name: `${n.toLocaleString()} Reps Logged`, desc: `Complete ${n.toLocaleString()} total reps.`,
  category: "Volume", icon: "TrendingUp", tier: tierFor(i, REP_MILESTONES.length), check: (s) => s.totalReps >= n,
}));

export const ACHIEVEMENTS = [
  ...workoutAchievements, ...streakAchievements, ...volumeAchievements, ...plateAchievements,
  ...big3Achievements, ...prAchievements, ...varietyAchievements, ...perfectWeekAchievements,
  ...communityAchievements, ...programAchievements, ...specialAchievements, ...setAchievements, ...repAchievements,
];

export const ACHIEVEMENT_ICONS = { Flame, TrendingUp, Dumbbell, Award, Layers, MessageCircle, Pencil, Sparkles, Trophy };
export const TIER_COLOR = { bronze: "#B9764F", silver: "#C9CDD3", gold: T.brass, platinum: "#8FD8E0" };
