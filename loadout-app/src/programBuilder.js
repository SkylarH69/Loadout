// Rule-based program builder — no AI, no network. Assembles a training program from the exercise
// library using standard split structures (full body, upper/lower, push/pull/legs) and the user's
// answers. Every exercise it returns is validated against EXERCISE_LIBRARY so the app's how-to tips,
// warmups and exercise picker keep working.

import { EXERCISE_LIBRARY } from "./programs.js";

const LIB = new Set(EXERCISE_LIBRARY.map((e) => e.name));

export const GOALS = [
  { id: "strength", label: "Get stronger", sub: "Heavier weights, lower reps on the big lifts." },
  { id: "muscle", label: "Build muscle", sub: "Moderate weights, more volume, size and shape." },
  { id: "both", label: "Strength + size", sub: "Heavy days and higher-rep days in the same week." },
  { id: "fatloss", label: "Lose fat / get lean", sub: "Full-body lifting plus short conditioning finishers." },
  { id: "general", label: "General fitness", sub: "Balanced, simple and sustainable." },
  { id: "bjj", label: "Support BJJ / grappling", sub: "Pulling, grip and carries with fatigue kept in check." },
];

export const EQUIPMENT = [
  { id: "gym", label: "Full gym", sub: "Barbells, machines, cables, dumbbells." },
  { id: "dumbbells", label: "Dumbbells + bench", sub: "Home setup." },
  { id: "bodyweight", label: "Bodyweight only", sub: "Pulling moves need a bar or sturdy table." },
];

export const EXPERIENCE = [
  { id: "beginner", label: "Beginner", sub: "Under about 1 year of consistent lifting." },
  { id: "intermediate", label: "Intermediate", sub: "1-3 years." },
  { id: "advanced", label: "Advanced", sub: "3+ years." },
];

export const EMPHASIS = [
  { id: "balanced", label: "Balanced" },
  { id: "glutes", label: "Glutes & legs" },
  { id: "upper", label: "Upper body & shoulders" },
  { id: "arms", label: "Arms" },
];

export const LIMITS = [
  { id: "knees", label: "Knees" },
  { id: "back", label: "Lower back" },
  { id: "shoulders", label: "Shoulders" },
  { id: "elbows", label: "Elbows / wrists" },
];

