import React from 'react';
import { useState, useEffect } from "react";
import { supabase } from "./supabase"; // Make sure your path to supabaseClient is correct!

// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  paper:       "#F5F0E8",
  pageInner:   "#FDFAF4",
  card:        "#FFFEF9",
  line:        "#E2D9C8",
  tabActive:   "#FDFAF4",
  tabInactive: "#D4C9B4",
  tabHover:    "#E0D5C0",
  spine:       "#6B4C3B",
  spineLight:  "#9B7355",
  spineFaint:  "#C4A882",
  accent:      "#5C3D8F",
  accentLight: "#7B5AAF",
  accentFade:  "#EDE8F5",
  ink:         "#1A1208",
  inkMid:      "#3D2E1A",
  inkMuted:    "#7A6548",
  inkFaint:    "#B8A07A",
  red:         "#7A2525",
  star:        "#B8860A",
  font:        "'Crimson Text', 'Book Antiqua', Georgia, serif",
  fontSans:    "'Trebuchet MS', 'Gill Sans', Calibri, sans-serif",
};

const ruled = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 29px, ${C.line} 29px, ${C.line} 30px)`,
  backgroundPositionY: "36px",
};

// ─────────────────────────────────────────────
// DB HELPERS
// ─────────────────────────────────────────────
async function dbGetSections(userId) {
  const { data } = await supabase.from("cookbook_sections").select("*").eq("user_id", userId).order("position");
  return data || [];
}
async function dbUpsertSection(sec) {
  const { data } = await supabase.from("cookbook_sections").upsert(sec).select().single();
  return data;
}
async function dbDeleteSection(id) {
  await supabase.from("cookbook_sections").delete().eq("id", id);
}
async function dbGetRecipes(userId) {
  const { data } = await supabase.from("cookbook_recipes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return data || [];
}
async function dbUpsertRecipe(rec) {
  const { data } = await supabase.from("cookbook_recipes").upsert(rec).select().single();
  return data;
}
async function dbDeleteRecipe(id) {
  await supabase.from("cookbook_recipes").delete().eq("id", id);
}

// ─────────────────────────────────────────────
// STARS
// ─────────────────────────────────────────────
function Stars({ value, onChange, size = "1rem" }) {
  const [h, setH] = useState(0);
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(n => (
        <button key={n}
          onClick={() => onChange && onChange(n === value ? 0 : n)}
          onMouseEnter={() => onChange && setH(n)}
          onMouseLeave={() => onChange && setH(0)}
          style={{ background: "none", border: "none", cursor: onChange ? "pointer" : "default", fontSize: size, padding: 0, lineHeight: 1, color: n <= (h || value) ? C.star : C.line, transition: "color 0.1s" }}>
          ★
        </button>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr]   = useState("");
  const [busy, setBusy] = useState(false);
  const email = u => `${u.toLowerCase().replace(/[^a-z0-9]/g,"")}@cookbook.app`;

  const go = async () => {
    if (!user.trim() || !pass.trim()) { setErr("Fill in both fields."); return; }
    if (pass.length < 6) { setErr("Password needs 6+ characters."); return; }
    setBusy(true); setErr("");
    const em = email(user.trim());
    if (mode === "signup") {
      const { data: ex } = await supabase.from("accounts").select("id").eq("username", user.trim().toLowerCase()).maybeSingle();
      if (ex) { setErr("Username taken."); setBusy(false); return; }
      const { data, error: e } = await supabase.auth.signUp({ email: em, password: pass });
      if (e) { setErr(e.message); setBusy(false); return; }
      await supabase.from("accounts").insert({ id: data.user.id, username: user.trim().toLowerCase() });
      onAuth(data.user);
    } else {
      const { data, error: e } = await supabase.auth.signInWithPassword({ email: em, password: pass });
      if (e) { setErr("Wrong username or password."); setBusy(false); return; }
      onAuth(data.user);
    }
    setBusy(false);
  };

  const inp = { width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.ink, padding: "0.6rem 0.85rem", fontSize: "0.95rem", fontFamily: C.fontSans, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", ...ruled }}>
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340 }}>
        <div style={{ background: C.spine, borderRadius: "4px 8px 8px 4px", padding: "2rem 1.8rem", boxShadow: "-6px 6px 20px rgba(0,0,0,0.25), inset -3px 0 8px rgba(0,0,0,0.15)" }}>
          <div style={{ textAlign: "center", marginBottom: "1.8rem" }}>
            <div style={{ fontSize: "2.5rem", color: C.spineFaint, marginBottom: "0.4rem" }}>★</div>
            <div style={{ fontSize: "1.5rem", fontFamily: C.font, color: C.paper, fontWeight: "bold", letterSpacing: "0.05em" }}>My Cookbook</div>
            <div style={{ fontSize: "0.7rem", color: C.spineFaint, fontFamily: C.fontSans, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.3rem" }}>
              {mode === "login" ? "Welcome back" : "Create your cookbook"}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input value={user} onChange={e => setUser(e.target.value)} placeholder="Username" onKeyDown={e => e.key === "Enter" && go()} style={inp} autoCapitalize="none" />
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === "Enter" && go()} style={inp} />
            {err && <div style={{ color: "#FFB3B3", fontSize: "0.78rem", textAlign: "center", fontFamily: C.fontSans }}>{err}</div>}
            <button onClick={go} disabled={busy} style={{ background: C.accent, border: "none", borderRadius: 3, color: "#fff", padding: "0.65rem", fontSize: "0.9rem", fontFamily: C.fontSans, fontWeight: "bold", cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.7 : 1, marginTop: "0.25rem" }}>
              {busy ? "…" : mode === "login" ? "Open Cookbook" : "Create Cookbook"}
            </button>
            <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setErr(""); }} style={{ background: "transparent", border: "none", color: C.spineFaint, fontSize: "0.78rem", fontFamily: C.fontSans, cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "New here? Create an account" : "Already have one? Log in"}
            </button>
          </div>
          <div style={{ color: C.inkFaint, fontSize: "0.62rem", textAlign: "center", marginTop: "1.2rem", fontFamily: C.fontSans }}>No email required</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD COMPONENTS (NEW)
// ─────────────────────────────────────────────
function DashboardBox({ title, children, flex }) {
  return (
    <div style={{ background: C.pageInner, border: `1px solid ${C.spineFaint}`, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 12px rgba(0,0,0,0.04)", flex: flex || "auto" }}>
      <div style={{ background: C.accentFade, borderBottom: `1px solid ${C.spineFaint}`, padding: "0.45rem 0.85rem", fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.75rem", letterSpacing: "0.08em", color: C.accent }}>
        {title}
      </div>
      <div style={{ padding: "0.85rem", flex: 1, display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

function EditableTable({ cols, rows }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "0.5rem 1rem" }}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <input key={i} style={{ background: "transparent", border: "none", borderBottom: `1px solid ${C.line}`, outline: "none", fontFamily: C.fontSans, fontSize: "0.85rem", color: C.inkMid, padding: "0.2rem 0", width: "100%", boxSizing: "border-box" }} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// INGREDIENT GRID — two-column dash layout
// ─────────────────────────────────────────────
function IngredientGrid({ value, onChange, fieldStyle }) {
  const lines = value.split("\n");
  const slots = Math.max(8, lines.length % 2 === 0 ? lines.length + 2 : lines.length + 1);
  const padded = [...lines, ...Array(slots).fill("")].slice(0, slots);

  const update = (i, val) => {
    const next = [...padded];
    next[i] = val;
    let last = next.length - 1;
    while (last > 7 && !next[last].trim()) last--;
    onChange(next.slice(0, last + 1).join("\n"));
  };

  const pairs = [];
  for (let i = 0; i < padded.length; i += 2) pairs.push([i, i + 1]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 1.2rem" }}>
      {pairs.map(([li, ri]) => (
        <React.Fragment key={li}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
            <span style={{ color: C.accent, fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0 }}>–</span>
            <input value={padded[li] || ""} onChange={e => update(li, e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
            <span style={{ color: C.accent, fontWeight: "bold", fontSize: "0.9rem", flexShrink: 0 }}>–</span>
            <input value={padded[ri] || ""} onChange={e => update(ri, e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RECIPE MODAL
// ─────────────────────────────────────────────
function RecipeModal({ recipe, sections, defaultSectionId, onSave, onDelete, onClose }) {
  const [title, setTitle]   = useState(recipe?.title || "");
  const [secId, setSecId]   = useState(recipe?.section_id || defaultSectionId || sections[0]?.id || "");
  const [ings, setIngs]     = useState((recipe?.ingredients || []).join("\n"));
  const [method, setMethod] = useState((recipe?.method || []).join("\n"));
  const [temp, setTemp]     = useState(recipe?.temp || "");
  const [time, setTime]     = useState(recipe?.cook_time || "");
  const [serves, setServes] = useState(recipe?.servings || "");
  const [source, setSource] = useState(recipe?.source || "");
  const [notes, setNotes]   = useState(recipe?.notes || "");
  const [rating, setRating] = useState(recipe?.rating || 0);
  const [busy, setBusy]     = useState(false);
  const [showSecPicker, setShowSecPicker] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    await onSave({
      id: recipe?.id || `rec-${Date.now()}`,
      created_at: recipe?.created_at,
      title: title.trim(), section_id: secId,
      ingredients: ings.split("\n").map(s => s.trim()).filter(Boolean),
      method: method.split("\n").map(s => s.trim()).filter(Boolean),
      temp: temp.trim(), cook_time: time.trim(), servings: serves.trim(),
      source: source.trim(), notes: notes.trim(), rating,
    });
    setBusy(false);
  };

  const uLine = { background: "transparent", border: "none", borderBottom: `1.5px solid ${C.inkMid}`, borderRadius: 0, color: C.ink, padding: "0.15rem 0.1rem", fontSize: "0.92rem", fontFamily: C.fontSans, outline: "none", width: "100%", boxSizing: "border-box" };
  const uTA = { ...uLine, resize: "none", lineHeight: 1.8, display: "block" };
  const rowLbl = { fontSize: "0.95rem", fontFamily: C.fontSans, color: C.ink, whiteSpace: "nowrap", flexShrink: 0, lineHeight: 1.5 };
  const selectedSection = sections.find(s => s.id === secId);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.55)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0.75rem", overflowY: "auto" }}>
      <div style={{ background: C.pageInner, border: `1.5px solid ${C.inkMid}`, borderRadius: 6, width: "100%", maxWidth: 440, margin: "auto", boxShadow: "0 12px 40px rgba(0,0,0,0.28)", overflow: "hidden", ...ruled }}>
        <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: "0.7rem 1.1rem 0.6rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "1.05rem", color: C.ink }}>Recipe Input Popup</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.inkMuted, fontSize: "1.3rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: "0.9rem 1.1rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
            <span style={rowLbl}>Name:</span>
            <input value={title} onChange={e => setTitle(e.target.value)} style={{ ...uLine, fontSize: "1rem" }} />
          </div>
          <div>
            <div style={{ ...rowLbl, marginBottom: "0.35rem" }}>Ingredients:</div>
            <IngredientGrid value={ings} onChange={setIngs} fieldStyle={uLine} />
          </div>
          <div style={{ border: `1.5px solid ${C.inkMid}`, borderRadius: 4, padding: "0.65rem 0.85rem 0.75rem", background: "transparent" }}>
            <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "1rem", color: C.ink, marginBottom: "0.6rem" }}>Recipe Info</div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {[["Temp:", temp, setTemp], ["Time:", time, setTime], ["Serves:", serves, setServes]].map(([lbl, val, set]) => (
                  <div key={lbl} style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                    <span style={{ ...rowLbl, minWidth: 52 }}>{lbl}</span>
                    <input value={val} onChange={e => set(e.target.value)} style={uLine} />
                  </div>
                ))}
              </div>
              <div style={{ flexShrink: 0, position: "relative" }}>
                <button onClick={() => setShowSecPicker(p => !p)}
                  style={{ background: C.accent, border: "none", borderRadius: 10, color: "#fff", padding: "0.5rem 0.9rem", fontSize: "0.85rem", fontFamily: C.fontSans, fontWeight: "600", cursor: "pointer", textAlign: "center", minWidth: 88, lineHeight: 1.4, whiteSpace: "pre-line" }}>
                  {selectedSection ? selectedSection.name : "Section\nchoice"}
                </button>
                {showSecPicker && (
                  <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 6, zIndex: 10, minWidth: 150, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", overflow: "hidden" }}>
                    {sections.map(s => (
                      <button key={s.id} onClick={() => { setSecId(s.id); setShowSecPicker(false); }}
                        style={{ width: "100%", background: s.id === secId ? C.accentFade : "transparent", border: "none", padding: "0.45rem 0.75rem", textAlign: "left", cursor: "pointer", fontFamily: C.fontSans, fontSize: "0.88rem", color: s.id === secId ? C.accent : C.ink, fontWeight: s.id === secId ? "700" : "400" }}
                        onMouseEnter={e => { if (s.id !== secId) e.currentTarget.style.background = C.accentFade; }}
                        onMouseLeave={e => { if (s.id !== secId) e.currentTarget.style.background = "transparent"; }}>
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "flex-start", gap: "0.35rem" }}>
              <span style={{ ...rowLbl, paddingTop: "0.1rem", minWidth: 90 }}>Instructions:</span>
              <textarea value={method} onChange={e => setMethod(e.target.value)} rows={3} style={{ ...uTA, flex: 1 }} />
            </div>
            <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
              <span style={{ ...rowLbl, minWidth: 52 }}>Notes:</span>
              <input value={notes} onChange={e => setNotes(e.target.value)} style={uLine} />
            </div>
            <div style={{ marginTop: "0.35rem", display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
              <span style={{ ...rowLbl, minWidth: 52 }}>Source:</span>
              <input value={source} onChange={e => setSource(e.target.value)} style={uLine} />
            </div>
            <div style={{ marginTop: "0.45rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={rowLbl}>Rating:</span>
              <Stars value={rating} onChange={setRating} size="1.1rem" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.1rem" }}>
            {recipe?.id
              ? <button onClick={() => onDelete(recipe.id)} style={{ background: "transparent", color: C.red, border: "none", cursor: "pointer", fontSize: "0.8rem", fontFamily: C.fontSans }}>Delete Recipe</button>
              : <span />
            }
            <button onClick={save} disabled={busy || !title.trim()}
              style={{ background: "transparent", border: `1.5px solid ${C.inkMid}`, borderRadius: 5, color: C.ink, padding: "0.35rem 1.5rem", fontSize: "0.95rem", fontFamily: C.fontSans, fontWeight: "700", cursor: busy || !title.trim() ? "not-allowed" : "pointer", opacity: (!title.trim() || busy) ? 0.4 : 1, letterSpacing: "0.06em" }}>
              {busy ? "Saving…" : "SAVE"}
            </button>
          </div>
        </div>
      </div>
      {showSecPicker && <div style={{ position: "fixed", inset: 0, zIndex: 9 }} onClick={() => setShowSecPicker(false)} />}
    </div>
  );
}

// ─────────────────────────────────────────────
// RECIPE PAGE
// ─────────────────────────────────────────────
function RecipePage({ recipe, sectionName, onEdit, onBack }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem 3rem" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.inkMuted, fontFamily: C.fontSans, fontSize: "0.75rem", cursor: "pointer", padding: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
        ← {sectionName}
      </button>
      <div style={{ background: C.pageInner, border: `1px solid ${C.spineFaint}`, borderRadius: 4, boxShadow: "1px 3px 10px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div style={{ background: C.paper, padding: "0.85rem 1rem 0.7rem", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "1.3rem", fontFamily: C.font, fontWeight: "bold", color: C.ink, lineHeight: 1.3 }}>{recipe.title}</div>
              <div style={{ fontSize: "0.7rem", color: C.inkMuted, fontFamily: C.fontSans, marginTop: "0.2rem" }}>{sectionName}</div>
              {recipe.rating > 0 && <div style={{ marginTop: "0.35rem" }}><Stars value={recipe.rating} size="0.9rem" /></div>}
            </div>
            <button onClick={() => onEdit(recipe)} style={{ background: "transparent", border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.inkMuted, padding: "0.25rem 0.65rem", fontSize: "0.72rem", fontFamily: C.fontSans, cursor: "pointer", flexShrink: 0 }}>✎ Edit</button>
          </div>
          {(recipe.cook_time || recipe.temp || recipe.servings || recipe.source) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.6rem", paddingTop: "0.5rem", borderTop: `1px solid ${C.line}` }}>
              {recipe.cook_time && <span style={{ fontSize: "0.72rem", fontFamily: C.fontSans, color: C.inkMid }}><strong>Time:</strong> {recipe.cook_time}</span>}
              {recipe.temp      && <span style={{ fontSize: "0.72rem", fontFamily: C.fontSans, color: C.inkMid }}><strong>Temp:</strong> {recipe.temp}</span>}
              {recipe.servings  && <span style={{ fontSize: "0.72rem", fontFamily: C.fontSans, color: C.inkMid }}><strong>Serves:</strong> {recipe.servings}</span>}
              {recipe.source    && <span style={{ fontSize: "0.72rem", fontFamily: C.fontSans, color: C.inkMuted, fontStyle: "italic" }}>Source: {recipe.source}</span>}
            </div>
          )}
        </div>
        <div style={{ ...ruled, padding: "0.75rem 1rem 1rem" }}>
          {recipe.ingredients?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.4rem" }}>Ingredients</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.1rem 1rem" }}>
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} style={{ fontSize: "0.85rem", fontFamily: C.fontSans, color: C.inkMid, padding: "0.1rem 0", display: "flex", gap: "0.35rem" }}>
                    <span style={{ color: C.accent, flexShrink: 0 }}>—</span><span>{ing}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {recipe.method?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.4rem" }}>Instructions</div>
              {recipe.method.map((step, i) => (
                <div key={i} style={{ fontSize: "0.85rem", fontFamily: C.fontSans, color: C.inkMid, padding: "0.2rem 0", display: "flex", gap: "0.5rem", lineHeight: 1.5 }}>
                  <span style={{ color: C.accent, fontWeight: "bold", flexShrink: 0 }}>{i + 1}.</span><span>{step}</span>
                </div>
              ))}
            </div>
          )}
          {(recipe.cook_time || recipe.servings) && (
            <div style={{ border: `1px solid ${C.spineFaint}`, borderRadius: 2, padding: "0.45rem 0.7rem", display: "inline-block", marginBottom: "0.75rem", background: C.card }}>
              {recipe.cook_time && <div style={{ fontSize: "0.78rem", fontFamily: C.fontSans, color: C.inkMid, fontWeight: "600" }}>COOK TIME: {recipe.cook_time}</div>}
              {recipe.servings  && <div style={{ fontSize: "0.78rem", fontFamily: C.fontSans, color: C.inkMid, fontWeight: "600" }}>SERVES: {recipe.servings}</div>}
            </div>
          )}
          {recipe.notes && (
            <div>
              <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.3rem" }}>Notes</div>
              <div style={{ fontSize: "0.83rem", fontFamily: C.fontSans, color: C.inkMid, fontStyle: "italic", lineHeight: 1.55 }}>{recipe.notes}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION TOC
// ─────────────────────────────────────────────
function SectionTOC({ section, recipes, onRecipeClick, onBack }) {
  const recs = recipes.filter(r => r.section_id === section.id);
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1rem 3rem" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: C.inkMuted, fontFamily: C.fontSans, fontSize: "0.75rem", cursor: "pointer", padding: "0 0 0.6rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>← All Sections</button>
      <div style={{ background: C.pageInner, border: `1px solid ${C.spineFaint}`, borderRadius: 4, boxShadow: "1px 3px 10px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        <div style={{ background: C.paper, padding: "0.85rem 1rem", borderBottom: `1px solid ${C.line}` }}>
          <div style={{ fontSize: "0.6rem", fontFamily: C.fontSans, color: C.inkMuted, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "0.2rem" }}>Section:</div>
          <div style={{ fontSize: "1.15rem", fontFamily: C.font, fontWeight: "bold", color: C.ink }}>{section.name}</div>
          <div style={{ fontSize: "0.7rem", color: C.inkMuted, fontFamily: C.fontSans, marginTop: "0.2rem" }}>{recs.length} {recs.length === 1 ? "recipe" : "recipes"}</div>
        </div>
        <div style={{ ...ruled }}>
          {recs.length === 0 && <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.inkFaint, fontFamily: C.fontSans, fontSize: "0.85rem", fontStyle: "italic" }}>No recipes in this section yet.</div>}
          {recs.map((r, i) => (
            <button key={r.id} onClick={() => onRecipeClick(r)}
              style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${C.line}`, padding: "0.65rem 1rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", textAlign: "left", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentFade}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: "0.78rem", fontFamily: C.fontSans, color: C.inkFaint, width: 18, flexShrink: 0 }}>{i + 1}</span>
                <span style={{ fontSize: "0.95rem", fontFamily: C.font, color: C.ink, fontWeight: "600" }}>{r.title}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
                {r.rating > 0 && <Stars value={r.rating} size="0.72rem" />}
                <span style={{ fontSize: "0.7rem", color: C.inkFaint }}>→</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SECTION TABLE (main binder view)
