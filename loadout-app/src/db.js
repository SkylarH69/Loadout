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
  const {
