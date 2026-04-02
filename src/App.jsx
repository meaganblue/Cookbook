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

const FIXED_TABS = ["🏠", "SAUCES & SPICES", "SOUPS & SALADS", "SNACKS", "VEGGIES", "PASTA", "RICE", "MEATS", "POULTRY & FISH", "SLOW COOKER & CANNING"];

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
      const { data, error: e } = await supabase.auth.signUp({ email: em, password: pass });
      if (e) { setErr(e.message); setBusy(false); return; }
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
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <input value={user} onChange={e => setUser(e.target.value)} placeholder="Username" onKeyDown={e => e.key === "Enter" && go()} style={inp} />
            <input value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" type="password" onKeyDown={e => e.key === "Enter" && go()} style={inp} />
            {err && <div style={{ color: "#FFB3B3", fontSize: "0.78rem", textAlign: "center" }}>{err}</div>}
            <button onClick={go} disabled={busy} style={{ background: C.accent, border: "none", borderRadius: 3, color: "#fff", padding: "0.65rem", fontWeight: "bold", cursor: "pointer" }}>
              {busy ? "…" : mode === "login" ? "Open Cookbook" : "Create Cookbook"}
            </button>
            <button onClick={() => setMode(m => m === "login" ? "signup" : "login")} style={{ background: "transparent", border: "none", color: "#C9B8FF", fontSize: "0.78rem", cursor: "pointer", textDecoration: "underline" }}>
              {mode === "login" ? "New here? Create an account" : "Already have one? Log in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardTable({ title, titleCenter, cols, rows, flex, isNotes }) {
  const cellCount = isNotes ? rows : cols * rows;
  const [cells, setCells] = useState(Array(cellCount).fill(""));
  const update = (i, val) => setCells(prev => { const n = [...prev]; n[i] = val; return n; });
  return (
    <div style={{ border: `2px solid ${C.accent}`, borderRadius: 3, overflow: "hidden", background: "#EDE0F5", display: "flex", flexDirection: "column", flex: flex || "none" }}>
      <div style={{ background: "#DDD0EC", padding: "0.2rem 0.6rem", fontFamily: C.fontSans, fontWeight: "700", fontSize: "0.65rem", color: "#3D2460", textAlign: titleCenter ? "center" : "left" }}>
        {title}
      </div>
      <div style={{ display: isNotes ? "flex" : "grid", flexDirection: "column", gridTemplateColumns: isNotes ? "none" : `repeat(${cols}, 1fr)`, background: "#FAF4FC", flex: 1 }}>
        {Array.from({ length: cellCount }).map((_, i) => (
          <input key={i} value={cells[i] || ""} onChange={e => update(i, e.target.value)}
            style={{ background: "transparent", border: "none", borderBottom: `1px solid ${C.accent}`, borderRight: !isNotes && (i % cols) < (cols - 1) ? `1px solid ${C.accent}` : "none", outline: "none", fontSize: "0.78rem", padding: "0.15rem 0.3rem" }} />
        ))}
      </div>
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
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.2rem 1.2rem" }}>
      {padded.map((v, i) => (
        <div key={i} style={{ display: "flex", alignItems: "baseline", gap: "0.3rem" }}>
          <span style={{ color: C.accent, fontWeight: "bold" }}>–</span>
          <input value={v} onChange={e => update(i, e.target.value)} style={{ ...fieldStyle, flex: 1 }} />
        </div>
      ))}
    </div>
  );
}