// ─────────────────────────────────────────────
function SectionTable({ section, recipes, onSectionClick, onEditSection, onDeleteSection, onAddRecipe }) {
  const recs = recipes.filter(r => r.section_id === section.id);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{ marginBottom: "0.85rem", border: `1px solid ${C.spineFaint}`, borderRadius: 4, overflow: "hidden", background: C.pageInner, boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}>
      <div style={{ background: C.paper, borderBottom: `1px solid ${C.line}`, padding: "0.48rem 0.75rem", display: "flex", alignItems: "center", gap: "0.45rem" }}>
        <button onClick={() => onSectionClick(section)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
          <span style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.85rem", color: C.ink }}>{section.name}</span>
          <span style={{ fontFamily: C.fontSans, fontSize: "0.68rem", color: C.inkMuted, marginLeft: "0.4rem" }}>({recs.length})</span>
        </button>
        <button onClick={() => onAddRecipe(section.id)} style={{ background: C.accentFade, border: `1px solid ${C.accent}`, borderRadius: 3, color: C.accent, padding: "0.16rem 0.45rem", fontSize: "0.62rem", fontFamily: C.fontSans, cursor: "pointer", fontWeight: "bold" }}>+ Recipe</button>
        <button onClick={() => onEditSection(section)} style={{ background: "none", border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.inkMuted, padding: "0.16rem 0.42rem", fontSize: "0.62rem", fontFamily: C.fontSans, cursor: "pointer" }}>✎</button>
        <button onClick={() => onDeleteSection(section.id)} style={{ background: "none", border: "none", color: C.spineFaint, fontSize: "0.85rem", cursor: "pointer", padding: "0 0.1rem", lineHeight: 1, transition: "color 0.12s" }}
          onMouseEnter={e => e.currentTarget.style.color = C.red} onMouseLeave={e => e.currentTarget.style.color = C.spineFaint}>×</button>
        <button onClick={() => setCollapsed(c => !c)} style={{ background: "none", border: "none", color: C.inkFaint, fontSize: "0.6rem", cursor: "pointer", padding: "0 0.1rem" }}>{collapsed ? "▼" : "▲"}</button>
      </div>
      {!collapsed && (
        <div>
          {recs.length === 0 && <div style={{ padding: "0.75rem 1rem", fontFamily: C.fontSans, fontSize: "0.78rem", color: C.inkFaint, fontStyle: "italic" }}>No recipes yet.</div>}
          {recs.map((r, i) => (
            <button key={r.id} onClick={() => onSectionClick(section, r)}
              style={{ width: "100%", background: "transparent", border: "none", borderTop: i > 0 ? `1px solid ${C.line}` : "none", padding: "0.45rem 0.75rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", textAlign: "left", transition: "background 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.background = C.accentFade}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <span style={{ fontFamily: C.fontSans, fontSize: "0.82rem", color: C.inkMid }}>{r.title}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                {r.rating > 0 && <Stars value={r.rating} size="0.65rem" />}
                <span style={{ fontSize: "0.62rem", color: C.inkFaint }}>→</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EDIT SECTION NAME MODAL
// ─────────────────────────────────────────────
function EditSectionModal({ section, onSave, onClose }) {
  const [name, setName] = useState(section.name);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,18,8,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.pageInner, border: `1px solid ${C.spineFaint}`, borderRadius: 4, padding: "1.2rem", width: "100%", maxWidth: 320, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
        <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.88rem", color: C.ink, marginBottom: "0.75rem" }}>Rename Section</div>
        <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === "Enter") onSave(name); if (e.key === "Escape") onClose(); }} autoFocus
          style={{ width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.ink, padding: "0.45rem 0.7rem", fontSize: "0.92rem", fontFamily: C.fontSans, outline: "none", boxSizing: "border-box", marginBottom: "0.75rem" }} />
        <div style={{ display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.inkMuted, padding: "0.32rem 0.85rem", fontSize: "0.8rem", fontFamily: C.fontSans, cursor: "pointer" }}>Cancel</button>
          <button onClick={() => onSave(name)} disabled={!name.trim()} style={{ background: C.accent, border: "none", borderRadius: 3, color: "#fff", padding: "0.32rem 0.85rem", fontSize: "0.8rem", fontFamily: C.fontSans, fontWeight: "bold", cursor: "pointer" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────
export default function Cookbook() {
  const [authUser, setAuthUser] = useState(undefined);
  const [sections, setSections] = useState([]);
  const [recipes, setRecipes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [nav, setNav]           = useState(null); // null | {section} | {section, recipe}
  const [recipeModal, setRecipeModal] = useState(null);
  const [editSecModal, setEditSecModal] = useState(null);
  const [addSecName, setAddSecName] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthUser(s?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authUser) return;
    setLoading(true);
    Promise.all([dbGetSections(authUser.id), dbGetRecipes(authUser.id)]).then(([secs, recs]) => {
      setSections(secs); setRecipes(recs); setLoading(false);
    });
  }, [authUser]);

  const handleLogout = async () => { await supabase.auth.signOut(); setAuthUser(null); setSections([]); setRecipes([]); };

  const addSection = async () => {
    if (!addSecName.trim()) return;
    const s = { id: `sec-${Date.now()}`, user_id: authUser.id, name: addSecName.trim(), position: sections.length };
    const saved = await dbUpsertSection(s);
    setSections(prev => [...prev, saved || s]);
    setAddSecName("");
  };

  const renameSection = async (name) => {
    const updated = { ...editSecModal, name: name.trim() };
    await dbUpsertSection(updated);
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    setEditSecModal(null);
  };

  const deleteSection = async (id) => { await dbDeleteSection(id); setSections(prev => prev.filter(s => s.id !== id)); };

  const saveRecipe = async (data) => {
    const rec = { ...data, user_id: authUser.id, created_at: data.created_at || new Date().toISOString() };
    const saved = await dbUpsertRecipe(rec);
    const final = saved || rec;
    setRecipes(prev => { const ex = prev.find(r => r.id === final.id); return ex ? prev.map(r => r.id === final.id ? final : r) : [final, ...prev]; });
    setRecipeModal(null);
    if (nav?.recipe?.id === final.id) setNav(n => ({ ...n, recipe: final }));
  };

  const searched = search ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || (r.ingredients || []).some(i => i.toLowerCase().includes(search.toLowerCase()))) : recipes;

  if (authUser === undefined) return <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkMuted, fontFamily: C.fontSans }}>Opening cookbook…</div>;
  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column", fontFamily: C.fontSans }}>

      {/* HEADER */}
      <div style={{ background: C.paper, borderBottom: `1px solid ${C.spineFaint}`, padding: "0.5rem 0 0 1rem", position: "sticky", top: 0, zIndex: 30, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.45rem" }}>
          <span style={{ fontSize: "1rem", color: C.accent }}>★</span>
          <button onClick={() => setNav(null)} style={{ background: "none", border: "none", fontFamily: C.font, fontSize: "1rem", fontWeight: "bold", color: C.ink, cursor: "pointer", padding: 0 }}>Meagan's Cookbook</button>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, paddingRight: "0.5rem", overflowX: "auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", paddingBottom: "0.45rem", marginRight: "0.4rem" }}>
            <button onClick={handleLogout} style={{ background: "transparent", border: "none", color: C.inkFaint, padding: "0.18rem 0.35rem", fontSize: "0.6rem", cursor: "pointer" }}>Log out</button>
          </div>
          {sections.map(s => {
            const active = nav?.section?.id === s.id;
            return (
              <button key={s.id} onClick={() => setNav({ section: s })}
                style={{ height: 44, minWidth: 58, maxWidth: 88, padding: "0 0.55rem", background: active ? C.tabActive : C.tabInactive, border: `1px solid ${C.spineFaint}`, borderBottom: active ? `1px solid ${C.tabActive}` : `1px solid ${C.spineFaint}`, borderRadius: "5px 5px 0 0", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, marginBottom: active ? -1 : 0, position: "relative", zIndex: active ? 5 : 1, transition: "all 0.12s", boxShadow: active ? "0 -2px 5px rgba(0,0,0,0.07)" : "none", flexShrink: 0 }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.tabHover; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.tabInactive; }}>
                <span style={{ fontSize: "0.63rem", fontFamily: C.fontSans, fontWeight: active ? "700" : "500", color: active ? C.accent : C.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.name}</span>
                <span style={{ fontSize: "0.5rem", color: active ? C.spineLight : C.inkFaint }}>{recipes.filter(r => r.section_id === s.id).length}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* BODY */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Spine */}
        <div style={{ width: 18, flexShrink: 0, background: C.spine, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "1rem", gap: "1.6rem" }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: C.spineFaint, border: `1px solid ${C.spineLight}`, boxShadow: "inset 0 1px 2px rgba(0,0,0,0.2)", flexShrink: 0 }} />
          ))}
        </div>

        {/* Content area */}
        {nav?.recipe ? (
          <RecipePage recipe={nav.recipe} sectionName={sections.find(s => s.id === nav.recipe.section_id)?.name || ""} onEdit={r => setRecipeModal(r)} onBack={() => setNav({ section: nav.section })} />
        ) : nav?.section ? (
          <SectionTOC section={nav.section} recipes={recipes} onRecipeClick={r => setNav({ section: nav.section, recipe: r })} onBack={() => setNav(null)} />
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem 0.85rem 5rem" }}>
            {/* Search */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.85rem" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: C.inkFaint, fontSize: "0.85rem" }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…"
                  style={{ width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.ink, padding: "0.38rem 0.65rem 0.38rem 2rem", fontSize: "0.83rem", fontFamily: C.fontSans, outline: "none", boxSizing: "border-box" }} />
              </div>
            </div>

            {search ? (
              <div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.5rem" }}>{searched.length} result{searched.length !== 1 ? "s" : ""} for "{search}"</div>
                {searched.map(r => (
                  <button key={r.id} onClick={() => setNav({ section: sections.find(s => s.id === r.section_id), recipe: r })}
                    style={{ width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, padding: "0.55rem 0.75rem", marginBottom: "0.35rem", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = C.accentFade}
                    onMouseLeave={e => e.currentTarget.style.background = C.card}>
                    <div>
                      <div style={{ fontSize: "0.88rem", fontFamily: C.font, fontWeight: "600", color: C.ink }}>{r.title}</div>
                      <div style={{ fontSize: "0.68rem", color: C.inkMuted, marginTop: "0.1rem" }}>{sections.find(s => s.id === r.section_id)?.name}</div>
                    </div>
                    {r.rating > 0 && <Stars value={r.rating} size="0.7rem" />}
                  </button>
                ))}
              </div>
            ) : (
              <>
                {loading && <div style={{ color: C.inkFaint, textAlign: "center", padding: "2rem", fontStyle: "italic" }}>Opening cookbook…</div>}
                
                {/* NEW DASHBOARD LAYOUT FROM YOUR IMAGE */}
            import React from 'react';

const CookbookPage = () => {
  // Array to map through for generating our tabs cleanly
  const tabs = [
    { name: 'DASHBOARD', active: false },
    { name: 'RECIPES', active: false },
    { name: 'CONVERSIONS', active: true }, // The active tab
    { name: 'TIPS', active: false },
    { name: 'KITCHEN NOTES', active: false },
    { name: 'PLANNER', active: false },
  ];

  return (
    // Main wrapper: h-screen ensures no vertical scrolling
    <div className="h-screen w-full bg-[#fdfbf6] flex flex-col font-sans text-gray-800 overflow-hidden">
      
      {/* Top Navigation / Header */}
      <header className="flex justify-between items-center px-8 py-3 shrink-0">
        <h1 className="text-3xl tracking-tight font-medium text-[#2d2d2d]">Meagan's Cookbook</h1>
        <div className="flex gap-3">
          <button className="px-3 py-1 bg-[#e8e4d9] border border-gray-400 rounded shadow-sm text-sm hover:bg-[#dedad0] transition-colors">
            Log Out
          </button>
          <button className="px-3 py-1 bg-[#e8e4d9] border border-gray-400 rounded shadow-sm text-sm hover:bg-[#dedad0] transition-colors">
            Print Book
          </button>
        </div>
      </header>

      {/* Binder Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 pb-6 overflow-hidden flex justify-center items-stretch relative">
        
        {/* Binder Backing/Cover */}
        <div className="w-full h-full bg-[#7a6458] rounded-xl flex shadow-2xl border border-[#524138]">
          
          {/* Left Binder Rings */}
          <div className="w-10 flex flex-col justify-evenly items-center shrink-0 py-10 z-20 relative">
            <div className="absolute left-4 top-0 bottom-0 w-2 bg-[#5e4b41] rounded-full shadow-inner"></div>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-8 h-4 bg-gray-300 rounded-full border-[3px] border-gray-500 shadow-md -ml-2 z-10"></div>
            ))}
          </div>

          {/* Paper Content Area */}
          <div className="flex-1 bg-[#fbf5e6] rounded-lg border-2 border-[#5e4b41] my-2 shadow-inner p-4 flex flex-col gap-4 overflow-hidden z-10 relative">
            
            {/* Top Section: Measurement Equivalents */}
            <section className="flex-[1.2] border-4 border-[#b49db5] rounded-md flex flex-col overflow-hidden bg-[#faf4fc]">
              <div className="bg-[#ebd9ec] text-[#4d3a4d] py-1 text-center font-bold text-lg tracking-widest border-b-4 border-[#b49db5] flex items-center justify-center gap-2 uppercase">
                <span>★</span> Measurement Equivalents <span>★</span>
              </div>
              {/* Fake Table Grid */}
              <div className="flex-1 grid grid-cols-6 divide-x-2 divide-y-2 divide-[#b49db5] bg-[#fbf5e6]">
                {[...Array(30)].map((_, i) => (
                  <div key={i} className="h-full w-full"></div>
                ))}
              </div>
            </section>

            {/* Middle Section: Split Row */}
            <section className="flex-1 flex gap-4">
              {/* Safe Cooking Temps */}
              <div className="flex-1 border-4 border-[#b49db5] rounded-md flex flex-col overflow-hidden bg-[#faf4fc]">
                <div className="bg-[#ebd9ec] text-[#4d3a4d] py-2 text-center font-bold text-sm tracking-wide border-b-4 border-[#b49db5] uppercase leading-tight relative">
                  Safe Cooking<br />Temps
                  <span className="absolute right-3 top-2 text-xl">🌡️</span>
                </div>
                <div className="flex-1 grid grid-cols-2 divide-x-2 divide-y-2 divide-[#b49db5] bg-[#fbf5e6]">
                  {[...Array(8)].map((_, i) => <div key={i}></div>)}
                </div>
              </div>

              {/* Common Substitutions */}
              <div className="flex-1 border-4 border-[#b49db5] rounded-md flex flex-col overflow-hidden bg-[#faf4fc]">
                <div className="bg-[#ebd9ec] text-[#4d3a4d] py-2 text-center font-bold text-sm tracking-wide border-b-4 border-[#b49db5] uppercase leading-tight">
                  Common<br />Substitutions
                </div>
                <div className="flex-1 grid grid-cols-2 divide-x-2 divide-y-2 divide-[#b49db5] bg-[#fbf5e6]">
                  {[...Array(8)].map((_, i) => <div key={i}></div>)}
                </div>
              </div>
            </section>

            {/* Bottom Section: Kitchen Notes */}
            <section className="flex-1 border-4 border-[#b49db5] rounded-md flex flex-col overflow-hidden bg-[#faf4fc]">
              <div className="bg-[#ebd9ec] text-[#4d3a4d] py-1 text-center font-bold text-lg tracking-widest border-b-4 border-[#b49db5] uppercase">
                Kitchen Notes
              </div>
              <div className="flex-1 bg-[#fbf5e6] flex flex-col justify-evenly px-6 py-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 opacity-50">
                    <span className="text-xl">〰️</span>
                    <div className="h-0.5 flex-1 bg-gray-400 rounded"></div>
                    <span className="text-xl">〰️</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Right Stationary Tabs */}
          <div className="w-14 flex flex-col justify-start items-stretch py-4 pr-1 gap-1 z-0">
            {tabs.map((tab, idx) => (
              <button 
                key={idx} 
                style={{ writingMode: 'vertical-rl' }}
                className={`flex-1 flex items-center justify-center rounded-r-xl border-y border-r border-[#381c22] shadow-md transition-colors ${
                  tab.active 
                    ? 'bg-[#7a3241] text-[#fbf5e6]' 
                    : 'bg-[#5c2331] text-[#e0cfd1] hover:bg-[#6e2b3b]'
                }`}
              >
                <span className="text-xs font-semibold tracking-widest uppercase rotate-180 py-2">
                  {tab.name}
                </span>
              </button>
            ))}
            
            {/* Add New Section Tab */}
            <button className="flex-1 flex flex-col items-center justify-center rounded-r-xl border border-[#524138] bg-[#9e8374] text-[#fbf5e6] shadow-md mt-4 hover:bg-[#b09687] transition-colors leading-tight">
               <span className="text-lg mb-1">⊕</span>
               <span className="text-[10px] text-center font-medium">Add<br/>New<br/>Section</span>
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CookbookPage;

                {/* END NEW DASHBOARD LAYOUT */}

                <div style={{ fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.5rem", marginTop: "1rem" }}>Your Saved Sections</div>
                {!loading && sections.length === 0 && (
                  <div style={{ textAlign: "center", padding: "1.5rem 1rem", color: C.inkMuted }}>
                    <div style={{ fontSize: "0.78rem", color: C.inkFaint }}>Add your first section using the field below.</div>
                  </div>
                )}
                {sections.map(s => (
                  <SectionTable key={s.id} section={s} recipes={recipes}
                    onSectionClick={(sec, recipe) => recipe ? setNav({ section: sec, recipe }) : setNav({ section: sec })}
                    onEditSection={setEditSecModal}
                    onDeleteSection={deleteSection}
                    onAddRecipe={secId => setRecipeModal({ _defaultSection: secId })}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* FLOATING BUTTONS */}
      {!nav?.recipe && !nav?.section && (
        <div style={{ position: "fixed", bottom: "1.2rem", right: "1rem", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem", zIndex: 50 }}>
          <button onClick={() => setRecipeModal({})}
            style={{ background: C.accent, border: "none", borderRadius: 22, color: "#fff", padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontFamily: C.fontSans, fontWeight: "700", cursor: "pointer", boxShadow: "0 3px 12px rgba(92,61,143,0.4)" }}>
            + Add Recipe
          </button>
          <div style={{ display: "flex", gap: "0.35rem", alignItems: "center", background: C.pageInner, border: `1px solid ${C.spineFaint}`, borderRadius: 22, padding: "0.38rem 0.5rem 0.38rem 0.85rem", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <input value={addSecName} onChange={e => setAddSecName(e.target.value)} onKeyDown={e => e.key === "Enter" && addSection()}
              placeholder="New section…"
              style={{ background: "transparent", border: "none", outline: "none", color: C.ink, fontSize: "0.78rem", fontFamily: C.fontSans, width: 110 }} />
            <button onClick={addSection} disabled={!addSecName.trim()}
              style={{ background: C.spineLight, border: "none", borderRadius: 18, color: C.paper, padding: "0.28rem 0.65rem", fontSize: "0.75rem", fontFamily: C.fontSans, fontWeight: "bold", cursor: addSecName.trim() ? "pointer" : "not-allowed", opacity: addSecName.trim() ? 1 : 0.5 }}>
              + Section
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {recipeModal !== null && (
        <RecipeModal
          recipe={recipeModal?.id ? recipeModal : null}
          sections={sections}
          defaultSectionId={recipeModal?._defaultSection || nav?.section?.id || sections[0]?.id}
          onSave={saveRecipe}
          onClose={() => setRecipeModal(null)}
        />
      )}
      {editSecModal && <EditSectionModal section={editSecModal} onSave={renameSection} onClose={() => setEditSecModal(null)} />}
    </div>
  );
              }