/* ------------------------------------------------------------------ */
/* Exercise pools. Order = preference. `eq` = equipment tags.          */
/* gym = anything; dumbbells = db|bw; bodyweight = bw only.            */
/* ------------------------------------------------------------------ */
const POOLS = {
  sq: [
    ["Back Squat", "bb"], ["Front Squat", "bb"], ["Hack Squat", "machine"], ["Leg Press", "machine"],
    ["Smith Machine Squat", "machine"], ["Goblet Squat", "db"], ["Bulgarian Split Squat", "db"], ["Reverse Lunge", "bw"],
    ["Bodyweight Squat", "bw"],
  ],
  hg: [
    ["Romanian Deadlift", "bb"], ["Deadlift", "bb"], ["Stiff-Leg Deadlift", "bb"], ["Cable Pull-Through", "cable"],
    ["Single-Leg RDL", "db"], ["Barbell Glute Bridge", "bb"], ["Glute Bridge", "bw"],
  ],
  hp: [
    ["Hip Thrust", "bb"], ["Barbell Glute Bridge", "bb"], ["Cable Hip Thrust", "cable"], ["Glute Bridge", "bw"], ["Frog Pump", "bw"],
  ],
  lunge: [
    ["Walking Lunge", "db"], ["Bulgarian Split Squat", "db"], ["Reverse Lunge", "bw"], ["Step-Up", "bw"], ["Leg Press", "machine"],
  ],
  quadiso: [["Leg Extension", "machine"], ["Sissy Squat", "bw"], ["Step-Up", "bw"]],
  hamcurl: [["Lying Leg Curl", "machine"], ["Seated Leg Curl", "machine"], ["Swiss Ball Leg Curl", "bw"], ["Nordic Curl", "bw"], ["Single-Leg RDL", "db"]],
  calf: [["Standing Calf Raise", "machine"], ["Seated Calf Raise", "machine"], ["Single-Leg Calf Raise", "bw"]],
  glutiso: [["Cable Kickback", "cable"], ["Hip Abduction Machine", "machine"], ["Banded Lateral Walk", "bw"], ["Frog Pump", "bw"], ["Curtsy Lunge", "bw"]],
  bp: [
    ["Barbell Bench Press", "bb"], ["Dumbbell Bench Press", "db"], ["Chest Press Machine", "machine"], ["Floor Press", "db"], ["Push-Up", "bw"],
  ],
  ip: [["Incline Dumbbell Press", "db"], ["Incline Barbell Bench Press", "bb"], ["Incline Push-Up", "bw"], ["Push-Up", "bw"]],
  op: [
    ["Overhead Press", "bb"], ["Seated Dumbbell Shoulder Press", "db"], ["Machine Shoulder Press", "machine"], ["Landmine Press", "bb"], ["Pike Push-Up", "bw"],
  ],
  fly: [["Cable Fly", "cable"], ["Dumbbell Fly", "db"], ["Pec Deck Machine", "machine"], ["Push-Up Plus", "bw"]],
  lat: [["Lateral Raise", "db"], ["Cable Lateral Raise", "cable"], ["Plate Raise", "bb"]],
  rear: [["Face Pull", "cable"], ["Rear Delt Fly", "db"], ["Reverse Pec Deck", "machine"]],
  row: [
    ["Barbell Row", "bb"], ["Chest-Supported Row", "machine"], ["Seated Cable Row", "cable"], ["One-Arm Dumbbell Row", "db"],
    ["T-Bar Row", "bb"], ["Inverted Row", "bw"],
  ],
  pd: [["Lat Pulldown", "cable"], ["Pull-Up", "bw"], ["Chin-Up", "bw"], ["Neutral-Grip Pull-Up", "bw"], ["Inverted Row", "bw"]],
  tri: [["Tricep Pushdown", "cable"], ["Overhead Tricep Extension", "db"], ["Skull Crusher", "bb"], ["Diamond Push-Up", "bw"], ["Bench Dip", "bw"]],
  bi: [["Dumbbell Curl", "db"], ["Hammer Curl", "db"], ["EZ-Bar Curl", "bb"], ["Cable Curl", "cable"], ["Incline Dumbbell Curl", "db"]],
  core: [["Dead Bug", "bw"], ["Plank", "bw"], ["Pallof Press", "cable"], ["Cable Crunch", "cable"], ["Hanging Knee Raise", "bw"], ["Side Plank", "bw"], ["Hollow Body Hold", "bw"]],
  carry: [["Farmer's Carry", "db"], ["Suitcase Carry", "db"], ["Dead Hang", "bw"]],
  grip: [["Dead Hang", "bw"], ["Towel Pull-Up", "bw"], ["Plate Pinch", "bb"]],
  cond: [
    ["Rowing Machine", "machine"], ["Assault Bike", "machine"], ["Sled Push", "machine"], ["Stair Climber", "machine"],
    ["Jump Rope", "bw"], ["Burpee", "bw"], ["Mountain Climber", "bw"], ["Bear Crawl", "bw"],
  ],
};

