import { T } from "./programs.js";

export const CARD = { background: T.iron2, border: `1px solid ${T.line}`, borderRadius: 14, padding: 18 };
export const H2 = { fontFamily: "'Oswald', sans-serif", fontSize: 24, color: T.chalk, margin: "6px 0 8px", textTransform: "uppercase", letterSpacing: 0.3 };
export const P = { fontFamily: "Inter, sans-serif", color: T.chalkDim, fontSize: 14, marginBottom: 20, lineHeight: 1.5 };
export const TITLE = { fontFamily: "'Oswald', sans-serif", fontSize: 30, color: T.chalk, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 };
export const INPUT = {
  width: "100%", background: T.iron3, border: `1.5px solid ${T.line}`, borderRadius: 10,
  padding: "14px 16px", color: T.chalk, fontSize: 16, fontFamily: "Inter, sans-serif",
  outline: "none", boxSizing: "border-box",
};
export const BTN_PRIMARY = {
  background: T.rust, color: T.chalk, border: "none", borderRadius: 10, padding: "15px 20px",
  fontFamily: "'Oswald', sans-serif", fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: "100%",
};
export const BTN_SECONDARY = {
  background: "transparent", color: T.chalk, border: `1.5px solid ${T.line}`, borderRadius: 10,
  padding: "15px 20px", fontFamily: "Inter, sans-serif", fontSize: 14, cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", width: "100%",
};
export const ROUND_BTN = {
  width: 40, height: 40, borderRadius: "50%", border: `1.5px solid ${T.line}`, background: T.iron3,
  color: T.chalk, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
};
