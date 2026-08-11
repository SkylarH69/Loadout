import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { supabase } from "./supabaseClient";
import { createProfile } from "./db";
import { T } from "./programs.js";
import { H2, P, INPUT, BTN_PRIMARY } from "./styles.js";

export function AuthScreen() {
  const [mode, setMode] = useState("signup"); // 'signup' | 'login'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    setInfo("");
    if (!email.trim() || password.length < 6) {
      setError("Enter an email and a password of at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        setInfo("Check your email for a verification link. Once you've verified, come back here and log in.");
        setMode("login");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        // onAuthStateChange in App.jsx picks up the new session automatically.
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: 1, color: T.rust, fontSize: 13, marginBottom: 6 }}>
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </div>
        <h2 style={H2}>{mode === "signup" ? "Join the floor" : "Log in"}</h2>
        <p style={P}>
          {mode === "signup"
            ? "You'll need to verify your email before you can log in."
            : "Log in with the email and password you signed up with."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
          <input
            autoFocus
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            style={INPUT}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 6 characters)"
            style={INPUT}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {error && <div style={{ color: T.rust, fontSize: 13, marginBottom: 12 }}>{error}</div>}
        {info && <div style={{ color: T.moss, fontSize: 13, marginBottom: 12 }}>{info}</div>}

        <button
          onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setError(""); setInfo(""); }}
          style={{ background: "none", border: "none", color: T.chalkDim, fontSize: 13, cursor: "pointer", padding: 0 }}
        >
          {mode === "signup" ? "Already have an account? Log in" : "New here? Create an account"}
        </button>
      </div>

      <button
        disabled={loading}
        onClick={submit}
        style={{ ...BTN_PRIMARY, opacity: loading ? 0.6 : 1, cursor: loading ? "not-allowed" : "pointer" }}
      >
        {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
        {!loading && <ChevronRight size={18} style={{ marginLeft: 4 }} />}
      </button>
    </div>
  );
}

export function ChooseName({ userId, onDone }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError("");
    try {
      await createProfile(userId, trimmed);
      onDone(trimmed);
    } catch (e) {
      if (e.code === "23505" || (e.message || "").toLowerCase().includes("duplicate")) {
        setError('Someone\'s already using that name — pick another.');
      } else {
        setError(e.message || "Something went wrong.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: 1, color: T.rust, fontSize: 13, marginBottom: 6 }}>
          One last thing
        </div>
        <h2 style={H2}>What should we call you?</h2>
        <p style={P}>This is the name your training partners will see on the leaderboard and in the gym floor chat.</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="Your name"
          style={{ ...INPUT, borderColor: error ? T.rust : undefined }}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        {error && <div style={{ color: T.rust, fontSize: 13, marginTop: 10 }}>{error}</div>}
      </div>
      <button
        disabled={!name.trim() || saving}
        onClick={save}
        style={{ ...BTN_PRIMARY, opacity: name.trim() && !saving ? 1 : 0.4, cursor: name.trim() && !saving ? "pointer" : "not-allowed" }}
      >
        {saving ? "Saving…" : "Continue"} {!saving && <ChevronRight size={18} style={{ marginLeft: 4 }} />}
      </button>
    </div>
  );
}