// Names avoided per limitation (conservative; the UI also tells people to check with a professional).
const AVOID = {
  knees: new Set([
    "Leg Extension", "Bulgarian Split Squat", "Walking Lunge", "Reverse Lunge", "Curtsy Lunge", "Step-Up", "Pistol Squat",
    "Sissy Squat", "Box Jump", "Burpee", "Jump Rope", "Mountain Climber", "Front Squat", "Hack Squat",
  ]),
  back: new Set([
    "Deadlift", "Sumo Deadlift", "Romanian Deadlift", "Stiff-Leg Deadlift", "Barbell Row", "T-Bar Row", "Good Morning",
    "Rack Pull", "Pendlay Row", "Kettlebell Swing", "Sled Push", "Landmine Row", "Single-Leg RDL",
  ]),
  shoulders: new Set([
    "Overhead Press", "Push Press", "Upright Row", "Weighted Dip", "Tricep Dip", "Bench Dip", "Pike Push-Up", "Handstand Push-Up",
    "Arnold Press", "Barbell Bench Press", "Incline Barbell Bench Press", "Seated Dumbbell Shoulder Press", "Machine Shoulder Press",
  ]),
  elbows: new Set([
    "Skull Crusher", "Diamond Push-Up", "Close-Grip Bench Press", "Bench Dip", "Weighted Dip", "JM Press", "Barbell Curl",
    "EZ-Bar Curl", "Wrist Curl", "Reverse Wrist Curl", "Towel Pull-Up", "Plate Pinch",
  ]),
};

const TIME_BASED = new Set(["Plank", "Side Plank", "Hollow Body Hold", "L-Sit", "Dead Hang", "Farmer's Carry", "Suitcase Carry", "Plate Pinch"]);
const PER_LEG = new Set([
  "Bulgarian Split Squat", "Walking Lunge", "Reverse Lunge", "Step-Up", "Single-Leg RDL", "Single-Leg Calf Raise",
  "Cable Kickback", "Curtsy Lunge", "One-Arm Dumbbell Row",
]);
const PER_SIDE = new Set(["Pallof Press"]);

/* ------------------------------------------------------------------ */
/* Day templates — slot lists in priority order (trimmed from the end). */
/* v = variant: 0 = primary/heavy, 1 = secondary/volume                 */
/* ------------------------------------------------------------------ */
const T_ = (slot, role, v = 0) => ({ slot, role, v });

const FULL_BODY = {
  A: [T_("sq", "main"), T_("bp", "main"), T_("row", "second"), T_("hg", "second"), T_("core", "core"), T_("bi", "iso")],
  B: [T_("hg", "main"), T_("op", "second"), T_("pd", "second"), T_("lunge", "acc"), T_("tri", "iso"), T_("core", "core", 1)],
  C: [T_("sq", "main", 1), T_("ip", "second"), T_("row", "second", 1), T_("hp", "acc"), T_("lat", "iso"), T_("calf", "iso")],
  D: [T_("hg", "main", 1), T_("bp", "second", 1), T_("pd", "main", 1), T_("lunge", "acc", 1), T_("rear", "iso"), T_("core", "core")],
};

const UPPER_LOWER = {
  upperA: [T_("bp", "main"), T_("row", "main"), T_("op", "second"), T_("pd", "second"), T_("tri", "iso"), T_("bi", "iso"), T_("rear", "iso")],
  lowerA: [T_("sq", "main"), T_("hg", "second"), T_("lunge", "acc"), T_("hamcurl", "acc"), T_("calf", "iso"), T_("core", "core")],
  upperB: [T_("ip", "main", 1), T_("pd", "second", 1), T_("op", "second", 1), T_("row", "acc", 1), T_("lat", "iso"), T_("tri", "iso", 1), T_("bi", "iso", 1)],
  lowerB: [T_("hg", "main", 1), T_("sq", "second", 1), T_("hp", "acc"), T_("quadiso", "iso"), T_("hamcurl", "acc", 1), T_("calf", "iso", 1)],
};

