import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dumbbell, Flame, Trophy, MessageCircle, Home, Plus, ChevronRight,
  ChevronLeft, Check, X, TrendingUp, Award, Send, Medal, Pencil,
  ArrowLeft, MessageSquare, Layers, Heart, Users, ShieldCheck, ExternalLink,
  Search, Sparkles, Trash2, Minus, Clock, StickyNote
} from "lucide-react";

import { supabase } from "./supabaseClient.js";
import { T, CAT_COLOR, PROGRAMS, EXERCISE_LIBRARY } from "./programs.js";
import { CARD, H2, P, TITLE, INPUT, BTN_PRIMARY, BTN_SECONDARY, ROUND_BTN } from "./styles.js";
import {
  nextId, todayStr, daysAgo, formatDuration, computeStats, formatRelativeTime,
  buildAchievementStats, ACHIEVEMENTS, ACHIEVEMENT_ICONS, TIER_COLOR,
} from "./achievements.js";
import { AuthScreen, ChooseName } from "./Auth.jsx";
import {
  getProfile, getProfileByName, getAllProfiles, createProfile, updatePublicSnapshot,
  getWorkouts, insertWorkout, getPRs, upsertPR,
  getUserProgram, setUserProgram as setUserProgram_db,
  setDeloadState,
  getActiveDraft, setActiveDraft, clearActiveDraft,
  getCommunityActivity, setCommunityActivity as setCommunityActivity_db,
  getChatMessages, sendChatMessage, deleteChatMessage, getProgramComments, sendProgramComment,
} from "./db.js";

/* ---------------------------------------------------------------------- */
/* ABOUT US CONTENT — edit this section directly to make it yours          */
/* ---------------------------------------------------------------------- */
const ABOUT = {
  eyebrow: "Veteran-founded",
  mission:
    "Loadout started with a simple idea: the gym is one of the few places where rank doesn't matter and nobody trains alone. We built this to bring that same accountability online — real programs, honest tracking, and a floor full of people who show up.",
  founderNote:
    "I’ve trained in rooms where the people around you made you better simply by showing up. Then I opened fitness apps that reduced all of that to sets, reps, and numbers. I kept thinking: we’re missing the best part. So I decided to build it.",
};

const VALUE_PILLARS = [
  { icon: ShieldCheck, title: "Built by lifters, for lifters", body: "No black-box AI programming. Every template comes from methods that have moved weight for decades." },
  { icon: Users, title: "A floor, not a feed", body: "One shared chat room and a real leaderboard — training partners, not algorithmic engagement." },
  { icon: Heart, title: "Free to train", body: "Core tracking, programs, and community stay free. Sponsors keep the lights on so lifters don't have to pay for a login." },
];

/* Add or edit sponsors here — name, one-line description, and an optional link. */
const SPONSORS = [
  { name: "Add Your First Sponsor", tagline: "Replace this card with a real sponsor name, what they do, and why they back the community.", url: "" },
  { name: "Add Another Sponsor", tagline: "Duplicate this entry for each business or brand supporting Loadout.", url: "" },
];

