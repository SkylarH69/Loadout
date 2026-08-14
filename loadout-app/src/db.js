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
    .order("finished_at", { ascending: true });
  return (data || []).map((w) => ({
    id: w.id,
    date: w.date,
    dayName: w.day_name,
    exercises: w.exercises,
    volume: Number(w.volume),
    durationSeconds: w.duration_seconds,
    rpe: w.rpe,
    comment: w.comment,
    finishedAt: w.finished_at ? new Date(w.finished_at).getTime() : null,
    isDeload: !!w.is_deload,
  }));
}

export async function insertWorkout(userId, entry) {
  const { error } = await supabase.from("workouts").insert({
    user_id: userId,
    date: entry.date,
    day_name: entry.dayName,
    exercises: entry.exercises,
    volume: entry.volume,
    duration_seconds: entry.durationSeconds,
    rpe: entry.rpe,
    comment: entry.comment,
    finished_at: new Date(entry.finishedAt).toISOString(),
    is_deload: !!entry.isDeload,
  });
  if (error) throw error;
}

export async function setDeloadState(userId, state) {
  await supabase.from("profiles").update({ deload_state: state }).eq("id", userId);
}

export async function setWeeklySchedule(userId, schedule) {
  const { error } = await supabase.from("profiles").update({ weekly_schedule: schedule }).eq("id", userId);
  if (error) throw error;
}

export async function getActiveDraft(userId) {
  const { data } = await supabase.from("active_workout_draft").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    dayIndex: data.day_index, dayName: data.day_name, startTime: Number(data.start_time), log: data.log,
    savedAt: data.updated_at ? new Date(data.updated_at).getTime() : 0,
  };
}

export async function setActiveDraft(userId, draft) {
  await supabase.from("active_workout_draft").upsert({
    user_id: userId,
    day_index: draft.dayIndex,
    day_name: draft.dayName,
    start_time: draft.startTime,
    log: draft.log,
    updated_at: new Date().toISOString(),
  });
}

export async function clearActiveDraft(userId) {
  await supabase.from("active_workout_draft").delete().eq("user_id", userId);
}

/* ---------------------------------------------------------------------- */
/* PERSONAL RECORDS                                                        */
/* ---------------------------------------------------------------------- */
export async function getPRs(userId) {
  const { data } = await supabase.from("personal_records").select("*").eq("user_id", userId);
  const prs = {};
  (data || []).forEach((r) => {
    prs[r.exercise_name] = { weight: Number(r.weight), date: r.date };
  });
  return prs;
}

export async function upsertPR(userId, exerciseName, weight, date) {
  await supabase.from("personal_records").upsert({
    user_id: userId, exercise_name: exerciseName, weight, date,
  });
}

/* ---------------------------------------------------------------------- */
/* SAVED PROGRAM TEMPLATE                                                  */
/* ---------------------------------------------------------------------- */
export async function getUserProgram(userId) {
  const { data } = await supabase.from("user_programs").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;
  return {
    splitName: data.split_name,
    sourceId: data.source_id,
    daysPerWeek: data.days_per_week,
    days: data.days,
  };
}

export async function setUserProgram(userId, program) {
  await supabase.from("user_programs").upsert({
    user_id: userId,
    split_name: program.splitName,
    source_id: program.sourceId,
    days_per_week: program.daysPerWeek,
    days: program.days,
    updated_at: new Date().toISOString(),
  });
}

/* ---------------------------------------------------------------------- */
/* COMMUNITY ACTIVITY (chat/comment counters, programs tried)              */
/* ---------------------------------------------------------------------- */
export async function getCommunityActivity(userId) {
  const { data } = await supabase.from("community_activity").select("*").eq("user_id", userId).maybeSingle();
  return data
    ? {
        chatCount: data.chat_count || 0,
        programCommentCount: data.program_comment_count || 0,
        programsTriedIds: data.programs_tried_ids || [],
      }
    : { chatCount: 0, programCommentCount: 0, programsTriedIds: [] };
}

export async function setCommunityActivity(userId, activity) {
  await supabase.from("community_activity").upsert({
    user_id: userId,
    chat_count: activity.chatCount,
    program_comment_count: activity.programCommentCount,
    programs_tried_ids: activity.programsTriedIds,
  });
}

/* ---------------------------------------------------------------------- */
/* GYM FLOOR CHAT                                                          */
/* ---------------------------------------------------------------------- */
export async function getChatMessages() {
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(150);
  return (data || []).map((m) => ({
    id: m.id,
    userId: m.user_id,
    name: m.name,
    text: m.text,
    ts: new Date(m.created_at).getTime(),
    streak: m.streak,
    achievementCount: m.achievement_count,
    isTop: m.is_top,
  }));
}

export async function sendChatMessage(userId, msg) {
  const { error } = await supabase.from("chat_messages").insert({
    user_id: userId,
    name: msg.name,
    text: msg.text,
    streak: msg.streak,
    achievement_count: msg.achievementCount,
    is_top: msg.isTop,
  });
  if (error) throw error;
}

export async function deleteChatMessage(id) {
  const { error } = await supabase.from("chat_messages").delete().eq("id", id);
  if (error) throw error;
}

/* ---------------------------------------------------------------------- */
/* PROGRAM COMMENTS                                                        */
/* ---------------------------------------------------------------------- */
export async function getProgramComments(programId) {
  const { data } = await supabase
    .from("program_comments")
    .select("*")
    .eq("program_id", programId)
    .order("created_at", { ascending: true })
    .limit(150);
  return (data || []).map((c) => ({ name: c.name, text: c.text, ts: new Date(c.created_at).getTime() }));
}

export async function sendProgramComment(userId, programId, name, text) {
  const { error } = await supabase.from("program_comments").insert({
    user_id: userId, program_id: programId, name, text,
  });
  if (error) throw error;
}
