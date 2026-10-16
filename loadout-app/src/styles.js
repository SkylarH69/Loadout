import { T } from "./programs.js";

export const FONT_DISPLAY = "'Big Shoulders Display', sans-serif";
export const FONT_BODY = "'IBM Plex Sans', sans-serif";
export const FONT_MONO = "'IBM Plex Mono', monospace";

export const CARD = {
  background: T.iron2, border: `2px solid ${T.chalk}`, borderRadius: 2, padding: 18,
  boxShadow: `4px 4px 0 ${T.chalk}`,
};
export const H2 = {
  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 28, color: T.chalk, margin: "6px 0 8px",
  textTransform: "uppercase", letterSpacing: 0.5,
};
export const P = { fontFamily: FONT_BODY, color: T.chalkDim, fontSize: 14, marginBottom: 20, lineHeight: 1.5 };
export const TITLE = {
  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 38, color: T.chalk, margin: 0,
  textTransform: "uppercase", letterSpacing: 0.5, lineHeight: 1.05,
};
export const INPUT = {
  width: "100%", background: T.iron3, border: `2px solid ${T.chalk}`, borderRadius: 2,
  padding: "13px 14px", color: T.chalk, fontSize: 16, fontFamily: FONT_MONO,
  outline: "none", boxSizing: "border-box",
};
export const BTN_PRIMARY = {
  background: T.rust, color: T.paper, border: `3px solid ${T.chalk}`, borderRadius: 2, padding: "13px 20px",
  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 20, textTransform: "uppercase", letterSpacing: 1.5,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%",
};
export const BTN_SECONDARY = {
  background: "transparent", color: T.chalk, border: `2px solid ${T.chalk}`, borderRadius: 2,
  padding: "13px 20px", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", width: "100%",
};
export const ROUND_BTN = {
  width: 40, height: 40, borderRadius: "50%", border: `2px solid ${T.chalk}`, background: T.iron2,
  color: T.chalk, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
};
