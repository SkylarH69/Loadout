import { supabase } from "./supabaseClient";

/* ---------------------------------------------------------------------- */
/* PROFILE (identity + public leaderboard/badge card)                      */
/* ---------------------------------------------------------------------- */
export async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

export async function getProfileByName(name) {
  const { data } = await supabase.from("profiles").select("*").eq("name", name).maybeSingle();
  return data;
}

export async function getAllProfiles() {
  const { data } = await supabase.from("profiles").select("*");
  return data || [];
}

export async function createProfile(userId, name) {
  const { error } = await supabase.from("profiles").insert({
    id: userId, name, volume_30d: 0, streak: 0, achievement_ids: [], achievement_count: 0,
  });
  if (error) throw error;
}

export async function updatePublicSnapshot(userId, { currentStreak, volume30, achievementIds, prsCount }) {
  await supabase.from("profiles").update({
    streak: currentStreak,
    volume_30d: volume30,
    achievement_ids: achievementIds,
    achievement_count: achievementIds.length,
    prs_count: prsCount || 0,
  }).eq("id", userId);
}

/* ---------------------------------------------------------------------- */
/* WORKOUTS                                                                */
/* ---------------------------------------------------------------------- */
export async function getWorkouts(userId) {
  const { data } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