function ExercisePicker({ onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const results = query.trim()
    ? EXERCISE_LIBRARY.filter((e) => e.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 40)
    : [];

  return (
    <div style={{ background: T.iron, border: `1px solid ${T.line}`, borderRadius: 10, padding: 12, marginTop: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: query ? 10 : 0 }}>
        <Search size={15} color={T.chalkDim} style={{ flexShrink: 0 }} />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search 200+ exercises…"
          style={{ ...INPUT, flex: 1, padding: "9px 10px", fontSize: 13.5, background: T.iron3 }}
        />
        <button onClick={onClose} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", flexShrink: 0 }}>
          <X size={16} />
        </button>
      </div>

      {query.trim() && results.length === 0 && (
        <div style={{ fontSize: 12.5, color: T.chalkDim, padding: "8px 2px" }}>No exercises match "{query}". Try a different term.</div>
      )}

      {results.length > 0 && (
        <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {results.map((ex) => (
            <button
              key={ex.name}
              onClick={() => onAdd(ex.name)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                background: T.iron3, border: `1px solid ${T.line}`, borderRadius: 8, padding: "9px 10px",
                cursor: "pointer", textAlign: "left", width: "100%",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: T.chalk }}>{ex.name}</div>
                <div style={{ fontSize: 10.5, color: T.chalkDim, marginTop: 1 }}>{ex.category}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: T.rust, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus size={14} color={T.chalk} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PlateStack({ filled, total, size = 22, color = T.rust }) {
  const plates = Array.from({ length: total }, (_, i) => i < filled);
  return (
    <div style={{ display: "flex", flexDirection: "column-reverse", gap: 3, alignItems: "center" }}>
      {plates.map((on, i) => (
        <div key={i} style={{
          width: size + i * 3, height: size * 0.34, borderRadius: 4,
          background: on ? color : "transparent",
          border: `2px solid ${on ? color : T.line}`,
          transition: "background .3s ease",
        }} />
      ))}
    </div>
  );
}

function Barbell({ percent }) {
  const plates = Math.max(0, Math.min(6, Math.round((percent / 100) * 6)));
  const arr = Array.from({ length: 6 }, (_, i) => i < plates);
  const render = (a) => a.map((on, i) => (
    <div key={i} style={{
      width: 8, height: 34 + (on ? 10 : 0),
      background: on ? T.rust : "rgba(242,239,233,0.12)",
      borderRadius: 2, marginLeft: i === 0 ? 0 : -1,
    }} />
  ));
  return (
    <div style={{ display: "flex", alignItems: "center", height: 44 }}>
      <div style={{ display: "flex" }}>{render([...arr].reverse())}</div>
      <div style={{ height: 6, background: "rgba(242,239,233,0.25)", flex: 1, minWidth: 40 }} />
      <div style={{ display: "flex" }}>{render(arr)}</div>
    </div>
  );
}
function ProgramList({ onSelect, onCreateCustom, activeProgramId, heading, sub }) {
  return (
    <div style={{ padding: "24px 18px 100px" }}>
      <h1 style={TITLE}>{heading || "Program Library"}</h1>
      <p style={{ ...P, marginTop: 8 }}>{sub || "Pick a tried-and-true template. You can tweak every exercise before you save it."}</p>

      <button
        onClick={onCreateCustom}
        style={{
          ...CARD, textAlign: "left", cursor: "pointer", marginBottom: 12,
          border: `1.5px dashed ${T.rust}`, background: "rgba(196,67,43,0.08)",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        <div style={{
          width: 42, height: 42, borderRadius: 10, background: T.rust, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Sparkles size={20} color={T.chalk} />
        </div>
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 17, color: T.chalk, textTransform: "uppercase", marginBottom: 3 }}>
            Create Your Own
          </div>
          <div style={{ fontSize: 13, color: T.chalkDim, lineHeight: 1.4 }}>
            Set your own frequency and volume, and build every day from 200+ searchable exercises.
          </div>
        </div>
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {PROGRAMS.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            style={{
              ...CARD, textAlign: "left", cursor: "pointer",
              border: p.id === activeProgramId ? `1.5px solid ${T.rust}` : `1px solid ${T.line}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, color: T.chalk, textTransform: "uppercase" }}>{p.name}</div>
              <div style={{
                fontSize: 10.5, padding: "3px 8px", borderRadius: 20, color: T.iron, fontWeight: 600,
                background: CAT_COLOR[p.category] || T.chalkDim, whiteSpace: "nowrap", marginLeft: 8,
              }}>
                {p.category}
              </div>
            </div>
            <div style={{ fontSize: 12, color: T.chalkDim, marginBottom: 8 }}>
              {p.author} · {p.level} · {p.daysPerWeek} days/week
            </div>
            <div style={{ fontSize: 13.5, color: T.chalkDim, lineHeight: 1.4 }}>{p.blurb}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PROGRAM DETAIL + COMMENTS                                               */
/* ---------------------------------------------------------------------- */
function ProgramDetail({ program, onBack, onUse, myName, myUserId, isActive, onActivityChange }) {
  const [comments, setComments] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const c = await getProgramComments(program.id);
    setComments(c);
  }, [program.id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [load]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");
    try {
      await sendProgramComment(myUserId, program.id, myName, text);
      setComments(await getProgramComments(program.id));

      const activity = await getCommunityActivity(myUserId);
      activity.programCommentCount = (activity.programCommentCount || 0) + 1;
      await setCommunityActivity(myUserId, activity);
      onActivityChange && onActivityChange();
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} /> Back to library
      </button>

      <div style={{
        fontSize: 10.5, padding: "3px 8px", borderRadius: 20, color: T.iron, fontWeight: 600,
        background: CAT_COLOR[program.category] || T.chalkDim, display: "inline-block", marginBottom: 10,
      }}>
        {program.category}
      </div>
      <h1 style={TITLE}>{program.name}</h1>
      <div style={{ fontSize: 13, color: T.chalkDim, margin: "6px 0 14px" }}>
        {program.author} · {program.level} · {program.daysPerWeek} days/week
      </div>
      <p style={P}>{program.blurb}</p>

      {program.days.map((day, i) => (
        <div key={i} style={{ ...CARD, marginBottom: 12 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase", marginBottom: 10 }}>
            {day.name}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {day.exercises.map((ex, j) => (
              <div key={j} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.chalkDim }}>
                <span>{ex.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{ex.sets}×{ex.reps}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <button onClick={() => onUse(program)} style={{ ...BTN_PRIMARY, marginBottom: 30 }}>
        {isActive ? "Edit my template" : "Use & customize"} <Pencil size={16} style={{ marginLeft: 8 }} />
      </button>

      <div style={{ borderTop: `1px solid ${T.line}`, paddingTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <MessageSquare size={16} color={T.chalkDim} />
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase" }}>
            Talk about this program
          </div>
        </div>

        {comments === null && <div style={{ color: T.chalkDim, fontSize: 13 }}>Loading comments…</div>}
        {comments && comments.length === 0 && (
          <div style={{ color: T.chalkDim, fontSize: 13, marginBottom: 14 }}>
            No comments yet — be the first to share how it's going.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          {comments && comments.map((c, i) => (
            <div key={i} style={{ display: "flex", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", background: T.iron3, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontFamily: "'Oswald', sans-serif", color: T.rust,
              }}>
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 12.5, color: T.chalk, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{c.name}</span>
                  <span style={{ color: T.chalkDim, fontWeight: 400 }}> · {formatRelativeTime(c.ts)}</span>
                </div>
                <div style={{ fontSize: 13.5, color: T.chalkDim, lineHeight: 1.4 }}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={`What do you think of ${program.name}?`}
            style={{ ...INPUT, flex: 1 }}
          />
          <button onClick={send} disabled={sending || !draft.trim()} style={{ ...ROUND_BTN, background: T.rust, opacity: draft.trim() ? 1 : 0.5 }}>
            <Send size={15} color={T.chalk} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* TEMPLATE CUSTOMIZER                                                     */
/* ---------------------------------------------------------------------- */
function ensureIds(days) {
  return days.map((d) => ({
    id: d.id || nextId(),
    name: d.name,
    exercises: d.exercises.map((e) => ({ id: e.id || nextId(), name: e.name, sets: e.sets, reps: e.reps })),
  }));
}

function Customizer({ sourceProgram, initialDays, onCancel, onSave }) {
  const [days, setDays] = useState(() => ensureIds(initialDays || sourceProgram.days));
  const [pickerFor, setPickerFor] = useState(null);

  const updateExercise = (dayId, exId, field, value) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map((e) => e.id !== exId ? e : { ...e, [field]: value }),
    }));
  };

  const changeSets = (dayId, exId, delta) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map((e) => e.id !== exId ? e : { ...e, sets: Math.max(1, Math.min(10, e.sets + delta)) }),
    }));
  };

  const deleteExercise = (dayId, exId) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.filter((e) => e.id !== exId),
    }));
  };

  const addExercise = (dayId, name) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: [...d.exercises, { id: nextId(), name, sets: 3, reps: "8-10" }],
    }));
  };

  const renameDay = (dayId, name) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : { ...d, name }));
  };

  const save = () => {
    const cleaned = days
      .map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.name.trim()) }))
      .filter((d) => d.exercises.length > 0);
    if (cleaned.length === 0) return;
    onSave({
      splitName: sourceProgram.name,
      sourceId: sourceProgram.id,
      daysPerWeek: sourceProgram.daysPerWeek || cleaned.length,
      days: cleaned,
    });
  };

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} /> Cancel
      </button>
      <h1 style={TITLE}>{sourceProgram.name}</h1>
      <p style={{ ...P, marginTop: 6 }}>Rename exercises, adjust sets, or add and remove lifts to make this yours.</p>

      {days.map((day) => (
        <div key={day.id} style={{ ...CARD, marginBottom: 14 }}>
          <input
            value={day.name}
            onChange={(e) => renameDay(day.id, e.target.value)}
            style={{
              background: "none", border: "none", borderBottom: `1px solid ${T.line}`, color: T.chalk,
              fontFamily: "'Oswald', sans-serif", fontSize: 16, textTransform: "uppercase",
              padding: "0 0 8px", marginBottom: 14, width: "100%", outline: "none",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {day.exercises.map((ex) => (
              <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  value={ex.name}
                  onChange={(e) => updateExercise(day.id, ex.id, "name", e.target.value)}
                  style={{ ...INPUT, flex: 1, padding: "10px 12px", fontSize: 13.5 }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => changeSets(day.id, ex.id, -1)} style={{ ...ROUND_BTN, width: 28, height: 28 }}>
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalk, fontSize: 13, minWidth: 16, textAlign: "center" }}>
                    {ex.sets}
                  </span>
                  <button onClick={() => changeSets(day.id, ex.id, 1)} style={{ ...ROUND_BTN, width: 28, height: 28 }}>
                    <ChevronRight size={13} />
                  </button>
                </div>
                <input
                  value={ex.reps}
                  onChange={(e) => updateExercise(day.id, ex.id, "reps", e.target.value)}
                  placeholder="reps"
                  style={{ ...INPUT, width: 60, flexShrink: 0, padding: "10px 8px", fontSize: 13, textAlign: "center" }}
                />
                <button onClick={() => deleteExercise(day.id, ex.id)} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {pickerFor === day.id ? (
            <ExercisePicker
              onAdd={(name) => { addExercise(day.id, name); setPickerFor(null); }}
              onClose={() => setPickerFor(null)}
            />
          ) : (
            <button onClick={() => setPickerFor(day.id)} style={{ ...BTN_SECONDARY, marginTop: 12, padding: "8px 12px", fontSize: 13, width: "auto" }}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add exercise
            </button>
          )}
        </div>
      ))}

      <button onClick={save} style={{ ...BTN_PRIMARY, marginTop: 8 }}>
        <Check size={18} style={{ marginRight: 6 }} /> Save template
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* CUSTOM BUILDER — full control over frequency, volume, and exercises     */
/* ---------------------------------------------------------------------- */
function CustomBuilder({ initialName, initialDays, onCancel, onSave }) {
  const [name, setName] = useState(initialName || "My Custom Program");
  const [days, setDays] = useState(() =>
    initialDays && initialDays.length ? ensureIds(initialDays) : [{ id: nextId(), name: "Day 1", exercises: [] }]
  );
  const [pickerFor, setPickerFor] = useState(null);

  const addDay = () => {
    setDays((prev) => [...prev, { id: nextId(), name: `Day ${prev.length + 1}`, exercises: [] }]);
  };

  const removeDay = (dayId) => {
    setDays((prev) => (prev.length > 1 ? prev.filter((d) => d.id !== dayId) : prev));
  };

  const renameDay = (dayId, dayName) => {
    setDays((prev) => prev.map((d) => (d.id !== dayId ? d : { ...d, name: dayName })));
  };

  const addExercise = (dayId, exName) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: [...d.exercises, { id: nextId(), name: exName, sets: 3, reps: "8-10" }],
    }));
  };

  const updateExercise = (dayId, exId, field, value) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map((e) => e.id !== exId ? e : { ...e, [field]: value }),
    }));
  };

  const changeSets = (dayId, exId, delta) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.map((e) => e.id !== exId ? e : { ...e, sets: Math.max(1, Math.min(10, e.sets + delta)) }),
    }));
  };

  const deleteExercise = (dayId, exId) => {
    setDays((prev) => prev.map((d) => d.id !== dayId ? d : {
      ...d, exercises: d.exercises.filter((e) => e.id !== exId),
    }));
  };

  const totalExercises = days.reduce((sum, d) => sum + d.exercises.length, 0);

  const save = () => {
    const cleaned = days
      .map((d) => ({ ...d, exercises: d.exercises.filter((e) => e.name.trim()) }))
      .filter((d) => d.exercises.length > 0);
    if (cleaned.length === 0) return;
    onSave({
      splitName: name.trim() || "My Custom Program",
      sourceId: "custom",
      daysPerWeek: cleaned.length,
      days: cleaned,
    });
  };

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <button onClick={onCancel} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} /> Cancel
      </button>

      <div style={{
        fontSize: 10.5, padding: "3px 8px", borderRadius: 20, color: T.iron, fontWeight: 600,
        background: T.rust, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10,
      }}>
        <Sparkles size={12} /> Create Your Own
      </div>
      <h1 style={TITLE}>Build Your Program</h1>
      <p style={{ ...P, marginTop: 6 }}>Name it, set your frequency, and pull in exercises from the full library.</p>

      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 12, color: T.chalkDim, marginBottom: 6 }}>Program name</div>
        <input value={name} onChange={(e) => setName(e.target.value)} style={INPUT} />
      </div>

      <div style={{ ...CARD, marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: T.chalk, textTransform: "uppercase" }}>Frequency</div>
          <div style={{ fontSize: 12, color: T.chalkDim, marginTop: 2 }}>{days.length} training day{days.length !== 1 ? "s" : ""} a week</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => days.length > 1 && removeDay(days[days.length - 1].id)} style={ROUND_BTN}>
            <Minus size={16} />
          </button>
          <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 22, color: T.chalk, minWidth: 26, textAlign: "center" }}>
            {days.length}
          </span>
          <button onClick={addDay} style={ROUND_BTN}>
            <Plus size={16} />
          </button>
        </div>
      </div>

      {days.map((day) => (
        <div key={day.id} style={{ ...CARD, marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <input
              value={day.name}
              onChange={(e) => renameDay(day.id, e.target.value)}
              style={{
                background: "none", border: "none", borderBottom: `1px solid ${T.line}`, color: T.chalk,
                fontFamily: "'Oswald', sans-serif", fontSize: 16, textTransform: "uppercase",
                padding: "0 0 8px", flex: 1, outline: "none",
              }}
            />
            {days.length > 1 && (
              <button onClick={() => removeDay(day.id)} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", flexShrink: 0 }}>
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {day.exercises.length === 0 && (
            <div style={{ fontSize: 12.5, color: T.chalkDim, marginBottom: 12 }}>No exercises yet — search below to add some.</div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {day.exercises.map((ex) => (
              <div key={ex.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, fontSize: 13.5, color: T.chalk, padding: "10px 12px", background: T.iron3, borderRadius: 10, border: `1.5px solid ${T.line}` }}>
                  {ex.name}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <button onClick={() => changeSets(day.id, ex.id, -1)} style={{ ...ROUND_BTN, width: 28, height: 28 }}>
                    <ChevronLeft size={13} />
                  </button>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalk, fontSize: 13, minWidth: 16, textAlign: "center" }}>
                    {ex.sets}
                  </span>
                  <button onClick={() => changeSets(day.id, ex.id, 1)} style={{ ...ROUND_BTN, width: 28, height: 28 }}>
                    <ChevronRight size={13} />
                  </button>
                </div>
                <input
                  value={ex.reps}
                  onChange={(e) => updateExercise(day.id, ex.id, "reps", e.target.value)}
                  placeholder="reps"
                  style={{ ...INPUT, width: 60, flexShrink: 0, padding: "10px 8px", fontSize: 13, textAlign: "center" }}
                />
                <button onClick={() => deleteExercise(day.id, ex.id)} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", flexShrink: 0 }}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          {pickerFor === day.id ? (
            <ExercisePicker
              onAdd={(exName) => { addExercise(day.id, exName); setPickerFor(null); }}
              onClose={() => setPickerFor(null)}
            />
          ) : (
            <button onClick={() => setPickerFor(day.id)} style={{ ...BTN_SECONDARY, marginTop: 12, padding: "8px 12px", fontSize: 13, width: "auto" }}>
              <Search size={14} style={{ marginRight: 6 }} /> Add exercise
            </button>
          )}
        </div>
      ))}

      <button onClick={addDay} style={{ ...BTN_SECONDARY, marginBottom: 18 }}>
        <Plus size={16} style={{ marginRight: 6 }} /> Add another day
      </button>

      <button onClick={save} disabled={totalExercises === 0} style={{ ...BTN_PRIMARY, opacity: totalExercises === 0 ? 0.4 : 1, cursor: totalExercises === 0 ? "not-allowed" : "pointer" }}>
        <Check size={18} style={{ marginRight: 6 }} /> Save program
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PROGRAMS TAB (library / detail / customize / my plan)                   */
/* ---------------------------------------------------------------------- */
function ProgramsTab({ profile, onSaveProgram, onStartWorkout, myName, myUserId, onActivityChange, autoEdit, onAutoEditHandled }) {
  const [view, setView] = useState(profile ? "mine" : "library");
  const [detailId, setDetailId] = useState(null);
  const [customizeProgram, setCustomizeProgram] = useState(null);
  const [buildState, setBuildState] = useState(null);

  const openDetail = (id) => { setDetailId(id); setView("detail"); };
  const detailProgram = PROGRAMS.find((p) => p.id === detailId);

  const beginCustomize = (program) => {
    const isCurrent = profile && profile.program.sourceId === program.id;
    setCustomizeProgram({ program, initialDays: isCurrent ? profile.program.days : null });
    setView("customize");
  };

  const beginBuild = (existingProgram) => {
    setBuildState({
      name: existingProgram ? existingProgram.splitName : "My Custom Program",
      days: existingProgram ? existingProgram.days : null,
    });
    setView("build");
  };

  const handleSave = (newProgram) => {
    onSaveProgram(newProgram);
    setView("mine");
  };

  const openEditor = useCallback(() => {
    if (!profile) return;
    if (profile.program.sourceId === "custom") {
      beginBuild(profile.program);
      return;
    }
    const src = PROGRAMS.find((p) => p.id === profile.program.sourceId) || {
      id: profile.program.sourceId,
      name: profile.program.splitName,
      daysPerWeek: profile.program.daysPerWeek,
      days: profile.program.days,
    };
    beginCustomize(src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // If we were navigated here specifically to edit (e.g. from the Dashboard's "Up next" card), jump straight in.
  useEffect(() => {
    if (autoEdit && profile) {
      openEditor();
      onAutoEditHandled && onAutoEditHandled();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (view === "mine" && profile) {

    return (
      <div style={{ padding: "24px 18px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h1 style={TITLE}>My Plan</h1>
          <button onClick={() => setView("library")} style={{ background: "none", border: "none", color: T.rust, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
            <Layers size={14} /> Browse
          </button>
        </div>
        <div style={{ color: T.chalkDim, fontSize: 14, marginBottom: 20 }}>
          {profile.program.splitName} · {profile.program.daysPerWeek} days/week
        </div>
        {profile.program.days.map((day, i) => (
          <div key={day.id || i} style={{ ...CARD, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 17, color: T.chalk, textTransform: "uppercase" }}>{day.name}</div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={openEditor}
                  title="Edit this plan"
                  style={{ ...ROUND_BTN, width: 34, height: 34, background: "transparent" }}
                >
                  <Pencil size={14} />
                </button>
                <button onClick={() => onStartWorkout(i)} style={{ ...BTN_SECONDARY, padding: "8px 14px", fontSize: 13, width: "auto" }}>
                  Start
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {day.exercises.map((ex) => (
                <div key={ex.id || ex.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.chalkDim }}>
                  <span>{ex.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{ex.sets}×{ex.reps}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <button
          onClick={openEditor}
          style={{ ...BTN_SECONDARY, marginTop: 4 }}
        >
          <Pencil size={15} style={{ marginRight: 8 }} /> Edit this template
        </button>
      </div>
    );
  }

  if (view === "detail" && detailProgram) {
    return (
      <ProgramDetail
        program={detailProgram}
        onBack={() => setView("library")}
        onUse={beginCustomize}
        myName={myName}
        myUserId={myUserId}
        isActive={profile && profile.program.sourceId === detailProgram.id}
        onActivityChange={onActivityChange}
      />
    );
  }

  if (view === "customize" && customizeProgram) {
    return (
      <Customizer
        sourceProgram={customizeProgram.program}
        initialDays={customizeProgram.initialDays}
        onCancel={() => setView(profile ? "mine" : "library")}
        onSave={handleSave}
      />
    );
  }

  if (view === "build" && buildState) {
    return (
      <CustomBuilder
        initialName={buildState.name}
        initialDays={buildState.days}
        onCancel={() => setView(profile ? "mine" : "library")}
        onSave={handleSave}
      />
    );
  }

  return (
    <ProgramList
      onSelect={openDetail}
      onCreateCustom={() => beginBuild(null)}
      activeProgramId={profile?.program?.sourceId}
      heading={profile ? "Browse Programs" : "Choose Your Program"}
      sub={profile ? "Switch templates any time — your history and PRs stay with you." : "Already have a program? Pick the closest match and customize every detail."}
    />
  );
}

/* ---------------------------------------------------------------------- */
/* DASHBOARD                                                               */
/* ---------------------------------------------------------------------- */
function getNextDayIndex(workouts, days) {
  if (!workouts.length) return 0;
  const lastDayName = workouts[workouts.length - 1].dayName;
  const lastIdx = days.findIndex((d) => d.name === lastDayName);
  if (lastIdx === -1) return 0; // last logged day isn't part of the current program (e.g. you switched templates) — start from the top
  return (lastIdx + 1) % days.length;
}

function Dashboard({ profile, workouts, stats, onStartWorkout, prs, onOpenProfile, onEditNext, achievementCount, deloadSignal, deloadState, onStartDeload }) {
  const nextDayIdx = getNextDayIndex(workouts, profile.program.days);
  const nextDay = profile.program.days[nextDayIdx];
  const recentPRs = Object.entries(prs).sort((a, b) => b[1].date.localeCompare(a[1].date)).slice(0, 3);

  return (
    <div style={{ padding: "24px 18px 100px" }}>
      <div style={{ fontFamily: "Inter, sans-serif", color: T.chalkDim, fontSize: 14 }}>Welcome back</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        <button
          onClick={onOpenProfile}
          style={{
            fontFamily: "'Oswald', sans-serif", fontSize: 34, color: T.chalk, margin: "2px 0", textTransform: "uppercase",
            letterSpacing: 0.5, background: "none", border: "none", padding: 0, cursor: onOpenProfile ? "pointer" : "default",
          }}
        >
          {profile.name}
        </button>
        {typeof achievementCount === "number" && (
          <button
            onClick={onOpenProfile}
            title="View all achievements"
            style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: T.brass,
              border: `1px solid ${T.brass}`, borderRadius: 20, padding: "4px 10px",
              background: "rgba(232,185,74,0.08)", cursor: onOpenProfile ? "pointer" : "default",
            }}
          >
            <Award size={13} /> {achievementCount} / {ACHIEVEMENTS.length}
          </button>
        )}
      </div>

      {deloadState && (
        <div style={{
          ...CARD, marginBottom: 18, display: "flex", alignItems: "center", gap: 10,
          border: `1px solid ${T.brass}`, background: "rgba(232,185,74,0.08)",
        }}>
          <Sparkles size={18} color={T.brass} style={{ flexShrink: 0 }} />
          <div style={{ fontSize: 13, color: T.chalk }}>
            Deload week in progress — {(deloadState.doneDayNames || []).length} / {profile.program.days.length} days done light.
          </div>
        </div>
      )}
      {!deloadState && deloadSignal?.recommended && (
        <div style={{ ...CARD, marginBottom: 18, border: `1px solid ${T.brass}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Sparkles size={16} color={T.brass} />
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: T.chalk, textTransform: "uppercase" }}>Deload recommended</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 14 }}>
            {deloadSignal.reasons.map((r, i) => (
              <div key={i} style={{ fontSize: 12.5, color: T.chalkDim, lineHeight: 1.4 }}>• {r}</div>
            ))}
          </div>
          <button onClick={onStartDeload} style={{ ...BTN_SECONDARY, borderColor: T.brass, color: T.brass }}>
            Start deload week
          </button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <StatCard icon={<Flame size={18} color={T.rust} />} label="Streak" value={`${stats.streak}d`} />
        <StatCard icon={<TrendingUp size={18} color={T.moss} />} label="30-day volume" value={`${Math.round(stats.volume30).toLocaleString()} lb`} />
      </div>

      <div style={{ ...CARD, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", color: T.chalk, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>This week</div>
          <div style={{ color: T.chalkDim, fontSize: 13 }}>{stats.sessionsThisWeek} / {profile.program.daysPerWeek || profile.program.days.length} sessions</div>
        </div>
        <Barbell percent={Math.min(100, (stats.sessionsThisWeek / (profile.program.daysPerWeek || profile.program.days.length)) * 100)} />
      </div>

      <div style={{ ...CARD, marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", color: T.chalk, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Up next — {nextDay.name}
          </div>
          {onEditNext && (
            <button onClick={onEditNext} title="Edit this plan" style={{ ...ROUND_BTN, width: 30, height: 30, background: "transparent", flexShrink: 0 }}>
              <Pencil size={13} />
            </button>
          )}
        </div>
        <div style={{ color: T.chalkDim, fontSize: 13, marginBottom: 14 }}>{nextDay.exercises.length} exercises · {profile.program.splitName}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
          {nextDay.exercises.slice(0, 4).map((ex) => (
            <div key={ex.id || ex.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, color: T.chalk }}>
              <span>{ex.name}</span>
              <span style={{ color: T.chalkDim, fontFamily: "'JetBrains Mono', monospace" }}>{ex.sets}×{ex.reps}</span>
            </div>
          ))}
          {nextDay.exercises.length > 4 && <div style={{ fontSize: 12.5, color: T.chalkDim }}>+{nextDay.exercises.length - 4} more</div>}
        </div>
        <button onClick={() => onStartWorkout(nextDayIdx)} style={BTN_PRIMARY}>
          Start workout <ChevronRight size={18} style={{ marginLeft: 4 }} />
        </button>
      </div>

      {recentPRs.length > 0 && (
        <div style={CARD}>
          <div style={{ fontFamily: "'Oswald', sans-serif", color: T.chalk, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>Recent PRs</div>
          {recentPRs.map(([name, pr]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: `1px solid ${T.line}` }}>
              <Award size={16} color={T.brass} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, color: T.chalk }}>{name}</div>
                <div style={{ fontSize: 12, color: T.chalkDim }}>{pr.date}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.brass, fontSize: 14 }}>{pr.weight} lb</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={CARD}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        {icon}
        <span style={{ fontSize: 12.5, color: T.chalkDim, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      </div>
      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 26, color: T.chalk }}>{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* WORKOUT LOGGER                                                          */
/* ---------------------------------------------------------------------- */
function draftKey(userId) {
  return `loadout_active_workout_${userId}`;
}

/* ---------------------------------------------------------------------- */
/* PROGRESSIVE OVERLOAD ENGINE                                             */
/* Grounded in: linear load progression (StrongLifts/Starting Strength     */
/* protocol — small fixed jumps only after a clean session), the double    */
/* progression method (climb reps to the top of the range before adding    */
/* load, then reset), and RPE-based autoregulation (dial back the jump     */
/* after a session that felt very hard).                                   */
/* ---------------------------------------------------------------------- */
function classifyIncrement(name) {
  const bodyweightNoLoad =
    /(push-up|pull-up|chin-up|inverted row|plank|sit-up|crunch|^dip$|hanging|l-sit|dragon flag|burpee|mountain climber|bear crawl|^glute bridge$|bodyweight)/i.test(name) &&
    !/(weighted|cable|machine|dumbbell|barbell|band)/i.test(name);
  if (bodyweightNoLoad) return { type: "bodyweight", inc: 0 };
  if (/deadlift/i.test(name)) return { type: "barbell", inc: 10 };
  if (/(squat)/i.test(name) && !/(goblet|split|bulgarian|pistol)/i.test(name)) return { type: "barbell", inc: 5 };
  if (/(bench press|overhead press|push press|barbell row|pendlay row|t-bar row)/i.test(name) && !/(dumbbell|machine|smith)/i.test(name)) return { type: "barbell", inc: 5 };
  if (/dumbbell/i.test(name)) return { type: "dumbbell", inc: 5 };
  if (/(machine|cable|pulldown|leg press|leg curl|leg extension|pec deck|smith)/i.test(name)) return { type: "machine", inc: 5 };
  if (/(curl|raise|extension|fly|kickback|pushdown|shrug)/i.test(name)) return { type: "isolation", inc: 2.5 };
  return { type: "general", inc: 5 };
}

function parseRepTarget(repsStr) {
  if (!repsStr) return null;
  const s = repsStr.trim().toLowerCase();
  if (s.includes("/") || s.includes("+")) return { type: "percentage" };
  if (s.includes("s")) return { type: "time" };
  if (s === "max") return { type: "amrap" };
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) return { type: "range", min: parseInt(range[1], 10), max: parseInt(range[2], 10) };
  const single = s.match(/^(\d+)$/);
  if (single) return { type: "fixed", min: parseInt(single[1], 10), max: parseInt(single[1], 10) };
  return null;
}

function suggestNextTarget(exerciseName, targetRepsStr, workouts) {
  for (let i = workouts.length - 1; i >= 0; i--) {
    if (workouts[i].isDeload) continue; // don't base normal progression off a lightened deload session
    const match = workouts[i].exercises?.find((e) => e.name === exerciseName);
    if (!match || match.sets.length === 0) continue;

    const lastSets = match.sets;
    const target = parseRepTarget(targetRepsStr);
    const { type: liftType, inc } = classifyIncrement(exerciseName);
    const lastWeight = Math.max(...lastSets.map((s) => s.weight));
    const minRepsAtLastWeight = Math.min(...lastSets.filter((s) => s.weight === lastWeight).map((s) => s.reps));

    const rpe = workouts[i].rpe;
    const dampened = typeof rpe === "number" && rpe >= 9;
    const adjInc = dampened ? Math.max(2.5, inc / 2) : inc;
    const rpeSuffix = dampened ? ` That session was RPE ${rpe}, so we're keeping the jump conservative.` : "";

    if (liftType === "bodyweight") {
      const bestReps = Math.max(...lastSets.map((s) => s.reps));
      return { weight: null, reps: bestReps + 1, note: `Best set last time was ${bestReps} reps — aim to beat it by at least 1.` };
    }
    if (!target || target.type === "percentage") {
      return { weight: lastWeight, reps: null, note: `Percentage-based — this follows your training max, not a per-session jump. Last top set: ${lastWeight} lb × ${Math.max(...lastSets.map((s) => s.reps))}.` };
    }
    if (target.type === "time" || target.type === "amrap") {
      return { weight: lastWeight || null, reps: null, note: `Last time: ${lastWeight ? `${lastWeight} lb, ` : ""}${Math.max(...lastSets.map((s) => s.reps))} reps. Try to match or beat it.` };
    }
    if (target.type === "fixed") {
      if (minRepsAtLastWeight >= target.max) {
        return { weight: lastWeight + adjInc, reps: target.min, note: `You hit all ${target.max} reps at ${lastWeight} lb last time — add ${adjInc} lb today.${rpeSuffix}` };
      }
      return { weight: lastWeight, reps: target.min, note: `You missed a rep at ${lastWeight} lb last time — repeat this weight until every set is clean.` };
    }
    if (target.type === "range") {
      if (minRepsAtLastWeight >= target.max) {
        return { weight: lastWeight + adjInc, reps: target.min, note: `You hit the top of your range (${target.max}) at ${lastWeight} lb — add ${adjInc} lb and reset to ${target.min} reps.${rpeSuffix}` };
      }
      if (minRepsAtLastWeight < target.min) {
        return { weight: lastWeight, reps: target.min, note: `You were under range last time (${minRepsAtLastWeight}) — stay at ${lastWeight} lb, aim for ${target.min}+.` };
      }
      const nextReps = Math.min(minRepsAtLastWeight + 1, target.max);
      return { weight: lastWeight, reps: nextReps, note: `Same weight, push for ${nextReps} reps today — you're not at the top of your range yet.` };
    }
    return { weight: lastWeight, reps: minRepsAtLastWeight, note: `Last time: ${lastWeight} lb × ${minRepsAtLastWeight}.` };
  }
  return null; // no history logged for this exercise yet
}

/* ---------------------------------------------------------------------- */
/* DELOAD ENGINE                                                           */
/* Hybrid of fixed-schedule (4–6 week) and autoregulated (stalling lifts,  */
/* climbing RPE) deload timing. During a deload: ~40–50% fewer sets, ~60%  */
/* of recent working weight — cuts volume harder than intensity, which is  */
/* the combination best supported for shedding fatigue without detraining. */
/* ---------------------------------------------------------------------- */
function computeDeloadSignal(workouts, program) {
  const nonDeload = workouts.filter((w) => !w.isDeload);
  if (nonDeload.length < 4) return { recommended: false, reasons: [] };

  const deloadWorkouts = workouts.filter((w) => w.isDeload);
  const lastDeloadDate = deloadWorkouts.length ? deloadWorkouts[deloadWorkouts.length - 1].date : nonDeload[0].date;
  const weeksSince = Math.floor((Date.now() - new Date(lastDeloadDate + "T00:00:00").getTime()) / (7 * 86400000));

  const exerciseNames = new Set(program.days.flatMap((d) => d.exercises.map((e) => e.name)));
  let stalledCount = 0;
  exerciseNames.forEach((name) => {
    const instances = nonDeload
      .filter((w) => w.exercises.some((e) => e.name === name))
      .map((w) => {
        const ex = w.exercises.find((e) => e.name === name);
        const maxW = Math.max(...ex.sets.map((s) => s.weight));
        const repsAtMax = Math.min(...ex.sets.filter((s) => s.weight === maxW).map((s) => s.reps));
        return { weight: maxW, reps: repsAtMax };
      });
    if (instances.length >= 3) {
      const last3 = instances.slice(-3);
      if (last3[2].weight <= last3[0].weight && last3[2].reps <= last3[0].reps) stalledCount++;
    }
  });

  const recentRpes = nonDeload.slice(-3).map((w) => w.rpe).filter((r) => typeof r === "number");
  const avgRecentRpe = recentRpes.length ? recentRpes.reduce((a, b) => a + b, 0) / recentRpes.length : null;

  const reasons = [];
  if (weeksSince >= 4) reasons.push(`It's been ${weeksSince} weeks since your last deload.`);
  if (stalledCount >= 2) reasons.push(`${stalledCount} exercises haven't added weight or reps over your last few sessions.`);
  if (avgRecentRpe && avgRecentRpe >= 8.5) reasons.push(`Recent sessions are averaging RPE ${avgRecentRpe.toFixed(1)} — fatigue is climbing.`);

  const recommended = weeksSince >= 6 || (weeksSince >= 4 && (stalledCount >= 2 || (avgRecentRpe && avgRecentRpe >= 8.5)));
  return { recommended, weeksSince, reasons };
}

function suggestDeloadTarget(exerciseName, targetRepsStr, workouts) {
  for (let i = workouts.length - 1; i >= 0; i--) {
    if (workouts[i].isDeload) continue; // base the deload off your real recent working weight
    const match = workouts[i].exercises?.find((e) => e.name === exerciseName);
    if (!match || match.sets.length === 0) continue;
    const lastWeight = Math.max(...match.sets.map((s) => s.weight));
    const target = parseRepTarget(targetRepsStr);
    const deloadWeight = lastWeight ? Math.round((lastWeight * 0.6) / 5) * 5 : null;
    const repsGoal = target && (target.type === "range" || target.type === "fixed") ? target.min : null;
    return {
      weight: deloadWeight,
      reps: repsGoal,
      note: `Deload week — ${deloadWeight ? `~${deloadWeight} lb (about 60% of your recent working weight)` : "keep it light"}, fewer sets. Trust it — this is what lets the next block actually work.`,
    };
  }
  return { weight: null, reps: null, note: "Deload week — keep today light and easy." };
}

function WorkoutLogger({ day, dayIndex, userId, initialDraft, workouts, deloadActive, onCancel, onFinish, prs }) {
  const [log, setLog] = useState(
    initialDraft?.log ||
      day.exercises.map((ex) => {
        const suggestion = deloadActive
          ? suggestDeloadTarget(ex.name, ex.reps, workouts || [])
          : suggestNextTarget(ex.name, ex.reps, workouts || []);
        const fullSetCount = Math.max(1, ex.sets || 1);
        const setCount = deloadActive ? Math.max(1, Math.round(fullSetCount * 0.6)) : fullSetCount;
        return {
          name: ex.name,
          target: `${ex.sets}×${ex.reps}`,
          progressNote: suggestion?.note || null,
          sets: Array.from({ length: setCount }, () => ({
            weight: suggestion?.weight != null ? String(suggestion.weight) : "",
            reps: suggestion?.reps != null ? String(suggestion.reps) : "",
            confirmed: false,
          })),
          note: "",
        };
      })
  );
  const [noteOpenFor, setNoteOpenFor] = useState(null);
  const [phase, setPhase] = useState("log"); // 'log' | 'summary'
  const [rpe, setRpe] = useState(null);
  const [comment, setComment] = useState("");
  const startTimeRef = useRef(initialDraft?.startTime || Date.now());
  const [elapsed, setElapsed] = useState(Math.floor((Date.now() - startTimeRef.current) / 1000));

  // Autosave the in-progress workout locally so closing the app mid-session doesn't lose it.
  useEffect(() => {
    if (phase !== "log") return;
    try {
      localStorage.setItem(draftKey(userId), JSON.stringify({
        dayIndex, dayName: day.name, startTime: startTimeRef.current, log, savedAt: Date.now(),
      }));
    } catch { /* storage unavailable, degrade silently — nothing else we can do here */ }
  }, [log, phase, dayIndex, day.name, userId]);

  // Mobile browsers can silently reload a backgrounded tab (e.g. switching to
  // another app), which behaves just like closing and reopening even though it
  // doesn't look like it. Force a save the moment the tab is hidden, not just
  // when a set is confirmed, so nothing is lost in that window.
  // Reads from logRef (kept instantly in sync by setLogSynced) rather than the
  // `log` variable directly — that avoids a real race where switching apps
  // immediately after typing could fire this before the effect had a chance
  // to re-register with the latest value.
  useEffect(() => {
    if (phase !== "log") return;
    const syncNow = () => {
      const currentLog = logRef.current;
      try {
        localStorage.setItem(draftKey(userId), JSON.stringify({
          dayIndex, dayName: day.name, startTime: startTimeRef.current, log: currentLog, savedAt: Date.now(),
        }));
      } catch { /* ignore */ }
      setActiveDraft(userId, { dayIndex, dayName: day.name, startTime: startTimeRef.current, log: currentLog }).catch(() => {});
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") syncNow();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", syncNow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", syncNow);
    };
  }, [phase, dayIndex, day.name, userId]);

  const clearDraft = () => {
    try { localStorage.removeItem(draftKey(userId)); } catch { /* ignore */ }
    clearActiveDraft(userId).catch(() => {});
  };

  useEffect(() => {
    if (phase !== "log") return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const logRef = useRef(log);
  const setLogSynced = (updater) => {
    const next = typeof updater === "function" ? updater(logRef.current) : updater;
    logRef.current = next;
    setLog(next);
  };

  const updateSet = (exIdx, setIdx, field, value) => {
    setLogSynced((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value.replace(/[^0-9.]/g, "") };
      next[exIdx] = { ...next[exIdx], sets };
      return next;
    });
  };

  const addSet = (exIdx) => {
    setLogSynced((prev) => {
      const next = [...prev];
      const sets = next[exIdx].sets;
      const last = sets[sets.length - 1] || { weight: "", reps: "" };
      next[exIdx] = { ...next[exIdx], sets: [...sets, { weight: last.weight, reps: last.reps, confirmed: false }] };
      return next;
    });
  };

  const confirmSet = (exIdx, setIdx) => {
    setLogSynced((prev) => {
      const next = [...prev];
      const sets = [...next[exIdx].sets];
      const wasConfirmed = sets[setIdx].confirmed;
      sets[setIdx] = { ...sets[setIdx], confirmed: !wasConfirmed };
      next[exIdx] = { ...next[exIdx], sets };
      // Sync to the server immediately on confirm — a deliberate checkpoint that
      // survives even if local storage or the device itself lets us down.
      if (!wasConfirmed) {
        setActiveDraft(userId, { dayIndex, dayName: day.name, startTime: startTimeRef.current, log: next }).catch(() => {});
      }
      return next;
    });
  };

  const removeSet = (exIdx, setIdx) => {
    setLogSynced((prev) => {
      const next = [...prev];
      const sets = next[exIdx].sets.filter((_, i) => i !== setIdx);
      next[exIdx] = { ...next[exIdx], sets: sets.length ? sets : [{ weight: "", reps: "" }] };
      return next;
    });
  };

  const updateNote = (exIdx, value) => {
    setLogSynced((prev) => {
      const next = [...prev];
      next[exIdx] = { ...next[exIdx], note: value };
      return next;
    });
  };

  const totalVolume = log.reduce(
    (sum, ex) => sum + ex.sets.reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseFloat(set.reps) || 0), 0), 0
  );

  const goToSummary = () => {
    const hasAnySet = log.some((ex) => ex.sets.some((s) => s.weight !== "" && s.reps !== ""));
    if (!hasAnySet) return;
    setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    setPhase("summary");
  };

  const saveWorkout = () => {
    const exercises = log
      .map((ex) => ({
        name: ex.name,
        sets: ex.sets.filter((s) => s.weight !== "" && s.reps !== "").map((s) => ({ weight: parseFloat(s.weight), reps: parseFloat(s.reps) })),
        note: ex.note.trim() || undefined,
      }))
      .filter((ex) => ex.sets.length > 0);
    if (exercises.length === 0) return;
    clearDraft();
    onFinish({
      dayName: day.name,
      exercises,
      volume: totalVolume,
      durationSeconds: elapsed,
      rpe,
      comment: comment.trim() || undefined,
      isDeload: !!deloadActive,
    });
  };

  if (phase === "summary") {
    const totalSets = log.reduce((sum, ex) => sum + ex.sets.filter((s) => s.weight !== "" && s.reps !== "").length, 0);
    return (
      <div style={{ padding: "20px 18px 110px" }}>
        <button onClick={() => setPhase("log")} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}>
          <ChevronLeft size={18} /> Back to workout
        </button>

        <h1 style={{ ...TITLE, marginBottom: 4 }}>Workout Complete</h1>
        <p style={{ ...P, marginTop: 6 }}>{day.name}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <StatCard icon={<Clock size={18} color={T.moss} />} label="Duration" value={formatDuration(elapsed)} />
          <StatCard icon={<TrendingUp size={18} color={T.rust} />} label="Volume" value={`${Math.round(totalVolume).toLocaleString()} lb`} />
        </div>

        <div style={{ ...CARD, marginBottom: 18, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: T.chalkDim }}>Exercises</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalk, fontSize: 13 }}>{log.length}</div>
        </div>
        <div style={{ ...CARD, marginBottom: 18, display: "flex", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, color: T.chalkDim }}>Sets completed</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalk, fontSize: 13 }}>{totalSets}</div>
        </div>

        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
            Effort (RPE)
          </div>
          <div style={{ fontSize: 12.5, color: T.chalkDim, marginBottom: 12 }}>How hard did that feel, 1 (easy) to 10 (max effort)?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setRpe(n === rpe ? null : n)}
                style={{
                  width: 34, height: 34, borderRadius: "50%", cursor: "pointer",
                  border: `1.5px solid ${rpe === n ? T.rust : T.line}`,
                  background: rpe === n ? T.rust : T.iron2,
                  color: T.chalk, fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
                }}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
            Notes on this session
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How did it go? Anything to remember for next time…"
            rows={4}
            style={{ ...INPUT, resize: "vertical", fontFamily: "Inter, sans-serif", lineHeight: 1.4 }}
          />
        </div>

        <button onClick={saveWorkout} style={BTN_PRIMARY}>
          <Check size={18} style={{ marginRight: 6 }} /> Save workout
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px 18px 110px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => { clearDraft(); onCancel(); }} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={18} /> Cancel
        </button>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.rust, fontSize: 13 }}>{Math.round(totalVolume).toLocaleString()} lb total</div>
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        background: T.iron2, border: `1px solid ${T.line}`, borderRadius: 12, padding: "12px 0", marginBottom: 18,
      }}>
        <Clock size={16} color={T.moss} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 22, color: T.chalk, letterSpacing: 1 }}>
          {formatDuration(elapsed)}
        </span>
      </div>

      <h1 style={{ ...TITLE, marginBottom: deloadActive ? 10 : 20 }}>{day.name}</h1>
      {deloadActive && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, background: "rgba(232,185,74,0.1)",
          border: `1px solid ${T.brass}`, borderRadius: 10, padding: "10px 12px", marginBottom: 18, fontSize: 12.5, color: T.brass,
        }}>
          <Sparkles size={15} style={{ flexShrink: 0 }} />
          Deload week — lighter weight, fewer sets, on purpose.
        </div>
      )}

      {log.map((ex, exIdx) => {
        const currentPR = prs[ex.name]?.weight;
        const noteOpen = noteOpenFor === exIdx;
        return (
          <div key={ex.name + exIdx} style={{ ...CARD, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, color: T.chalk }}>{ex.name}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <button
                  onClick={() => setNoteOpenFor(noteOpen ? null : exIdx)}
                  title="Private note"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: ex.note ? T.brass : T.chalkDim, display: "flex", alignItems: "center",
                  }}
                >
                  <StickyNote size={15} />
                </button>
                <div style={{ fontSize: 12, color: T.chalkDim, fontFamily: "'JetBrains Mono', monospace" }}>{ex.target}</div>
              </div>
            </div>
            {currentPR && <div style={{ fontSize: 11.5, color: T.brass, marginBottom: 6 }}>PR: {currentPR} lb</div>}
            {ex.progressNote && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 6, fontSize: 12, color: T.moss,
                background: "rgba(143,184,155,0.1)", border: `1px solid rgba(143,184,155,0.3)`,
                borderRadius: 8, padding: "7px 10px", marginBottom: 10, lineHeight: 1.4,
              }}>
                <TrendingUp size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{ex.progressNote}</span>
              </div>
            )}

            {noteOpen && (
              <textarea
                value={ex.note}
                onChange={(e) => updateNote(exIdx, e.target.value)}
                placeholder="Private note for this exercise — form cues, pain, equipment used…"
                rows={2}
                autoFocus
                style={{ ...INPUT, resize: "vertical", fontSize: 12.5, fontFamily: "Inter, sans-serif", marginBottom: 10, padding: "8px 10px" }}
              />
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 22, fontSize: 12, color: T.chalkDim, fontFamily: "'JetBrains Mono', monospace" }}>{setIdx + 1}</div>
                  <input value={set.weight} onChange={(e) => updateSet(exIdx, setIdx, "weight", e.target.value)} placeholder="lb" inputMode="decimal" style={{ ...INPUT, padding: "10px 12px", fontSize: 14 }} />
                  <span style={{ color: T.chalkDim, fontSize: 13 }}>×</span>
                  <input value={set.reps} onChange={(e) => updateSet(exIdx, setIdx, "reps", e.target.value)} placeholder="reps" inputMode="decimal" style={{ ...INPUT, padding: "10px 12px", fontSize: 14 }} />
                  <button
                    onClick={() => confirmSet(exIdx, setIdx)}
                    title={set.confirmed ? "Confirmed — tap to undo" : "Confirm this set"}
                    style={{
                      width: 32, height: 32, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                      border: `1.5px solid ${set.confirmed ? T.moss : T.line}`,
                      background: set.confirmed ? T.moss : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Check size={15} color={set.confirmed ? T.iron : T.chalkDim} />
                  </button>
                  <button onClick={() => removeSet(exIdx, setIdx)} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer" }}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={() => addSet(exIdx)} style={{ ...BTN_SECONDARY, marginTop: 10, padding: "8px 12px", fontSize: 13, width: "auto" }}>
              <Plus size={14} style={{ marginRight: 4 }} /> Add set
            </button>
          </div>
        );
      })}

      <button onClick={goToSummary} style={{ ...BTN_PRIMARY, marginTop: 8 }}>
        <Check size={18} style={{ marginRight: 6 }} /> Finish workout
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* PROFILE SCREEN — Xbox-style achievement showcase                        */
/* ---------------------------------------------------------------------- */
function ProfileScreen({ name, isMe, myAchievementIds, myStats, onBack }) {
  const [loading, setLoading] = useState(!isMe);
  const [remoteData, setRemoteData] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (isMe) return;
    let cancelled = false;
    (async () => {
      const row = await getProfileByName(name);
      if (!cancelled) {
        setRemoteData(row ? {
          name: row.name, streak: row.streak, totalWorkouts: null,
          achievementIds: row.achievement_ids || [], updatedAt: row.updated_at,
        } : null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [name, isMe]);

  const unlockedIds = isMe ? myAchievementIds : (remoteData?.achievementIds || []);
  const unlockedSet = new Set(unlockedIds);
  const streak = isMe ? myStats?.currentStreak : remoteData?.streak;
  const totalWorkouts = isMe ? myStats?.totalWorkouts : remoteData?.totalWorkouts;

  return (
    <div style={{ padding: "20px 18px 100px" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, marginBottom: 16, padding: 0 }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 58, height: 58, borderRadius: "50%", background: T.iron3, border: `2px solid ${T.rust}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Oswald', sans-serif", fontSize: 24, color: T.rust, flexShrink: 0,
        }}>
          {name.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 style={{ ...TITLE, fontSize: 24 }}>{name}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            {typeof streak === "number" && (
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: T.rust, fontSize: 13 }}>
                <Flame size={14} /> {streak}d streak
              </span>
            )}
            {typeof totalWorkouts === "number" && (
              <span style={{ color: T.chalkDim, fontSize: 13 }}>{totalWorkouts} workouts</span>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ color: T.chalkDim, padding: 20 }}>Loading profile…</div>
      ) : !isMe && !remoteData ? (
        <div style={{ ...CARD, textAlign: "center", color: T.chalkDim, marginBottom: 20 }}>
          This lifter hasn't unlocked any badges yet.
        </div>
      ) : (
        <>
          <div style={{ ...CARD, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase" }}>Achievements</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.brass, fontSize: 14 }}>
                {unlockedIds.length} / {ACHIEVEMENTS.length}
              </div>
            </div>
            <div style={{ height: 8, background: T.iron3, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${(unlockedIds.length / ACHIEVEMENTS.length) * 100}%`,
                background: T.brass, transition: "width .4s ease",
              }} />
            </div>
          </div>

          {selected && (
            <div style={{
              ...CARD, marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start",
              border: `1.5px solid ${unlockedSet.has(selected.id) ? TIER_COLOR[selected.tier] : T.line}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                background: unlockedSet.has(selected.id) ? TIER_COLOR[selected.tier] : T.iron3,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {React.createElement(ACHIEVEMENT_ICONS[selected.icon] || Award, {
                  size: 18, color: unlockedSet.has(selected.id) ? T.iron : T.chalkDim,
                })}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: T.chalk, fontWeight: 600, marginBottom: 2 }}>{selected.name}</div>
                <div style={{ fontSize: 12.5, color: T.chalkDim, lineHeight: 1.4, marginBottom: 4 }}>{selected.desc}</div>
                <div style={{ fontSize: 11, color: unlockedSet.has(selected.id) ? TIER_COLOR[selected.tier] : T.chalkDim, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {selected.category} · {selected.tier}{unlockedSet.has(selected.id) ? "" : " · locked"}
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {ACHIEVEMENTS.map((a) => {
              const unlocked = unlockedSet.has(a.id);
              const Icon = ACHIEVEMENT_ICONS[a.icon] || Award;
              return (
                <button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 2 }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: unlocked ? TIER_COLOR[a.tier] : T.iron2,
                    border: `1.5px solid ${unlocked ? TIER_COLOR[a.tier] : T.line}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    opacity: unlocked ? 1 : 0.55,
                  }}>
                    <Icon size={19} color={unlocked ? T.iron : T.chalkDim} />
                  </div>
                  <div style={{
                    fontSize: 9.5, color: unlocked ? T.chalkDim : "rgba(169,167,159,0.5)", textAlign: "center",
                    lineHeight: 1.2, maxWidth: 62, overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {a.name}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* LEADERBOARD                                                             */
/* ---------------------------------------------------------------------- */
function Leaderboard({ myName, refreshKey, onOpenProfile }) {
  const [entries, setEntries] = useState(null);
  const [metric, setMetric] = useState("volume30d");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await getAllProfiles();
        if (!cancelled) setEntries(profiles.map((p) => ({ name: p.name, volume30d: p.volume_30d, streak: p.streak })));
      } catch {
        if (!cancelled) setEntries([]);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  if (entries === null) return <div style={{ padding: 24, color: T.chalkDim }}>Loading leaderboard…</div>;

  const sorted = [...entries].sort((a, b) => (b[metric] || 0) - (a[metric] || 0));
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);
  const medalColor = [T.brass, "#C9CDD3", "#B9764F"];

  return (
    <div style={{ padding: "24px 18px 100px" }}>
      <h1 style={TITLE}>Leaderboard</h1>
      <div style={{ display: "flex", gap: 8, margin: "14px 0 22px" }}>
        <ToggleBtn active={metric === "volume30d"} onClick={() => setMetric("volume30d")}>Volume</ToggleBtn>
        <ToggleBtn active={metric === "streak"} onClick={() => setMetric("streak")}>Streak</ToggleBtn>
      </div>

      {sorted.length === 0 && (
        <div style={{ ...CARD, textAlign: "center", color: T.chalkDim }}>Nobody's on the board yet. Finish a workout to claim the top spot.</div>
      )}

      {top3.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 14, marginBottom: 24 }}>
          {[top3[1], top3[0], top3[2]].map((entry, i) => {
            const rank = [1, 0, 2][i];
            return entry ? (
              <button
                key={entry.name}
                onClick={() => onOpenProfile && onOpenProfile(entry.name)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, background: "none", border: "none", cursor: onOpenProfile ? "pointer" : "default" }}
              >
                <Medal size={20} color={medalColor[rank]} />
                <div style={{ fontFamily: "'Oswald', sans-serif", color: T.chalk, fontSize: 13, maxWidth: 76, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.name}
                </div>
                <PlateStack filled={rank === 0 ? 4 : rank === 1 ? 3 : 2} total={4} color={medalColor[rank]} size={rank === 0 ? 26 : 20} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalkDim, fontSize: 11.5 }}>
                  {metric === "volume30d" ? `${Math.round(entry.volume30d || 0).toLocaleString()} lb` : `${entry.streak || 0}d`}
                </div>
              </button>
            ) : <div key={i} />;
          })}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rest.map((entry, i) => (
          <button
            key={entry.name}
            onClick={() => onOpenProfile && onOpenProfile(entry.name)}
            style={{ ...CARD, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, border: entry.name === myName ? `1.5px solid ${T.rust}` : `1px solid ${T.line}`, cursor: onOpenProfile ? "pointer" : "default", textAlign: "left", width: "100%" }}
          >
            <div style={{ width: 22, fontFamily: "'JetBrains Mono', monospace", color: T.chalkDim, fontSize: 13 }}>{i + 4}</div>
            <div style={{ flex: 1, fontSize: 14, color: T.chalk }}>{entry.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", color: T.chalkDim, fontSize: 13 }}>
              {metric === "volume30d" ? `${Math.round(entry.volume30d || 0).toLocaleString()} lb` : `${entry.streak || 0}d`}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 20, border: `1px solid ${active ? T.rust : T.line}`,
      background: active ? T.rust : "transparent", color: active ? T.chalk : T.chalkDim,
      fontSize: 13, fontFamily: "Inter, sans-serif", cursor: "pointer",
    }}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/* COMMUNITY CHAT — THE GYM FLOOR                                          */
/* ---------------------------------------------------------------------- */
function Chat({ myName, myUserId, isAdmin, streak, achievementCount, isTop, onOpenProfile, onActivityChange }) {
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setMessages(await getChatMessages());
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [load]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");
    try {
      await sendChatMessage(myUserId, { name: myName, text, streak, achievementCount, isTop });
      setMessages(await getChatMessages());

      const activity = await getCommunityActivity(myUserId);
      activity.chatCount = (activity.chatCount || 0) + 1;
      await setCommunityActivity(myUserId, activity);
      onActivityChange && onActivityChange();
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id, mine) => {
    if (!window.confirm(mine ? "Delete your message?" : "Delete this message? (admin)")) return;
    try {
      await deleteChatMessage(id);
      setMessages(await getChatMessages());
    } catch (e) {
      alert(`Couldn't delete that message: ${e.message || "unknown error"}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "24px 18px 0" }}>
      <h1 style={{ ...TITLE, marginBottom: 4 }}>The Gym Floor</h1>
      <div style={{ color: T.chalkDim, fontSize: 13, marginBottom: 14 }}>One room. Everyone training right now.</div>

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch", paddingBottom: 12, minHeight: 0 }}>
        {messages === null && <div style={{ color: T.chalkDim, padding: 20 }}>Loading chat…</div>}
        {messages && messages.length === 0 && (
          <div style={{ color: T.chalkDim, padding: "20px 0", textAlign: "center" }}>No messages yet. Say hey to the first person to see this.</div>
        )}
        {messages && messages.map((m) => {
          const mine = m.userId === myUserId;
          const canDelete = mine || isAdmin;
          return (
            <div key={m.id} style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start", marginBottom: 12 }}>
              <div style={{ maxWidth: "82%" }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
                  marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0,
                  justifyContent: mine ? "flex-end" : "flex-start",
                }}>
                  <button
                    onClick={() => onOpenProfile && onOpenProfile(m.name)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      background: "none", border: "none", cursor: onOpenProfile ? "pointer" : "default", padding: 0,
                    }}
                  >
                    {m.isTop && <Trophy size={12} color={T.brass} />}
                    <span style={{ fontSize: 11.5, color: mine ? T.chalkDim : T.chalk, fontWeight: 600 }}>{m.name}</span>
                    {typeof m.streak === "number" && m.streak > 0 && (
                      <span style={{ display: "flex", alignItems: "center", gap: 2, color: T.rust, fontSize: 11 }}>
                        <Flame size={11} /> {m.streak}
                      </span>
                    )}
                    {typeof m.achievementCount === "number" && m.achievementCount > 0 && (
                      <span style={{
                        display: "flex", alignItems: "center", gap: 2, fontSize: 10.5, color: T.brass,
                        border: `1px solid ${T.brass}`, borderRadius: 10, padding: "1px 6px",
                      }}>
                        <Award size={10} /> {m.achievementCount}
                      </span>
                    )}
                    <span style={{ fontSize: 10.5, color: T.chalkDim }}>· {formatRelativeTime(m.ts)}</span>
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(m.id, mine)}
                      title={mine ? "Delete your message" : "Delete message (admin)"}
                      style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
                <div style={{
                  background: mine ? T.rust : T.iron3, color: T.chalk, padding: "9px 13px", borderRadius: 14,
                  borderBottomRightRadius: mine ? 4 : 14, borderBottomLeftRadius: mine ? 14 : 4,
                  fontSize: 14, lineHeight: 1.4, wordBreak: "break-word",
                }}>
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, padding: "12px 0 20px", borderTop: `1px solid ${T.line}` }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Say something to the floor…" style={{ ...INPUT, flex: 1 }} />
        <button onClick={send} disabled={sending || !draft.trim()} style={{ ...ROUND_BTN, background: T.rust, opacity: draft.trim() ? 1 : 0.5 }}>
          <Send size={16} color={T.chalk} />
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ABOUT US                                                                 */
/* ---------------------------------------------------------------------- */
function AboutTab({ onSignOut, accountEmail }) {
  const [communityStats, setCommunityStats] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const profiles = await getAllProfiles();
        const volume = profiles.reduce((sum, p) => sum + (p.volume_30d || 0), 0);
        if (!cancelled) setCommunityStats({ members: profiles.length, volume });
      } catch {
        if (!cancelled) setCommunityStats({ members: 0, volume: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div style={{ padding: "24px 18px 100px" }}>
      <div style={{
        fontSize: 10.5, padding: "3px 8px", borderRadius: 20, color: T.iron, fontWeight: 600,
        background: T.brass, display: "inline-flex", alignItems: "center", gap: 4, marginBottom: 10,
      }}>
        <ShieldCheck size={12} /> {ABOUT.eyebrow}
      </div>
      <h1 style={TITLE}>About Loadout</h1>
      <p style={{ ...P, marginTop: 10 }}>{ABOUT.mission}</p>

      {communityStats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
          <StatCard icon={<Users size={18} color={T.moss} />} label="Lifters on the floor" value={`${communityStats.members}`} />
          <StatCard icon={<TrendingUp size={18} color={T.rust} />} label="Lb moved, 30 days" value={`${Math.round(communityStats.volume).toLocaleString()}`} />
        </div>
      )}

      <div style={{ ...CARD, marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: T.iron3, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={18} color={T.brass} />
          </div>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 14, color: T.chalk, textTransform: "uppercase", marginBottom: 6 }}>
              From the founder
            </div>
            <div style={{ fontSize: 13.5, color: T.chalkDim, lineHeight: 1.5, fontStyle: "italic" }}>
              "{ABOUT.founderNote}"
            </div>
          </div>
        </div>
      </div>

      <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 }}>
        What we bring to the floor
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 26 }}>
        {VALUE_PILLARS.map(({ icon: Icon, title, body }) => (
          <div key={title} style={{ ...CARD, display: "flex", gap: 12 }}>
            <Icon size={18} color={T.rust} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 14, color: T.chalk, marginBottom: 4, fontWeight: 600 }}>{title}</div>
              <div style={{ fontSize: 13, color: T.chalkDim, lineHeight: 1.45 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Heart size={16} color={T.rust} />
        <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.chalk, textTransform: "uppercase", letterSpacing: 0.5 }}>
          Our sponsors
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {SPONSORS.map((s) => (
          <div key={s.name} style={CARD}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: T.iron3, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "'Oswald', sans-serif", fontSize: 15, color: T.brass,
              }}>
                {s.name.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: T.chalk, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12.5, color: T.chalkDim, lineHeight: 1.4, marginTop: 2 }}>{s.tagline}</div>
              </div>
              {s.url && (
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: T.rust, flexShrink: 0 }}>
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.line}`, marginTop: 28, paddingTop: 20 }}>
        {accountEmail && <div style={{ fontSize: 12.5, color: T.chalkDim, marginBottom: 10 }}>Signed in as {accountEmail}</div>}
        <button onClick={onSignOut} style={BTN_SECONDARY}>Sign out</button>
      </div>
    </div>
  );
}
function Nav({ tab, setTab }) {
  const items = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "programs", icon: Dumbbell, label: "Plan" },
    { id: "leaderboard", icon: Trophy, label: "Ranks" },
    { id: "chat", icon: MessageCircle, label: "Floor" },
    { id: "about", icon: Heart, label: "About" },
  ];
  return (
    <div style={{ display: "flex", borderTop: `1px solid ${T.line}`, background: T.iron, position: "sticky", bottom: 0, left: 0, right: 0 }}>
      {items.map(({ id, icon: Icon, label }) => (
        <button key={id} onClick={() => setTab(id)} style={{
          flex: 1, background: "none", border: "none", padding: "12px 0 14px", display: "flex",
          flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer",
          color: tab === id ? T.rust : T.chalkDim,
        }}>
          <Icon size={20} />
          <span style={{ fontSize: 10.5, fontFamily: "Inter, sans-serif", letterSpacing: 0.3 }}>{label}</span>
        </button>
      ))}
    </div>
  );
}
function FinishBanner({ data, onClose }) {
  return (
    <div style={{
      margin: "18px 18px 0", padding: "14px 16px", borderRadius: 12, background: "rgba(143,184,155,0.14)",
      border: `1px solid ${T.moss}`, display: "flex", alignItems: "center", gap: 10,
    }}>
      <Check size={18} color={T.moss} />
      <div style={{ flex: 1, fontSize: 13.5, color: T.chalk }}>
        Workout logged — {data.durationSeconds ? `${formatDuration(data.durationSeconds)} · ` : ""}{Math.round(data.volume).toLocaleString()} lb moved{data.gotPR ? ". New PR set! 🏆" : "."}
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", color: T.chalkDim, cursor: "pointer" }}>
        <X size={16} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* ACHIEVEMENT TOAST — the dopamine hit                                    */
/* ---------------------------------------------------------------------- */
function AchievementToast({ achievement, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4200);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;
  const Icon = ACHIEVEMENT_ICONS[achievement.icon] || Award;
  const color = TIER_COLOR[achievement.tier] || T.brass;

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute", top: 16, left: 16, right: 16, zIndex: 50,
        display: "flex", alignItems: "center", gap: 12, cursor: "pointer",
        background: T.iron2, border: `1.5px solid ${color}`, borderRadius: 14,
        padding: "12px 14px", boxShadow: `0 0 24px ${color}55, 0 8px 20px rgba(0,0,0,0.4)`,
        animation: "toastDrop .4s cubic-bezier(.2,1.4,.4,1)",
      }}
    >
      <div style={{
        width: 42, height: 42, borderRadius: "50%", flexShrink: 0, background: color,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={20} color={T.iron} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10.5, color, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: 600 }}>
          Achievement Unlocked
        </div>
        <div style={{ fontSize: 14.5, color: T.chalk, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: 0.3 }}>
          {achievement.name}
        </div>
      </div>
      <Sparkles size={16} color={color} style={{ flexShrink: 0 }} />
    </div>
  );
}

export default function Loadout() {
  const [session, setSession] = useState(undefined); // undefined = checking, null = logged out
  const [profileRow, setProfileRow] = useState(null); // row from `profiles` table (null until loaded/created)
  const [checkingProfile, setCheckingProfile] = useState(false);
  const [userProgram, setUserProgram] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [prs, setPrs] = useState({});
  const [tab, setTab] = useState("dashboard");
  const [activeDayIdx, setActiveDayIdx] = useState(null);
  const [lbRefresh, setLbRefresh] = useState(0);
  const [justFinished, setJustFinished] = useState(null);
  const [communityActivity, setCommunityActivity] = useState({ chatCount: 0, programCommentCount: 0, programsTriedIds: [] });
  const [achievementIds, setAchievementIds] = useState([]);
  const [achievementStats, setAchievementStats] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [toastQueue, setToastQueue] = useState([]);
  const [resumeDraft, setResumeDraft] = useState(null);
  const resumeCheckedRef = useRef(false);
  const [pendingEditProgram, setPendingEditProgram] = useState(false);
  const prevAchievementIdsRef = useRef(null); // null = not computed yet (skip celebrating on first load)

  // Track auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => listener.subscription.unsubscribe();
  }, []);

  // Once logged in, load (or discover we need to create) the profile row + all training data
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setCheckingProfile(true);
    (async () => {
      const row = await getProfile(session.user.id);
      if (cancelled) return;
      setProfileRow(row);
      setCheckingProfile(false);
      if (!row) return; // ChooseName screen will handle profile creation

      const [prog, w, pr, activity] = await Promise.all([
        getUserProgram(session.user.id),
        getWorkouts(session.user.id),
        getPRs(session.user.id),
        getCommunityActivity(session.user.id),
      ]);
      if (cancelled) return;
      setUserProgram(prog);
      setWorkouts(w);
      setPrs(pr);
      setCommunityActivity(activity);

      // Resume an in-progress workout if one was left running when the app closed.
      // Server-side draft is checked as one source, local storage as another —
      // whichever was actually saved more recently wins. A server draft from an
      // earlier confirmed set should NOT override newer edits sitting locally
      // that haven't synced yet.
      // Guarded so it only runs once per login — this effect can otherwise fire
      // a second time right after setProfileRow above updates profileRow?.id.
      if (!resumeCheckedRef.current) {
        resumeCheckedRef.current = true;
        try {
          let serverDraft = null;
          try {
            serverDraft = await getActiveDraft(session.user.id);
          } catch { /* server draft unavailable, local storage will be used instead */ }

          let localDraft = null;
          try {
            const raw = localStorage.getItem(draftKey(session.user.id));
            if (raw) localDraft = JSON.parse(raw);
          } catch { /* corrupted local draft, ignore */ }

          const draft =
            serverDraft && localDraft
              ? (localDraft.savedAt || 0) > (serverDraft.savedAt || 0) ? localDraft : serverDraft
              : serverDraft || localDraft;

          if (prog && draft && typeof draft.dayIndex === "number" && prog.days[draft.dayIndex] && draft.log) {
            setResumeDraft(draft);
            setActiveDayIdx(draft.dayIndex);
            setTab("logger");
          }
        } catch { /* corrupted or missing draft, just ignore and start fresh */ }
      }
    })();
    return () => { cancelled = true; };
  }, [session, profileRow?.id]);

  const stats = computeStats(workouts);

  // Recompute achievements and broadcast the public snapshot whenever training data changes.
  useEffect(() => {
    if (!session || !profileRow || !userProgram) return;
    let cancelled = false;
    (async () => {
      const compatProfile = { name: profileRow.name, createdAt: new Date(profileRow.created_at).getTime(), program: userProgram };
      const fullStats = await buildAchievementStats(compatProfile, workouts, prs, communityActivity);
      const ids = ACHIEVEMENTS.filter((a) => a.check(fullStats)).map((a) => a.id);
      if (cancelled) return;

      if (prevAchievementIdsRef.current !== null) {
        const newlyUnlocked = ids.filter((id) => !prevAchievementIdsRef.current.includes(id));
        if (newlyUnlocked.length > 0) {
          const newAchievements = ACHIEVEMENTS.filter((a) => newlyUnlocked.includes(a.id));
          setToastQueue((q) => [...q, ...newAchievements]);
        }
      }
      prevAchievementIdsRef.current = ids;

      setAchievementIds(ids);
      setAchievementStats(fullStats);
      await updatePublicSnapshot(session.user.id, {
        currentStreak: fullStats.currentStreak,
        volume30: fullStats.volume30 ?? stats.volume30,
        achievementIds: ids,
      });
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, profileRow, userProgram, workouts, prs, communityActivity]);

  const refreshCommunityActivity = useCallback(async () => {
    if (!session) return;
    setCommunityActivity(await getCommunityActivity(session.user.id));
  }, [session]);

  const handleSaveProgram = async (program) => {
    setUserProgram(program);
    await setUserProgram_db(session.user.id, program);

    const activity = { ...communityActivity };
    activity.programsTriedIds = activity.programsTriedIds || [];
    if (!activity.programsTriedIds.includes(program.sourceId)) {
      activity.programsTriedIds = [...activity.programsTriedIds, program.sourceId];
      setCommunityActivity(activity);
      await setCommunityActivity_db(session.user.id, activity);
    }
    setTab("dashboard");
  };

  const startWorkout = (dayIdx) => {
    if (session) {
      try { localStorage.removeItem(draftKey(session.user.id)); } catch { /* ignore */ }
      clearActiveDraft(session.user.id).catch(() => {});
    }
    setResumeDraft(null);
    setActiveDayIdx(dayIdx);
    setTab("logger");
  };

  const finishWorkout = async (result) => {
    const entry = { id: Date.now(), date: todayStr(), finishedAt: Date.now(), ...result };
    await insertWorkout(session.user.id, entry);
    const newWorkouts = [...workouts, entry];
    setWorkouts(newWorkouts);

    const newPrs = { ...prs };
    let gotPR = false;
    for (const ex of result.exercises) {
      const maxW = Math.max(...ex.sets.map((s) => s.weight));
      if (!newPrs[ex.name] || maxW > newPrs[ex.name].weight) {
        newPrs[ex.name] = { weight: maxW, date: todayStr() };
        gotPR = true;
        await upsertPR(session.user.id, ex.name, maxW, todayStr());
      }
    }
    setPrs(newPrs);

    const s = computeStats(newWorkouts);
    await updatePublicSnapshot(session.user.id, { currentStreak: s.streak, volume30: s.volume30, achievementIds });
    setLbRefresh((x) => x + 1);
    setJustFinished({ volume: result.volume, durationSeconds: result.durationSeconds, gotPR });
    setActiveDayIdx(null);
    setTab("dashboard");

    if (result.isDeload && profileRow?.deload_state) {
      const doneDayNames = Array.from(new Set([...(profileRow.deload_state.doneDayNames || []), result.dayName]));
      const allDayNames = new Set(userProgram.days.map((d) => d.name));
      const complete = [...allDayNames].every((n) => doneDayNames.includes(n));
      const nextState = complete ? null : { ...profileRow.deload_state, doneDayNames };
      await setDeloadState(session.user.id, nextState);
      setProfileRow((prev) => ({ ...prev, deload_state: nextState }));
    }
  };

  const startDeload = async () => {
    const state = { startedAt: Date.now(), doneDayNames: [] };
    await setDeloadState(session.user.id, state);
    setProfileRow((prev) => ({ ...prev, deload_state: state }));
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfileRow(null);
    setUserProgram(null);
    setWorkouts([]);
    setPrs({});
    resumeCheckedRef.current = false;
    setTab("dashboard");
  };

  if (session === undefined) {
    return <Shell><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.chalkDim }}>Loading…</div></Shell>;
  }

  if (!session) {
    return <Shell><AuthScreen /></Shell>;
  }

  if (checkingProfile) {
    return <Shell><div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: T.chalkDim }}>Loading your profile…</div></Shell>;
  }

  if (!profileRow) {
    return (
      <Shell>
        <ChooseName userId={session.user.id} onDone={(name) => setProfileRow({ id: session.user.id, name, created_at: new Date().toISOString() })} />
      </Shell>
    );
  }

  const profile = { name: profileRow.name, createdAt: new Date(profileRow.created_at).getTime(), program: userProgram };

  if (!userProgram) {
    return (
      <Shell>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ProgramsTab profile={null} onSaveProgram={handleSaveProgram} onStartWorkout={() => {}} myName={profileRow.name} myUserId={session.user.id} />
        </div>
      </Shell>
    );
  }

  if (viewingProfile) {
    return (
      <Shell>
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ProfileScreen
            name={viewingProfile}
            isMe={viewingProfile === profile.name}
            myAchievementIds={achievementIds}
            myStats={achievementStats}
            onBack={() => setViewingProfile(null)}
          />
        </div>
      </Shell>
    );
  }

  const isTop = achievementIds.includes("rank-first");
  const deloadState = profileRow.deload_state || null;
  const deloadSignal = !deloadState ? computeDeloadSignal(workouts, profile.program) : null;
  const currentToast = toastQueue[0] || null;
  const dismissToast = () => setToastQueue((q) => q.slice(1));

  return (
    <Shell>
      {currentToast && <AchievementToast achievement={currentToast} onDismiss={dismissToast} />}
      <div style={{ flex: 1, overflowY: tab === "chat" ? "hidden" : "auto", display: "flex", flexDirection: "column" }}>
        {justFinished && tab === "dashboard" && <FinishBanner data={justFinished} onClose={() => setJustFinished(null)} />}
        {tab === "dashboard" && (
          <Dashboard
            profile={profile}
            workouts={workouts}
            stats={stats}
            onStartWorkout={startWorkout}
            prs={prs}
            onOpenProfile={() => setViewingProfile(profile.name)}
            onEditNext={() => { setPendingEditProgram(true); setTab("programs"); }}
            achievementCount={achievementIds.length}
            deloadSignal={deloadSignal}
            deloadState={deloadState}
            onStartDeload={startDeload}
          />
        )}
        {tab === "programs" && (
          <ProgramsTab
            profile={profile}
            onSaveProgram={handleSaveProgram}
            onStartWorkout={startWorkout}
            myName={profile.name}
            myUserId={session.user.id}
            onActivityChange={refreshCommunityActivity}
            autoEdit={pendingEditProgram}
            onAutoEditHandled={() => setPendingEditProgram(false)}
          />
        )}
        {tab === "logger" && activeDayIdx !== null && (
          <WorkoutLogger
            key={activeDayIdx}
            day={profile.program.days[activeDayIdx]}
            dayIndex={activeDayIdx}
            userId={session.user.id}
            initialDraft={resumeDraft}
            workouts={workouts}
            deloadActive={!!deloadState}
            prs={prs}
            onCancel={() => { setActiveDayIdx(null); setTab("programs"); setResumeDraft(null); }}
            onFinish={finishWorkout}
          />
        )}
        {tab === "leaderboard" && <Leaderboard myName={profile.name} refreshKey={lbRefresh} onOpenProfile={setViewingProfile} />}
        {tab === "chat" && (
          <Chat
            myName={profile.name}
            myUserId={session.user.id}
            isAdmin={!!profileRow.is_admin}
            streak={stats.streak}
            achievementCount={achievementIds.length}
            isTop={isTop}
            onOpenProfile={setViewingProfile}
            onActivityChange={refreshCommunityActivity}
          />
        )}
        {tab === "about" && <AboutTab onSignOut={signOut} accountEmail={session.user.email} />}
      </div>
      {tab !== "logger" && <Nav tab={tab} setTab={setTab} />}
    </Shell>
  );
}
function Shell({ children }) {
  return (
    <div style={{
      width: "100%", maxWidth: 480, margin: "0 auto", height: "100vh", maxHeight: 900, background: T.iron,
      display: "flex", flexDirection: "column", fontFamily: "Inter, sans-serif", position: "relative",
      overflow: "hidden", borderRadius: 20, boxShadow: "0 0 0 1px rgba(242,239,233,0.06)",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: ${T.rust} !important; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${T.line}; border-radius: 3px; }
        @keyframes toastDrop { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        button { -webkit-tap-highlight-color: transparent; }
      `}</style>
      {children}
    </div>
  );
}