const PPL = {
  push: [T_("bp", "main"), T_("op", "second"), T_("ip", "acc"), T_("lat", "iso"), T_("tri", "iso"), T_("fly", "iso")],
  pull: [T_("row", "main"), T_("pd", "main"), T_("rear", "iso"), T_("bi", "iso"), T_("bi", "iso", 1), T_("core", "core")],
  legs: [T_("sq", "main"), T_("hg", "second"), T_("lunge", "acc"), T_("hamcurl", "acc"), T_("calf", "iso"), T_("core", "core", 1)],
  pushB: [T_("ip", "main", 1), T_("op", "second", 1), T_("bp", "acc", 1), T_("lat", "iso", 1), T_("tri", "iso", 1), T_("fly", "iso", 1)],
  pullB: [T_("pd", "main", 1), T_("row", "main", 1), T_("rear", "iso", 1), T_("bi", "iso", 1), T_("bi", "iso"), T_("core", "core")],
  legsB: [T_("hg", "main", 1), T_("sq", "second", 1), T_("hp", "acc"), T_("hamcurl", "acc", 1), T_("quadiso", "iso"), T_("calf", "iso", 1)],
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function eligible(eqId, tag) {
  if (eqId === "gym") return true;
  if (eqId === "dumbbells") return tag === "db" || tag === "bw";
  return tag === "bw";
}

/* ------------------------------------------------------------------ */
/* Prescription: sets + reps by role/goal/experience/variant           */
/* ------------------------------------------------------------------ */
function prescribe(role, goal, exp, v) {
  const beg = exp === "beginner";
  const adv = exp === "advanced";
  const t = (sets, reps) => ({ sets, reps });
  switch (goal) {
    case "strength":
      if (role === "main") return v ? t(3, "6-8") : t(beg ? 3 : adv ? 5 : 4, beg ? "5" : "3-5");
      if (role === "second") return t(3, v ? "8-10" : "6-8");
      if (role === "acc") return t(3, "8-12");
      return t(2, "10-15");
    case "muscle":
      if (role === "main") return v ? t(3, "8-12") : t(beg ? 3 : 4, "6-10");
      if (role === "second") return t(3, "8-12");
      if (role === "acc") return t(3, "10-12");
      return t(beg ? 2 : 3, "12-15");
    case "both":
      if (v === 0) {
        if (role === "main") return t(beg ? 3 : 4, "4-6");
        if (role === "second") return t(3, "6-8");
        if (role === "acc") return t(3, "8-10");
        return t(2, "10-12");
      }
      if (role === "main") return t(3, "8-10");
      if (role === "second") return t(3, "10-12");
      if (role === "acc") return t(3, "10-15");
      return t(beg ? 2 : 3, "12-15");
    case "fatloss":
      if (role === "main") return t(3, "8-12");
      if (role === "second") return t(3, "10-12");
      if (role === "acc") return t(3, "12-15");
      return t(2, "15");
    case "bjj":
      if (role === "main") return t(3, "3-5");
      if (role === "second") return t(3, "6-8");
      if (role === "acc") return t(2, "8-12");
      return t(2, "10-12");
    default: // general
      if (role === "main") return t(3, "6-10");
      if (role === "second") return t(3, "8-12");
      if (role === "acc") return t(3, "10-12");
      return t(2, "12-15");
  }
}

/* ------------------------------------------------------------------ */
/* Main entry                                                          */
/* answers: { goal, days, equipment, experience, emphasis, limits[], otherDays, seed } */
/* ------------------------------------------------------------------ */
export function buildProgram(answers) {
  const goal = answers.goal || "general";
  const eq = answers.equipment || "gym";
  const exp = answers.experience || "beginner";
  const emphasis = answers.emphasis || "balanced";
  const limits = answers.limits || [];
  const otherDays = answers.otherDays || 0;
  const rand = mulberry32((answers.seed || 1) * 9973 + 17);
  const notes = [];

  // --- how many lifting days? ---
  let days = Math.max(2, Math.min(6, answers.days || 3));
  const cap = goal === "bjj" ? 4 : otherDays >= 3 ? 3 : otherDays >= 2 ? 4 : 6;
  if (days > cap) {
    notes.push(
      goal === "bjj"
        ? `Capped at ${cap} lifting days so you have energy and recovery for mat time.`
        : `Capped at ${cap} lifting days because of your other training — more days would cut into recovery.`
    );
    days = cap;
  }
  const lowRecovery = otherDays >= 2 || goal === "bjj";

  // --- choose the split ---
  let dayDefs; // [{ name, slots, v }]
  let splitLabel;
  const useFullBody = days <= 3 || ((goal === "fatloss" || goal === "bjj") && days === 4);
  if (useFullBody) {
    const n = days;
    splitLabel = `${n}-Day Full Body`;
    const letters = ["A", "B", "C", "D"];
    dayDefs = Array.from({ length: n }, (_, i) => ({
      name: `Full Body ${letters[i]}`,
      slots: FULL_BODY[letters[i]],
    }));
  } else if (days === 4) {
    splitLabel = "4-Day Upper/Lower";
    dayDefs = [
      { name: "Upper A", slots: UPPER_LOWER.upperA },
      { name: "Lower A", slots: UPPER_LOWER.lowerA },
      { name: "Upper B", slots: UPPER_LOWER.upperB },
      { name: "Lower B", slots: UPPER_LOWER.lowerB },
    ];
  } else if (days === 5) {
    splitLabel = "5-Day Push/Pull/Legs + Upper/Lower";
    dayDefs = [
      { name: "Push", slots: PPL.push },
      { name: "Pull", slots: PPL.pull },
      { name: "Legs", slots: PPL.legs },
      { name: "Upper", slots: UPPER_LOWER.upperB },
      { name: "Lower", slots: UPPER_LOWER.lowerB },
    ];
  } else {
    splitLabel = "6-Day Push/Pull/Legs";
    dayDefs = [
      { name: "Push A", slots: PPL.push },
      { name: "Pull A", slots: PPL.pull },
      { name: "Legs A", slots: PPL.legs },
      { name: "Push B", slots: PPL.pushB },
      { name: "Pull B", slots: PPL.pullB },
      { name: "Legs B", slots: PPL.legsB },
    ];
  }

  const maxSlots = exp === "beginner" ? 5 : exp === "intermediate" ? 6 : 7;
  const avoid = new Set(limits.flatMap((l) => [...(AVOID[l] || [])]));
  const usedAcrossWeek = {}; // slot -> Set of names already chosen (for variety)

  const pick = (slot, v, dayUsed) => {
    const pool = (POOLS[slot] || []).filter(([name, tag]) => LIB.has(name) && eligible(eq, tag) && !avoid.has(name));
    if (!pool.length) return null;
    const names = pool.map(([n]) => n);
    const free = names.filter((n) => !dayUsed.has(n));
    if (!free.length) return null;
    const seen = (usedAcrossWeek[slot] = usedAcrossWeek[slot] || new Set());
    // variant 1 prefers something different from what this slot already used this week
    let ordered = v ? [...free.filter((n) => !seen.has(n)), ...free.filter((n) => seen.has(n))] : free;
    // light shuffle among the top few when regenerating
    if ((answers.seed || 1) > 1) {
      const top = ordered.slice(0, Math.min(3, ordered.length));
      for (let i = top.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [top[i], top[j]] = [top[j], top[i]];
      }
      ordered = [...top, ...ordered.slice(top.length)];
    }
    const chosen = ordered[0];
    seen.add(chosen);
    return chosen;
  };

  const resultDays = dayDefs.map((def) => {
    let slots = def.slots.map((s) => ({ ...s }));
    const isLower = /Lower|Legs/.test(def.name);
    const isUpper = /Upper|Push|Pull/.test(def.name);
    const isFull = /Full Body/.test(def.name);

    // emphasis tweaks
    if (emphasis === "glutes") {
      if (isLower || isFull) {
        if (!slots.some((s) => s.slot === "hp")) slots.splice(1, 0, T_("hp", "second"));
        slots.push(T_("glutiso", "iso"));
      }
    } else if (emphasis === "upper") {
      if (isUpper || isFull) {
        if (!slots.some((s) => s.slot === "lat")) slots.push(T_("lat", "iso"));
        if (!slots.some((s) => s.slot === "rear")) slots.push(T_("rear", "iso"));
      }
    } else if (emphasis === "arms") {
      if (isUpper || isFull) {
        if (!slots.some((s) => s.slot === "bi")) slots.push(T_("bi", "iso"));
        if (!slots.some((s) => s.slot === "tri")) slots.push(T_("tri", "iso"));
      }
    }

    // grappling support: pulling + grip, lighter leg accessories
    if (goal === "bjj") {
      slots = slots.filter((s) => !["quadiso", "calf", "fly", "lat"].includes(s.slot));
      if (!slots.some((s) => s.slot === "pd")) slots.splice(3, 0, T_("pd", "second"));
      if (!slots.some((s) => s.slot === "row")) slots.splice(3, 0, T_("row", "second"));
      slots.push(T_("carry", "core"));
    }

    // fat loss: conditioning finisher
    if (goal === "fatloss") slots.push(T_("cond", "cond"));

    // keep the day a manageable size; always keep the finisher
    const finisher = slots.filter((s) => s.role === "cond");
    let body = slots.filter((s) => s.role !== "cond");
    let limit = maxSlots - (lowRecovery ? 1 : 0);
    if (emphasis !== "balanced") limit += 1;
    if (goal === "bjj") limit = Math.min(limit + 1, 7);
    body = body.slice(0, Math.max(4, limit));
    slots = [...body, ...finisher];

    const used = new Set();
    const exercises = [];
    slots.forEach((s) => {
      const name = pick(s.slot, s.v, used);
      if (!name) return;
      used.add(name);
      let { sets, reps } =
        s.role === "cond" ? { sets: 1, reps: "8-10 min" } : prescribe(s.role, goal, exp, s.v || (def.name.endsWith(" B") ? 1 : 0));
      if (lowRecovery && (s.role === "acc" || s.role === "iso")) sets = Math.max(2, sets - 1);
      if (TIME_BASED.has(name)) { reps = name.includes("Carry") ? "30-40s" : name === "Dead Hang" ? "20-30s" : "30-45s"; sets = Math.min(sets, 3); }
      else if (PER_SIDE.has(name)) reps = "10 / side";
      else if (PER_LEG.has(name)) reps = `${reps} / ${name === "One-Arm Dumbbell Row" ? "arm" : "leg"}`;
      if (name === "Dead Bug") reps = "8 / side";
      exercises.push({ name, sets, reps });
    });
    // thin days (e.g. bodyweight + several limitations): top up with safe extras
    if (exercises.length < 4) {
      const fillers = ["core", "glutiso", "hp", "bi", "tri", "lat", "calf", "hamcurl", "rear"];
      for (const slot of fillers) {
        if (exercises.length >= 4) break;
        const name = pick(slot, 0, used);
        if (!name) continue;
        used.add(name);
        const { sets, reps } = prescribe("iso", goal, exp, 0);
        exercises.push({ name, sets, reps: TIME_BASED.has(name) ? "30-45s" : PER_LEG.has(name) ? `${reps} / leg` : PER_SIDE.has(name) ? "10 / side" : name === "Dead Bug" ? "8 / side" : reps });
      }
    }
    return { name: def.name, exercises };
  });

  // --- advice notes ---
  const goalLabel = GOALS.find((g) => g.id === goal)?.label || "Training";
  notes.push("Progression: when you hit the top of the rep range on every set, add the smallest weight jump available next session.");
  notes.push("Leave 1-3 reps in reserve on most sets. Finish a set feeling you could have done a few more, not grinding to failure.");
  notes.push("Plan a lighter week about every 4-6 weeks. The app will recommend one when it's time.");
  if (eq === "bodyweight") notes.push("Pulling moves need a pull-up bar or a sturdy table. Make squats and lunges harder with slower reps, pauses, or single-leg versions.");
  if (limits.length) notes.push("Movements that commonly aggravate " + limits.map((l) => LIMITS.find((x) => x.id === l)?.label.toLowerCase()).filter(Boolean).join(", ") + " were left out. This is general guidance, not medical advice, so check with a doctor or physical therapist about any pain.");

  return {
    splitName: `${goalLabel} · ${splitLabel}`,
    daysPerWeek: days,
    days: resultDays,
    notes,
  };
}