function RecipeModal({ recipe, onSave, onDelete, onClose, defaultSection }) {
  const [title, setTitle]     = useState(recipe?.title || "");
  const [secName, setSecName] = useState(recipe?.section_name || defaultSection || FIXED_TABS[1]);
  const [ings, setIngs]       = useState((recipe?.ingredients || []).join("\n"));
  const [method, setMethod]   = useState((recipe?.method || []).join("\n"));
  const [temp, setTemp]       = useState(recipe?.temp || "");
  const [time, setTime]       = useState(recipe?.cook_time || "");
  const [serves, setServes]   = useState(recipe?.servings || "");
  const [notes, setNotes]     = useState(recipe?.notes || "");
  const [rating, setRating]   = useState(recipe?.rating || 0);
  const [showPicker, setShowPicker] = useState(false);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: recipe?.id || `rec-${Date.now()}`,
      title: title.trim(), section_name: secName,
      ingredients: ings.split("\n").filter(Boolean),
      method: method.split("\n").filter(Boolean),
      temp, cook_time: time, servings: serves, notes, rating
    });
  };

  const uLine = { background: "transparent", border: "none", borderBottom: `1.5px solid ${C.inkMid}`, color: C.ink, padding: "0.2rem", fontSize: "0.9rem", outline: "none", width: "100%" };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.pageInner, borderRadius: 6, width: "100%", maxWidth: 440, padding: "1.5rem", ...ruled }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <h2 style={{ margin: 0, fontFamily: C.font }}>Recipe Input</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          <input placeholder="Recipe Name" value={title} onChange={e => setTitle(e.target.value)} style={{ ...uLine, fontSize: "1.1rem" }} />
          <IngredientGrid value={ings} onChange={setIngs} fieldStyle={uLine} />
          <div style={{ display: "flex", gap: "1rem" }}>
            <div style={{ flex: 1 }}>
              <input placeholder="Temp" value={temp} onChange={e => setTemp(e.target.value)} style={uLine} />
              <input placeholder="Cook Time" value={time} onChange={e => setTime(e.target.value)} style={uLine} />
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowPicker(!showPicker)} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 4, padding: "0.5rem 1rem", cursor: "pointer" }}>{secName}</button>
              {showPicker && (
                <div style={{ position: "absolute", bottom: "100%", right: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 4, zIndex: 10, maxHeight: 200, overflowY: "auto" }}>
                  {FIXED_TABS.slice(1).map(t => (
                    <button key={t} onClick={() => { setSecName(t); setShowPicker(false); }} style={{ display: "block", width: "100%", padding: "0.5rem", border: "none", background: "none", cursor: "pointer", textAlign: "left" }}>{t}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <textarea placeholder="Instructions..." value={method} onChange={e => setMethod(e.target.value)} style={{ ...uLine, height: 80, resize: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Stars value={rating} onChange={setRating} />
            <button onClick={save} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 4, padding: "0.6rem 2rem", fontWeight: "bold", cursor: "pointer" }}>SAVE</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Cookbook() {
  const [authUser, setAuthUser]       = useState(undefined);
  const [recipes, setRecipes]         = useState([]);
  const [activeTab, setActiveTab]     = useState("🏠");
  const [recipeModal, setRecipeModal] = useState(null);
  const [search, setSearch]           = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
  }, []);

  useEffect(() => {
    if (authUser) dbGetRecipes(authUser.id).then(setRecipes);
  }, [authUser]);

  const saveRecipe = async (data) => {
    const rec = { ...data, user_id: authUser.id };
    await dbUpsertRecipe(rec);
    dbGetRecipes(authUser.id).then(setRecipes);
    setRecipeModal(null);
  };

  const filtered = search
    ? recipes.filter(r => r.title.toLowerCase().includes(search.toLowerCase()))
    : recipes.filter(r => r.section_name === activeTab);

  if (authUser === undefined) return null;
  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  return (
    <div style={{ minHeight: "100vh", background: "#2A1545", padding: "0.5rem", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, background: C.paper, borderRadius: 8, overflow: "hidden", display: "flex", flexDirection: "column", border: `2px solid ${C.spineFaint}` }}>

        {/* TOP BAR */}
        <div style={{ background: C.paper, borderBottom: `1px solid ${C.spineFaint}`, padding: "0.6rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: C.font, fontWeight: "bold", fontSize: "1.2rem" }}>Meagan's Cookbook</span>
          <button onClick={() => supabase.auth.signOut()} style={{ background: "none", border: `1px solid ${C.inkMid}`, borderRadius: 3, padding: "0.2rem 0.5rem", fontSize: "0.7rem", cursor: "pointer" }}>Log Out</button>
        </div>

        <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

          {/* MAIN CONTENT AREA */}
          <div style={{ flex: 1, overflowY: "auto", background: C.pageInner, padding: "0.7rem" }}>
            {activeTab === "🏠" ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", minHeight: "100%" }}>
                <DashboardTable title="★ COMMON SUBSTITUTIONS ★" titleCenter cols={3} rows={5} />
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <DashboardTable title="★ SAFE TEMPS ★" cols={2} rows={5} flex={1} />
                  <DashboardTable title="★ EQUIVALENTS ★" cols={3} rows={5} flex={1} />
                </div>
                <DashboardTable title="★ NOTES ★" titleCenter isNotes rows={10} flex={1} />
                <DashboardTable title="★ ALLERGIES ★" titleCenter isNotes rows={6} />
              </div>
            ) : (
              <div>
                <input placeholder="Search recipes..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: "100%", padding: "0.5rem", marginBottom: "1rem", borderRadius: 4, border: `1px solid ${C.line}` }} />
                <h3 style={{ fontFamily: C.font }}>{activeTab}</h3>
                {filtered.map(r => (
                  <div key={r.id} onClick={() => setRecipeModal(r)} style={{ background: "#fff", padding: "0.8rem", borderRadius: 4, marginBottom: "0.5rem", border: `1px solid ${C.line}`, cursor: "pointer" }}>
                    <div style={{ fontWeight: "bold" }}>{r.title}</div>
                    <Stars value={r.rating} size="0.7rem" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SIDEBAR TABS */}
          <div style={{ width: 36, flexShrink: 0, background: C.spine, display: "flex", flexDirection: "column", paddingTop: "0.2rem", paddingBottom: "0.5rem", gap: 1 }}>
            {FIXED_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearch(""); }}
                style={{ flex: 1, background: activeTab === tab ? C.pageInner : "#4A2A6A", border: "none", borderRadius: "0 6px 6px 0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}
              >
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontSize: "0.45rem", fontWeight: "bold", color: activeTab === tab ? C.accent : "#C9B8FF" }}>
                  {tab}
                </span>
              </button>
            ))}
            <button
              onClick={() => setRecipeModal({})}
              style={{ background: C.accent, border: "none", borderRadius: "18px", color: "#fff", padding: "0.28rem 0.65rem", fontSize: "0.75rem", fontFamily: C.fontSans, fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}
            >
              + RECIPE
            </button>
          </div>

        </div>

        {recipeModal && (
          <RecipeModal
            recipe={recipeModal.id ? recipeModal : null}
            defaultSection={activeTab !== "🏠" ? activeTab : null}
            onSave={saveRecipe}
            onClose={() => setRecipeModal(null)}
          />
        )}

      </div>
    </div>
  );
}
