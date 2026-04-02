
import React, { useState, useEffect } from "react";
import { supabase } from "./supabase";

const C = {
  paper:       "#F5F2FB",
  pageInner:   "#FAF8FE",
  card:        "#FFFFFF",
  line:        "#CCC3E0",
  tabActive:   "#FAF8FE",
  tabInactive: "#BDB0D8",
  tabHover:    "#D0C6EC",
  spine:       "#3D2460",
  spineLight:  "#7B5AAF",
  spineFaint:  "#5C3D8F",
  accent:      "#5C3D8F",
  accentLight: "#7B5AAF",
  accentFade:  "#EDE8F5",
  ink:         "#1A0A2E",
  inkMid:      "#3D2460",
  inkMuted:    "#7B5AAF",
  inkFaint:    "#9E87C8",
  red:         "#8B2E2E",
  star:        "#B8860A",
  font:        "'Crimson Text', 'Book Antiqua', Georgia, serif",
  fontSans:    "'Trebuchet MS', 'Gill Sans', Calibri, sans-serif",
};

const ruled = {
  backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent 29px, ${C.line} 29px, ${C.line} 30px)`,
  backgroundPositionY: "36px",
};

async function dbGetSections(userId) {
  const { data } = await supabase.from("cookbook_sections").select("*").eq("user_id", userId).order("position");
  return data || [];
}
async function dbUpsertSection(sec) {
  const { data } = await supabase.from("cookbook_sections").upsert(sec).select().single();
  return data;
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
async function dbDeleteSection(id) {
  await supabase.from("cookbook_sections").delete().eq("id", id);
}

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
            <div style={{ fontSize: "2.5rem", color: "#C9B8FF", marginBottom: "0.4rem" }}>★</div>
            <div style={{ fontSize: "1.5rem", fontFamily: C.font, color: "#F5F2FB", fontWeight: "bold", letterSpacing: "0.05em" }}>My Cookbook</div>
            <div style={{ fontSize: "0.7rem", color: "#C9B8FF", fontFamily: C.fontSans, letterSpacing: "0.15em", textTransform: "uppercase", marginTop: "0.3rem" }}>
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
            <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setErr(""); }} style={{ background: "transparent", border: "none", color: "#C9B8FF", fontSize: "0.78rem", fontFamily: C.fontSans, cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "New here? Create an account" : "Already have one? Log in"}
            </button>
          </div>
          <div style={{ color: "#C9B8FF", fontSize: "0.62rem", textAlign: "center", marginTop: "1.2rem", fontFamily: C.fontSans }}>No email required</div>
        </div>
      </div>
    </div>
  );
}
function DashboardTable({ title, titleCenter, cols, rows, flex, isNotes }) {
  const cellCount = isNotes ? rows : cols * rows;
  const [cells, setCells] = useState(Array(cellCount).fill(""));
  const update = (i, val) => setCells(prev => { const n = [...prev]; n[i] = val; return n; });
  const border = `2px solid ${C.accent}`;
  const cellBorder = `1px solid ${C.accent}`;
  return (
    <div style={{ border, borderRadius: 3, overflow: "hidden", background: "#EDE0F5", display: "flex", flexDirection: "column", flex: flex || "none" }}>
      <div style={{ background: "#DDD0EC", borderBottom: border, lineHeight:7, padding: "0.32rem 0.2rem", fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.7rem", letterSpacing: "0.1em", color: "#3D2460", textAlign: titleCenter ? "center" : "center", textTransform: "uppercase", rowHeight: 4 }}>
        {title}
      </div>
      {isNotes ? (
        <div style={{ padding: "0.4rem 0.6rem", display: "flex", flexDirection: "column", gap: "0.3rem", background: "#FAF4FC", flex: 1 }}>
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ color: C.accent, fontSize: "0.75rem", opacity: 0.5, flexShrink: 0 }}>〜</span>
              <input value={cells[i] || ""} onChange={e => update(i, e.target.value)}
                style={{ flex: 1, background: "transparent", border: "none", borderBottom: cellBorder, outline: "none", fontFamily: C.fontSans, fontSize: "0.82rem", color: C.inkMid, padding: "0.18rem 0", rowHeight: 8 }} />
              <span style={{ color: C.accent, fontSize: "0.75rem", opacity: 0.5, flexShrink: 0 }}>〜</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, background: "#FAF4FC", flex: 1 }}>
          {Array.from({ length: cols * rows }).map((_, i) => (
            <input key={i} value={cells[i] || ""} onChange={e => update(i, e.target.value)}
              style={{ background: "transparent", border: "none", borderRight: (i % cols) < (cols - 1) ? cellBorder : "none", borderBottom: i < cols * (rows - 1) ? cellBorder : "none", outline: "none", fontFamily: C.fontSans, fontSize: "0.8rem", color: C.inkMid, padding: "0.28rem 0.4rem", width: "100%", boxSizing: "border-box", rowHeight: 8,  minHeight: 20 }} />
          ))}
        </div>
      )}
    </div>
  );
}
function IngredientGrid({ value, onChange, fieldStyle }) {
  const lines = value.split("\n");
  const slots = Math.max(8, lines.length % 2 === 0 ? lines.length + 2 : lines.length + 1);
  const padded = [...lines, ...Array(slots).fill("")].slice(0, slots);
  const update = (i, val) => {
    const next = [...padded]; next[i] = val;
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,10,46,0.6)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "0.75rem", overflowY: "auto" }}>
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

function EditSectionModal({ section, onSave, onClose }) {
  const [name, setName] = useState(section.name);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(26,10,46,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
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

function generatePrintHTML(sections, recipes) {
  const sorted = [...sections].sort((a, b) => a.position - b.position);
  const recipeHTML = r => `
    <div class="recipe-page">
      <div class="recipe-header">
        <h2 class="recipe-title">${r.title}</h2>
        <div class="recipe-meta">
          ${r.cook_time ? `<span>Time: ${r.cook_time}</span>` : ""}
          ${r.temp      ? `<span>Temp: ${r.temp}</span>` : ""}
          ${r.servings  ? `<span>Serves: ${r.servings}</span>` : ""}
          ${r.source    ? `<span class="src">Source: ${r.source}</span>` : ""}
        </div>
      </div>
      <div class="recipe-body">
        ${r.ingredients?.length ? `<div class="block"><h3>Ingredients</h3><div class="ing-grid">${r.ingredients.map(i => `<div class="ing">— ${i}</div>`).join("")}</div></div>` : ""}
        ${r.method?.length ? `<div class="block"><h3>Instructions</h3><ol>${r.method.map(s => `<li>${s}</li>`).join("")}</ol></div>` : ""}
        ${r.notes ? `<div class="block notes-block"><h3>Notes</h3><p class="notes-text">${r.notes}</p></div>` : ""}
      </div>
    </div>`;
  const tocSec = sec => {
    const recs = recipes.filter(r => r.section_id === sec.id);
    if (!recs.length) return "";
    return `<div class="toc-sec"><div class="toc-sec-name">${sec.name}</div>${recs.map((r, i) => `<div class="toc-row"><span class="toc-num">${i + 1}.</span> ${r.title}</div>`).join("")}</div>`;
  };
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>My Cookbook</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Trebuchet MS','Gill Sans',sans-serif;background:#fff;color:#1A0A2E;font-size:11pt;line-height:1.5;}
.cover{page-break-after:always;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#3D2460;color:#F5F2FB;text-align:center;padding:3rem;}
.cover-star{font-size:4rem;color:#C9B8FF;margin-bottom:1rem;}
.cover-title{font-family:Georgia,serif;font-size:3rem;font-weight:700;letter-spacing:.05em;}
.cover-sub{font-size:.85rem;letter-spacing:.2em;text-transform:uppercase;margin-top:.5rem;color:#C9B8FF;}
.toc-page{page-break-after:always;padding:2.5rem;background:#F5F2FB;min-height:100vh;background-image:repeating-linear-gradient(to bottom,transparent,transparent 29px,#CCC3E0 29px,#CCC3E0 30px);background-position-y:36px;}
.toc-heading{font-family:Georgia,serif;font-size:1.6rem;font-weight:700;color:#1A0A2E;margin-bottom:1.5rem;padding-bottom:.5rem;border-bottom:2px solid #7B5AAF;}
.toc-sec{margin-bottom:1.2rem;}
.toc-sec-name{font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.1em;color:#5C3D8F;padding:.3rem 0;border-bottom:1px solid #CCC3E0;margin-bottom:.3rem;}
.toc-row{padding:.18rem 0 .18rem 1rem;font-size:.88rem;color:#3D2460;}
.toc-num{color:#7B5AAF;font-weight:600;}
.sec-div{page-break-before:always;page-break-after:always;height:100vh;display:flex;align-items:center;justify-content:center;background:#3D2460;color:#F5F2FB;}
.sec-div-inner{text-align:center;}
.sec-div-lbl{font-size:.75rem;text-transform:uppercase;letter-spacing:.2em;color:#C9B8FF;margin-bottom:.5rem;}
.sec-div-name{font-family:Georgia,serif;font-size:2.8rem;font-weight:700;}
.recipe-page{page-break-before:always;padding:2rem 2.5rem;background:#FAF8FE;background-image:repeating-linear-gradient(to bottom,transparent,transparent 29px,#CCC3E0 29px,#CCC3E0 30px);background-position-y:36px;min-height:100vh;}
.recipe-header{padding-bottom:.75rem;margin-bottom:1rem;border-bottom:2px solid #7B5AAF;}
.recipe-title{font-family:Georgia,serif;font-size:1.8rem;font-weight:700;color:#1A0A2E;line-height:1.2;margin-bottom:.4rem;}
.recipe-meta{display:flex;flex-wrap:wrap;gap:1rem;font-size:.78rem;color:#7B5AAF;}
.recipe-meta .src{font-style:italic;}
.block{margin-bottom:1.2rem;}
.block h3{font-size:.68rem;text-transform:uppercase;letter-spacing:.12em;color:#7B5AAF;font-weight:700;margin-bottom:.5rem;padding-bottom:.2rem;border-bottom:1px solid #CCC3E0;}
.ing-grid{display:grid;grid-template-columns:1fr 1fr;gap:.12rem 1.5rem;font-size:.88rem;}
.ing{color:#3D2460;padding:.1rem 0;}
ol{padding-left:1.2rem;}
ol li{margin-bottom:.45rem;font-size:.9rem;line-height:1.55;color:#3D2460;}
.notes-block{background:#EDE8F5;border-left:3px solid #7B5AAF;padding:.6rem .85rem;border-radius:0 3px 3px 0;}
.notes-text{font-style:italic;font-size:.85rem;color:#5C3D8F;line-height:1.5;}
@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact;}.cover,.sec-div{background:#3D2460!important;}}
</style></head><body>
<div class="cover"><div class="cover-star">★</div><div class="cover-title">My Cookbook</div><div class="cover-sub">A personal collection</div></div>
<div class="toc-page"><div class="toc-heading">★ Table of Contents</div>${sorted.map(tocSec).join("")}</div>
${sorted.map(sec => {
  const recs = recipes.filter(r => r.section_id === sec.id);
  if (!recs.length) return "";
  return `<div class="sec-div"><div class="sec-div-inner"><div class="sec-div-lbl">Section</div><div class="sec-div-name">${sec.name}</div></div></div>${recs.map(recipeHTML).join("")}`;
}).join("")}
</body></html>`;
}



export default function Cookbook() {
  const [authUser, setAuthUser] = useState(undefined);
  const [sections, setSections] = useState([]);
  const [recipes, setRecipes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [nav, setNav]           = useState(null);
  const [recipeModal, setRecipeModal] = useState(null);
  const [editSecModal, setEditSecModal] = useState(null);
  const [addSecName, setAddSecName] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("🏠");

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

  const deleteRecipe = async (id) => {
    await dbDeleteRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
    setRecipeModal(null);
    if (nav?.recipe?.id === id) setNav(nav?.section ? { section: nav.section } : null);
  };

  const saveRecipe = async (data) => {
    const rec = { ...data, user_id: authUser.id, created_at: data.created_at || new Date().toISOString() };
    const saved = await dbUpsertRecipe(rec);
    const final = saved || rec;
    setRecipes(prev => { const ex = prev.find(r => r.id === final.id); return ex ? prev.map(r => r.id === final.id ? final : r) : [final, ...prev]; });
    setRecipeModal(null);
    if (nav?.recipe?.id === final.id) setNav(n => ({ ...n, recipe: final }));
  };

  const handlePrint = () => {
    const html = generatePrintHTML(sections, recipes);
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 600);
  };

  const searched = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()) || (r.ingredients || []).some(i => i.toLowerCase().includes(search.toLowerCase())))
    : recipes;

  const goNav = (navVal) => {
    setNav(navVal);
    if (navVal) setActiveTab("RECIPES");
    else setActiveTab("🏠");
  };

  const FIXED_TABS = ["🏠", "SAUCES & SPICES", "SOUPS & SALADS", "SNACKS", "CANNING", "SLOW COOKER", "VEGGIES", "PASTA", "RICE", "MEATS"];

  if (authUser === undefined) return <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkMuted, fontFamily: C.fontSans }}>Opening cookbook…</div>;
  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  return (
    <div style={{ minHeight: "100vh", background: "#2A1545", display: "flex", flexDirection: "column", fontFamily: C.fontSans, padding: "0.5rem" }}>

      <div style={{ flex: 1, background: C.paper, borderRadius: 8, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", border: `2px solid ${C.spineFaint}` }}>

  {/* ── TOP BAR ── */}
        <div style={{ background: C.paper, borderBottom: `1px solid ${C.spineFaint}`, padding: "0.6rem 0.65rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontFamily: C.font, fontSize: "1.15rem", fontWeight: "bold", color: C.ink }}>Meagan's Cookbook</span>
          <div style={{ display: "flex", gap: "0.4rem" }}>
            <button onClick={handleLogout} style={{ background: C.paper, border: `1.5px solid ${C.inkMid}`, borderRadius: 3, color: C.ink, padding: "0.15rem 0.55rem", fontSize: "0.70rem", fontFamily: C.fontSans, fontWeight: "600", cursor: "pointer" }}>
              Log Out
            </button>
            <button onClick={handlePrint} style={{ background: C.paper, border: `1.5px solid ${C.inkMid}`, borderRadius: 3, color: C.ink, padding: "0.15rem 0.55rem", fontSize: "0.70rem", fontFamily: C.fontSans, fontWeight: "600", cursor: "pointer" }}>
              Print Book
            </button>
          </div>
        </div>

        {recipeModal !== null && (
          <RecipeModal
            recipe={recipeModal?.id ? recipeModal : null}
            sections={sections}
            defaultSectionId={recipeModal?._defaultSection || nav?.section?.id || sections[0]?.id}
            onSave={saveRecipe}
            onDelete={deleteRecipe}
            onClose={() => setRecipeModal(null)}
          />
        )}

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
          {/* Left binder spine space */}
          <div style={{ width: 20, flexShrink: 0, background: C.paper, position: 'relative', borderRight: `1px solid ${C.line}` }}>
             {/* Optional: Add hole punch visuals here */}
          </div>

          

          {/* Page content */}
          <div style={{ flex: 1, overflowY: "auto", background: C.pageInner, minWidth: 0 }}>

            {/* RECIPES VIEW */}
            {activeTab === "RECIPES" && (
              <div style={{ padding: "0.85rem 0.85rem 5rem" }}>
                {nav?.recipe ? (
                  <RecipePage recipe={nav.recipe} sectionName={sections.find(s => s.id === nav.recipe.section_id)?.name || ""} onEdit={r => setRecipeModal(r)} onBack={() => goNav({ section: nav.section })} />
                ) : nav?.section ? (
                  <SectionTOC section={nav.section} recipes={recipes} onRecipeClick={r => goNav({ section: nav.section, recipe: r })} onBack={() => goNav(null)} />
                ) : (
                  <>
                    <div style={{ position: "relative", marginBottom: "0.85rem" }}>
                      <span style={{ position: "absolute", left: "0.6rem", top: "50%", transform: "translateY(-50%)", color: C.inkFaint, fontSize: "0.85rem" }}>🔍</span>
                      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search recipes…"
                        style={{ width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, color: C.ink, padding: "0.38rem 0.65rem 0.38rem 2rem", fontSize: "0.83rem", fontFamily: C.fontSans, outline: "none", boxSizing: "border-box" }} />
                    </div>
                    {search ? (
                      <div>
                        <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.inkMuted, marginBottom: "0.5rem" }}>{searched.length} result{searched.length !== 1 ? "s" : ""} for "{search}"</div>
                        {searched.map(r => (
                          <button key={r.id} onClick={() => goNav({ section: sections.find(s => s.id === r.section_id), recipe: r })}
                            style={{ width: "100%", background: C.card, border: `1px solid ${C.spineFaint}`, borderRadius: 3, padding: "0.55rem 0.75rem", marginBottom: "0.35rem", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}
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
                        {!loading && sections.length === 0 && (
                          <div style={{ textAlign: "center", padding: "3rem 1rem", color: C.inkMuted }}>
                            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📖</div>
                            <div style={{ fontFamily: C.font, fontSize: "1rem", marginBottom: "0.4rem" }}>Your cookbook is empty.</div>
                            <div style={{ fontSize: "0.78rem", color: C.inkFaint }}>Add your first section below.</div>
                          </div>
                        )}
                        {sections.map(s => (
                          <SectionTable key={s.id} section={s} recipes={recipes}
                            onSectionClick={(sec, recipe) => recipe ? goNav({ section: sec, recipe }) : goNav({ section: sec })}
                            onEditSection={setEditSecModal}
                            onDeleteSection={deleteSection}
                            onAddRecipe={secId => setRecipeModal({ _defaultSection: secId })}
                          />
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            )}

            {/* DASHBOARD VIEW */}
            {activeTab === "🏠" && (
              <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", gap: "0.6rem", minHeight: "97%", rowHeight: 8, boxSizing: "border-box" }}>
                <DashboardTable title="★  MEASUREMENT EQUIVALENTS  ★" titleCenter cols={3} rows={6} />
                <div style={{ display: "flex", gap: "0.6rem", flex: 1 }}>
                  <DashboardTable title="SAFE COOKING TEMPS 🌡️" cols={2} rows={5} flex={1} />
                  <DashboardTable title="COMMON SUBSTITUTIONS" cols={0} rows={5} flex={1} />
                </div>
                <DashboardTable title="KITCHEN NOTES" titleCenter isNotes rows={6} />
              </div>
            )}

            {/* PLACEHOLDER TABS */}
            {["CONVERSIONS","TIPS","KITCHEN NOTES","PLANNER"].includes(activeTab) && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", flexDirection: "column", gap: "0.5rem", color: C.inkFaint, fontFamily: C.font }}>
                <div style={{ fontSize: "1.8rem" }}>📄</div>
                <div style={{ fontSize: "0.9rem", fontStyle: "italic" }}>{activeTab}</div>
                <div style={{ fontSize: "0.75rem" }}>Coming soon</div>
              </div>
            )}
          </div>

          {/* RIGHT BINDER TABS */}
          <div style={{ width: 36, flexShrink: 0, background: C.spine, display: "flex", flexDirection: "column", paddingTop: "0.5rem", paddingBottom: "0.5rem", gap: 3 }}>
            {FIXED_TABS.map(tab => {
              const active = activeTab === tab;
              return (
                <button key={tab} onClick={() => { setActiveTab(tab); setNav(null); }}
                  style={{ flex: 1, background: active ? C.pageInner : "#4A2A6A", border: "none", borderRadius: "0 6px 6px 0", borderLeft: active ? `3px solid ${C.accent}` : "3px solid transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: "0.2rem 0", boxShadow: active ? "2px 0 8px rgba(0,0,0,0.2)" : "none", transition: "all 0.12s", overflow: "hidden" }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#5C3A80"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "#4A2A6A"; }}>
                  <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "0.48rem", fontFamily: C.fontSans, fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", color: active ? C.accent : "rgba(220,205,255,0.85)", whiteSpace: "nowrap", lineHeight: 1 }}>{tab}</span>
                </button>
              );
            })}
            <div style={{ marginTop: "auto", paddingTop: "0.3rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
  <button 
    onClick={() => { setActiveTab("RECIPES"); setRecipeModal({}); }} 
    disabled={sections.length === 0}
    style={{ 
      width: 26, 
      height: 26, 
      borderRadius: "50%", 
      background: C.accentFade, 
      border: `2px solid ${C.accentLight}`, 
      color: C.accent, 
      fontSize: "1rem", 
      fontWeight: "bold", 
      cursor: sections.length === 0 ? "not-allowed" : "pointer", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      lineHeight: 1,
      opacity: sections.length === 0 ? 0.5 : 1
    }}
  >
  
  </button>
  <span style={{ 
    fontSize: "0.38rem", 
    color: "rgba(220,205,255,0.7)", 
    fontFamily: C.fontSans, 
    textTransform: "uppercase", 
    letterSpacing: "0.06em", 
    textAlign: "center", 
    lineHeight: 1.3, 
    whiteSpace: "pre-line" 
  }}> 
    +
    {"Add\nNew\nRecipe"}
  </span>
</div>

          </div>
        </div>
      </div>

      {/* FLOATING BUTTONS */}
      
          
      {editSecModal && <EditSectionModal section={editSecModal} onSave={renameSection} onClose={() => setEditSecModal(null)} />}
    <div>
      
    </div>
      </div>
    
    
)};
                          
