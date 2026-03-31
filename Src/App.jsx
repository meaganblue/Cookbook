import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS — warm vintage binder palette
// ─────────────────────────────────────────────────────────────────
const C = {
  paper:      "#FAF6EE",   // main background — aged cream
  card:       "#FFFDF7",   // recipe card face
  cardLine:   "#EDE8DC",   // ruled lines on cards
  tabActive:  "#FFFDF7",   // active binder tab = card color
  tabInactive:"#E8E0CE",   // inactive tab — slightly darker cream
  spine:      "#C8B89A",   // binder spine / border color
  spineDeep:  "#A8956A",   // darker accent border
  ink:        "#2C2416",   // primary text — near-black warm
  inkMid:     "#5C4E32",   // secondary text
  inkMuted:   "#9C8A68",   // muted / labels
  inkFaint:   "#C8B89A",   // very faint
  red:        "#8B2E2E",   // danger / delete
  star:       "#C8860A",   // star rating gold
  hole:       "#D8CEBA",   // binder hole punch color
  font:       "'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif",
  fontMono:   "Georgia, serif",
};

// Ruled line pattern for card backgrounds
const ruledLineStyle = {
  backgroundImage: `repeating-linear-gradient(
    to bottom,
    transparent,
    transparent 27px,
    ${C.cardLine} 27px,
    ${C.cardLine} 28px
  )`,
  backgroundPositionY: "32px",
};

// ─────────────────────────────────────────────────────────────────
// SUPABASE HELPERS
// ─────────────────────────────────────────────────────────────────
async function dbGetSections(userId) {
  const { data } = await supabase
    .from("cookbook_sections")
    .select("*")
    .eq("user_id", userId)
    .order("position");
  return data || [];
}

async function dbSaveSection(section) {
  const { data } = await supabase
    .from("cookbook_sections")
    .upsert(section)
    .select()
    .single();
  return data;
}

async function dbDeleteSection(id) {
  await supabase.from("cookbook_sections").delete().eq("id", id);
}

async function dbGetRecipes(userId, sectionId) {
  const query = supabase
    .from("cookbook_recipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (sectionId) query.eq("section_id", sectionId);
  const { data } = await query;
  return data || [];
}

async function dbSaveRecipe(recipe) {
  const { data } = await supabase
    .from("cookbook_recipes")
    .upsert(recipe)
    .select()
    .single();
  return data;
}

async function dbDeleteRecipe(id) {
  await supabase.from("cookbook_recipes").delete().eq("id", id);
}

// ─────────────────────────────────────────────────────────────────
// STAR RATING COMPONENT
// ─────────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false }) {
  const [hovered, setHovered] = useState(0);
  const labels = ["", "Not great", "It's ok", "Good", "Really good", "Outstanding"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.2rem" }}>
      {[1,2,3,4,5].map(n => (
        <button key={n}
          onClick={() => !readonly && onChange(n === value ? 0 : n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            background: "none", border: "none",
            cursor: readonly ? "default" : "pointer",
            fontSize: "1.1rem", padding: "0 0.02rem", lineHeight: 1,
            color: n <= (hovered || value) ? C.star : C.inkFaint,
            transform: !readonly && n <= (hovered || value) ? "scale(1.15)" : "scale(1)",
            transition: "all 0.08s",
          }}
        >★</button>
      ))}
      {!readonly && (hovered || value) > 0 && (
        <span style={{ fontSize: "0.68rem", color: C.inkMuted, marginLeft: "0.3rem", fontFamily: C.font, fontStyle: "italic" }}>
          {labels[hovered || value]}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BINDER HOLE PUNCH — decorative
// ─────────────────────────────────────────────────────────────────
function HolePunch() {
  return (
    <div style={{
      width: 18, height: 18, borderRadius: "50%",
      background: C.hole,
      border: `1.5px solid ${C.spine}`,
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.15)",
      flexShrink: 0,
    }} />
  );
}

// ─────────────────────────────────────────────────────────────────
// RECIPE CARD — the main display unit
// ─────────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onEdit, onDelete, sectionName }) {
  const [expanded, setExpanded] = useState(false);
  const ingredients = recipe.ingredients || [];
  const method = recipe.method || [];

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.spine}`,
      borderRadius: 3,
      marginBottom: "0.75rem",
      boxShadow: "1px 2px 6px rgba(0,0,0,0.08), 0 0 0 0.5px rgba(180,160,120,0.3)",
      overflow: "hidden",
      transition: "box-shadow 0.15s",
      position: "relative",
    }}>
      {/* Card header — index card tab feel */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{
          padding: "0.65rem 0.85rem 0.55rem",
          cursor: "pointer",
          borderBottom: expanded ? `1px solid ${C.cardLine}` : "none",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.6rem",
          userSelect: "none",
        }}
      >
        {/* Recipe title */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: "0.95rem",
            fontFamily: C.font,
            color: C.ink,
            fontWeight: "bold",
            lineHeight: 1.3,
            marginBottom: "0.2rem",
          }}>{recipe.title}</div>

          {/* Meta row: time + servings + rating */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
            {recipe.prep_time && (
              <span style={{ fontSize: "0.65rem", color: C.inkMuted, fontFamily: C.font }}>
                ⏱ prep {recipe.prep_time}
              </span>
            )}
            {recipe.cook_time && (
              <span style={{ fontSize: "0.65rem", color: C.inkMuted, fontFamily: C.font }}>
                🔥 cook {recipe.cook_time}
              </span>
            )}
            {recipe.servings && (
              <span style={{ fontSize: "0.65rem", color: C.inkMuted, fontFamily: C.font }}>
                🍽 {recipe.servings}
              </span>
            )}
            {recipe.rating > 0 && (
              <StarRating value={recipe.rating} onChange={() => {}} readonly />
            )}
          </div>
        </div>

        {/* Expand chevron + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onEdit(recipe); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint, fontSize: "0.78rem", padding: "0.1rem 0.2rem", transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.inkMid}
            onMouseLeave={e => e.currentTarget.style.color = C.inkFaint}
            title="Edit">✎</button>
          <button onClick={e => { e.stopPropagation(); onDelete(recipe.id); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.inkFaint, fontSize: "0.9rem", padding: "0.1rem 0.2rem", transition: "color 0.12s" }}
            onMouseEnter={e => e.currentTarget.style.color = C.red}
            onMouseLeave={e => e.currentTarget.style.color = C.inkFaint}
            title="Delete">×</button>
          <span style={{ fontSize: "0.6rem", color: C.inkFaint }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {/* Expanded card body — ruled lines */}
      {expanded && (
        <div style={{ ...ruledLineStyle, padding: "0.75rem 0.85rem 0.85rem" }}>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.inkMuted, fontFamily: C.font, marginBottom: "0.45rem" }}>Ingredients</div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {ingredients.map((ing, i) => (
                  <li key={i} style={{ fontSize: "0.82rem", color: C.inkMid, fontFamily: C.font, padding: "0.12rem 0", display: "flex", gap: "0.4rem", lineHeight: 1.4 }}>
                    <span style={{ color: C.inkFaint, flexShrink: 0 }}>—</span>
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Method */}
          {method.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.inkMuted, fontFamily: C.font, marginBottom: "0.45rem" }}>Method</div>
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {method.map((step, i) => (
                  <li key={i} style={{ fontSize: "0.82rem", color: C.inkMid, fontFamily: C.font, padding: "0.2rem 0", display: "flex", gap: "0.5rem", lineHeight: 1.5 }}>
                    <span style={{ color: C.spineDeep, fontWeight: "bold", flexShrink: 0, minWidth: "1rem" }}>{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Notes */}
          {recipe.notes && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.inkMuted, fontFamily: C.font, marginBottom: "0.3rem" }}>Notes</div>
              <div style={{ fontSize: "0.8rem", color: C.inkMid, fontFamily: C.font, fontStyle: "italic", lineHeight: 1.5 }}>{recipe.notes}</div>
            </div>
          )}

          {/* Source */}
          {recipe.source && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.inkMuted, fontFamily: C.font, marginBottom: "0.3rem" }}>Source</div>
              <div style={{ fontSize: "0.75rem", color: C.inkMuted, fontFamily: C.font }}>{recipe.source}</div>
            </div>
          )}

          {/* Rating (interactive when expanded) */}
          <div>
            <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: C.inkMuted, fontFamily: C.font, marginBottom: "0.3rem" }}>My Rating</div>
            <StarRating value={recipe.rating || 0} onChange={() => onEdit({ ...recipe, _rateOnly: true })} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RECIPE FORM MODAL
// ─────────────────────────────────────────────────────────────────
function RecipeModal({ recipe, sections, sectionId, onSave, onClose }) {
  const isNew = !recipe?.id;

  const [title, setTitle]       = useState(recipe?.title || "");
  const [selSection, setSelSection] = useState(recipe?.section_id || sectionId || sections[0]?.id || "");
  const [prepTime, setPrepTime] = useState(recipe?.prep_time || "");
  const [cookTime, setCookTime] = useState(recipe?.cook_time || "");
  const [servings, setServings] = useState(recipe?.servings || "");
  const [source, setSource]     = useState(recipe?.source || "");
  const [notes, setNotes]       = useState(recipe?.notes || "");
  const [rating, setRating]     = useState(recipe?.rating || 0);
  const [ingredientText, setIngredientText] = useState(
    (recipe?.ingredients || []).join("\n")
  );
  const [methodText, setMethodText] = useState(
    (recipe?.method || []).join("\n")
  );
  const [saving, setSaving] = useState(false);

  const inp = {
    width: "100%", background: C.card, border: `1px solid ${C.spine}`,
    borderRadius: 4, color: C.ink, padding: "0.38rem 0.6rem",
    fontSize: "0.85rem", fontFamily: C.font, outline: "none",
    boxSizing: "border-box",
  };
  const ta = { ...inp, resize: "vertical", minHeight: 90, lineHeight: 1.6 };
  const label = {
    fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.1em",
    color: C.inkMuted, display: "block", marginBottom: "0.3rem", fontFamily: C.font,
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const ingredients = ingredientText.split("\n").map(s => s.trim()).filter(Boolean);
    const method      = methodText.split("\n").map(s => s.trim()).filter(Boolean);
    await onSave({
      id: recipe?.id,
      title: title.trim(),
      section_id: selSection,
      prep_time: prepTime.trim(),
      cook_time: cookTime.trim(),
      servings: servings.trim(),
      source: source.trim(),
      notes: notes.trim(),
      rating,
      ingredients,
      method,
    });
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.55)", zIndex: 1000, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "1rem", overflowY: "auto" }}>
      <div style={{ background: C.paper, border: `1px solid ${C.spine}`, borderRadius: 4, width: "100%", maxWidth: 500, fontFamily: C.font, boxShadow: "0 8px 32px rgba(0,0,0,0.22)", margin: "auto" }}>

        {/* Modal header */}
        <div style={{ padding: "1rem 1.2rem 0.75rem", borderBottom: `1px solid ${C.cardLine}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: C.ink }}>
            {isNew ? "New Recipe" : "Edit Recipe"}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.inkMuted, fontSize: "1.2rem", cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        <div style={{ padding: "1rem 1.2rem 1.2rem", display: "flex", flexDirection: "column", gap: "0.85rem" }}>

          {/* Title */}
          <div>
            <label style={label}>Recipe Name *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Grandma's Shortbread" style={{ ...inp, fontSize: "1rem", fontWeight: "bold" }} />
          </div>

          {/* Section */}
          <div>
            <label style={label}>Section</label>
            <select value={selSection} onChange={e => setSelSection(e.target.value)} style={inp}>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Time + servings row */}
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Prep Time</label>
              <input value={prepTime} onChange={e => setPrepTime(e.target.value)} placeholder="e.g. 20 min" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Cook Time</label>
              <input value={cookTime} onChange={e => setCookTime(e.target.value)} placeholder="e.g. 45 min" style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Servings</label>
              <input value={servings} onChange={e => setServings(e.target.value)} placeholder="e.g. 4–6" style={inp} />
            </div>
          </div>

          {/* Ingredients */}
          <div>
            <label style={label}>Ingredients <span style={{ textTransform: "none", letterSpacing: 0, color: C.inkFaint }}>(one per line)</span></label>
            <textarea value={ingredientText} onChange={e => setIngredientText(e.target.value)}
              placeholder={"250g butter, softened\n1 cup icing sugar\n2 cups flour"}
              style={{ ...ta, minHeight: 100 }} />
          </div>

          {/* Method */}
          <div>
            <label style={label}>Method <span style={{ textTransform: "none", letterSpacing: 0, color: C.inkFaint }}>(one step per line)</span></label>
            <textarea value={methodText} onChange={e => setMethodText(e.target.value)}
              placeholder={"Cream the butter and sugar until pale.\nSift in the flour and mix to a soft dough.\nRoll out and cut into shapes."}
              style={{ ...ta, minHeight: 120 }} />
          </div>

          {/* Source */}
          <div>
            <label style={label}>Source / Origin</label>
            <input value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Mum, or 'Nigella Lawson p.42'" style={inp} />
          </div>

          {/* Notes */}
          <div>
            <label style={label}>My Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Any tweaks, substitutions, or things to remember…"
              style={{ ...ta, minHeight: 70 }} />
          </div>

          {/* Rating */}
          <div>
            <label style={label}>Rating</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.6rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
            <button onClick={onClose} style={{ background: "transparent", border: `1px solid ${C.spine}`, borderRadius: 4, color: C.inkMuted, padding: "0.4rem 1rem", fontSize: "0.82rem", fontFamily: C.font, cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} disabled={saving || !title.trim()}
              style={{ background: C.spineDeep, border: "none", borderRadius: 4, color: C.paper, padding: "0.4rem 1.2rem", fontSize: "0.82rem", fontFamily: C.font, cursor: saving ? "not-allowed" : "pointer", fontWeight: "bold", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving…" : "Save Recipe"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SECTION MANAGER MODAL
// ─────────────────────────────────────────────────────────────────
function SectionModal({ sections, userId, onUpdate, onClose }) {
  const [items, setItems]   = useState(sections.map(s => ({ ...s })));
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const addSection = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const s = {
      id: `sec-${Date.now()}`,
      user_id: userId,
      name: newName.trim(),
      position: items.length,
    };
    const saved = await dbSaveSection(s);
    const updated = [...items, saved || s];
    setItems(updated);
    setNewName("");
    setSaving(false);
    onUpdate(updated);
    inputRef.current?.focus();
  };

  const removeSection = async (id) => {
    await dbDeleteSection(id);
    const updated = items.filter(s => s.id !== id).map((s, i) => ({ ...s, position: i }));
    setItems(updated);
    onUpdate(updated);
  };

  const renameSection = (id, name) => {
    setItems(prev => prev.map(s => s.id === id ? { ...s, name } : s));
  };

  const saveRename = async (s) => {
    await dbSaveSection(s);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(44,36,22,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: C.paper, border: `1px solid ${C.spine}`, borderRadius: 4, width: "100%", maxWidth: 380, fontFamily: C.font, boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <div style={{ padding: "1rem 1.2rem 0.75rem", borderBottom: `1px solid ${C.cardLine}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: "0.95rem", fontWeight: "bold", color: C.ink }}>Manage Sections</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C.inkMuted, fontSize: "1.2rem", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "1rem 1.2rem" }}>
          {items.length === 0 && (
            <div style={{ color: C.inkFaint, fontSize: "0.82rem", fontStyle: "italic", marginBottom: "0.75rem" }}>No sections yet — add one below.</div>
          )}
          {items.map(s => (
            <div key={s.id} style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
              <input value={s.name} onChange={e => renameSection(s.id, e.target.value)}
                onBlur={() => saveRename(s)}
                onKeyDown={e => e.key === "Enter" && e.currentTarget.blur()}
                style={{ flex: 1, background: C.card, border: `1px solid ${C.spine}`, borderRadius: 4, color: C.ink, padding: "0.32rem 0.55rem", fontSize: "0.85rem", fontFamily: C.font, outline: "none" }} />
              <button onClick={() => removeSection(s.id)}
                style={{ background: "none", border: "none", color: C.inkFaint, cursor: "pointer", fontSize: "0.9rem", transition: "color 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.color = C.red}
                onMouseLeave={e => e.currentTarget.style.color = C.inkFaint}
                title="Delete section">×</button>
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <input ref={inputRef} value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSection()}
              placeholder="New section name…"
              style={{ flex: 1, background: C.card, border: `1px solid ${C.spine}`, borderRadius: 4, color: C.ink, padding: "0.32rem 0.55rem", fontSize: "0.85rem", fontFamily: C.font, outline: "none" }} />
            <button onClick={addSection} disabled={saving || !newName.trim()}
              style={{ background: C.spineDeep, border: "none", borderRadius: 4, color: C.paper, padding: "0.32rem 0.85rem", fontSize: "0.82rem", fontFamily: C.font, cursor: "pointer", fontWeight: "bold", opacity: !newName.trim() ? 0.5 : 1 }}>
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────────
function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const fakeEmail = u => `${u.toLowerCase().replace(/[^a-z0-9]/g, "")}@cookbook.app`;

  const handle = async () => {
    if (!username.trim() || !password.trim()) { setError("Please fill in both fields."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    const email = fakeEmail(username.trim());
    if (mode === "signup") {
      const { data: existing } = await supabase.from("accounts").select("id").eq("username", username.trim().toLowerCase()).maybeSingle();
      if (existing) { setError("That username is taken."); setLoading(false); return; }
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      await supabase.from("accounts").insert({ id: data.user.id, username: username.trim().toLowerCase() });
      onAuth(data.user);
    } else {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError("Invalid username or password."); setLoading(false); return; }
      onAuth(data.user);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem", fontFamily: C.font, position: "relative" }}>
      {/* Decorative ruled lines on background */}
      <div style={{ position: "absolute", inset: 0, ...ruledLineStyle, opacity: 0.4 }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Logo */}
        <div style={{ fontSize: "2.4rem", marginBottom: "0.2rem" }}>📖</div>
        <div style={{ fontSize: "1.6rem", fontWeight: "bold", color: C.ink, letterSpacing: "0.04em", marginBottom: "0.15rem" }}>My Cookbook</div>
        <div style={{ fontSize: "0.75rem", color: C.inkMuted, marginBottom: "2.5rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {mode === "login" ? "Welcome back" : "Create your cookbook"}
        </div>

        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {[
            { v: username, set: setUsername, ph: "Username", type: "text" },
            { v: password, set: setPassword, ph: "Password", type: "password" },
          ].map(({ v, set, ph, type }) => (
            <input key={ph} value={v} onChange={e => set(e.target.value)} placeholder={ph} type={type}
              onKeyDown={e => e.key === "Enter" && handle()}
              autoCapitalize="none" autoCorrect="off"
              style={{ width: "100%", background: C.card, border: `1px solid ${C.spine}`, borderRadius: 4, color: C.ink, padding: "0.65rem 0.9rem", fontSize: "0.95rem", fontFamily: C.font, outline: "none", boxSizing: "border-box" }} />
          ))}
          {error && <div style={{ color: C.red, fontSize: "0.8rem", textAlign: "center" }}>{error}</div>}
          <button onClick={handle} disabled={loading}
            style={{ background: C.spineDeep, border: "none", borderRadius: 4, color: C.paper, padding: "0.7rem", fontSize: "0.95rem", fontFamily: C.font, cursor: loading ? "not-allowed" : "pointer", fontWeight: "bold", opacity: loading ? 0.7 : 1, marginTop: "0.25rem" }}>
            {loading ? "…" : mode === "login" ? "Open Cookbook" : "Create Cookbook"}
          </button>
          <button onClick={() => { setMode(m => m === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "transparent", border: "none", color: C.inkMuted, fontSize: "0.8rem", fontFamily: C.font, cursor: "pointer", textDecoration: "underline" }}>
            {mode === "login" ? "New here? Create a cookbook" : "Already have one? Log in"}
          </button>
        </div>
        <div style={{ color: C.inkFaint, fontSize: "0.65rem", marginTop: "2rem", textAlign: "center" }}>No email required.</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
export default function Cookbook() {
  const [authUser, setAuthUser]   = useState(undefined);
  const [sections, setSections]   = useState([]);
  const [recipes, setRecipes]     = useState([]);
  const [activeSection, setActiveSection] = useState(null); // null = All
  const [search, setSearch]       = useState("");
  const [editingRecipe, setEditingRecipe] = useState(null); // null=closed, {}=new, recipe=edit
  const [showSectionMgr, setShowSectionMgr] = useState(false);
  const [loading, setLoading]     = useState(true);

  // ── Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setAuthUser(session?.user || null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setAuthUser(s?.user || null));
    return () => subscription.unsubscribe();
  }, []);

  // ── Load data
  useEffect(() => {
    if (!authUser) return;
    setLoading(true);
    Promise.all([
      dbGetSections(authUser.id),
      dbGetRecipes(authUser.id),
    ]).then(([secs, recs]) => {
      setSections(secs);
      setRecipes(recs);
      setLoading(false);
    });
  }, [authUser]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthUser(null); setSections([]); setRecipes([]);
  };

  const handleSaveRecipe = async (data) => {
    const record = {
      ...data,
      id: data.id || `rec-${Date.now()}`,
      user_id: authUser.id,
      created_at: data.created_at || new Date().toISOString(),
    };
    const saved = await dbSaveRecipe(record);
    const final = saved || record;
    setRecipes(prev => {
      const exists = prev.find(r => r.id === final.id);
      return exists ? prev.map(r => r.id === final.id ? final : r) : [final, ...prev];
    });
    setEditingRecipe(null);
  };

  const handleDeleteRecipe = async (id) => {
    await dbDeleteRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  };

  const handleEditRecipe = (recipe) => {
    if (recipe._rateOnly) {
      // Quick rating update — open modal pre-filled
      setEditingRecipe(recipe);
    } else {
      setEditingRecipe(recipe);
    }
  };

  // ── Filter recipes
  const visibleRecipes = recipes.filter(r => {
    const inSection = activeSection === null || r.section_id === activeSection;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q) || (r.ingredients || []).some(i => i.toLowerCase().includes(q));
    return inSection && matchSearch;
  });

  // ── Guards
  if (authUser === undefined) return (
    <div style={{ minHeight: "100vh", background: C.paper, display: "flex", alignItems: "center", justifyContent: "center", color: C.inkMuted, fontFamily: C.font }}>Opening cookbook…</div>
  );
  if (!authUser) return <AuthPage onAuth={setAuthUser} />;

  // ── All-sections tab
  const allTab = { id: null, name: "All Recipes" };
  const allTabsIncAll = [allTab, ...sections];

  return (
    <div style={{ minHeight: "100vh", background: C.paper, fontFamily: C.font, color: C.ink, display: "flex", flexDirection: "column" }}>

      {/* ── HEADER ───────────────────────────────────── */}
      <div style={{
        background: C.paper,
        borderBottom: `1px solid ${C.spine}`,
        padding: "0.5rem 0 0 1rem",
        position: "sticky",
        top: 0,
        zIndex: 20,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
      }}>
        {/* Left: title */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", paddingBottom: "0.45rem" }}>
          <span style={{ fontSize: "1.1rem" }}>📖</span>
          <span style={{ fontSize: "0.9rem", fontWeight: "bold", color: C.ink, letterSpacing: "0.03em" }}>My Cookbook</span>
        </div>

        {/* Right: binder tabs for sections + manage button */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 2, overflowX: "auto", paddingRight: "0.75rem" }}>
          {/* Manage sections button */}
          <div style={{ paddingBottom: "0.45rem", marginRight: "0.4rem", flexShrink: 0 }}>
            <button onClick={() => setShowSectionMgr(true)}
              style={{ background: "transparent", border: `1px solid ${C.spine}`, borderRadius: 4, color: C.inkMuted, padding: "0.18rem 0.5rem", fontSize: "0.6rem", fontFamily: C.font, cursor: "pointer", whiteSpace: "nowrap" }}>
              ⚙ Sections
            </button>
            <button onClick={handleLogout}
              style={{ background: "transparent", border: "none", color: C.inkFaint, padding: "0.18rem 0.35rem", fontSize: "0.6rem", fontFamily: C.font, cursor: "pointer", marginLeft: "0.25rem" }}>
              Log out
            </button>
          </div>

          {/* Binder tabs — one per section + All */}
          {allTabsIncAll.map(s => {
            const active = activeSection === s.id;
            const count = s.id === null
              ? recipes.length
              : recipes.filter(r => r.section_id === s.id).length;
            return (
              <button key={s.id ?? "all"} onClick={() => setActiveSection(s.id)}
                style={{
                  height: 44,
                  minWidth: 54,
                  maxWidth: 90,
                  padding: "0 0.6rem",
                  background: active ? C.card : C.tabInactive,
                  border: `1px solid ${C.spine}`,
                  borderBottom: active ? `1px solid ${C.card}` : `1px solid ${C.spine}`,
                  borderRadius: "5px 5px 0 0",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 1,
                  marginBottom: active ? -1 : 0,
                  transition: "all 0.12s",
                  position: "relative",
                  zIndex: active ? 5 : 1,
                  flexShrink: 0,
                  boxShadow: active ? "0 -2px 5px rgba(0,0,0,0.07)" : "none",
                }}>
                <span style={{ fontSize: "0.68rem", fontFamily: C.font, fontWeight: active ? "bold" : "normal", color: active ? C.inkMid : C.inkMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%", lineHeight: 1.2 }}>
                  {s.name}
                </span>
                <span style={{ fontSize: "0.52rem", color: active ? C.spineDeep : C.inkFaint }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1rem 4rem" }}>

        {/* Binder spine + hole punches on the left */}
        <div style={{ display: "flex", gap: "0.85rem" }}>

          {/* Left spine strip */}
          <div style={{
            flexShrink: 0,
            width: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "0.5rem",
            gap: "1.8rem",
            borderRight: `2px solid ${C.spine}`,
            marginRight: "0.15rem",
          }}>
            {Array.from({ length: 8 }).map((_, i) => <HolePunch key={i} />)}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Search + add row */}
            <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search recipes…"
                style={{ flex: 1, background: C.card, border: `1px solid ${C.spine}`, borderRadius: 4, color: C.ink, padding: "0.35rem 0.65rem", fontSize: "0.82rem", fontFamily: C.font, outline: "none" }} />
              <button onClick={() => setEditingRecipe({})}
                style={{ background: C.spineDeep, border: "none", borderRadius: 4, color: C.paper, padding: "0.35rem 0.85rem", fontSize: "0.8rem", fontFamily: C.font, cursor: "pointer", fontWeight: "bold", whiteSpace: "nowrap", flexShrink: 0 }}>
                + Recipe
              </button>
            </div>

            {/* Section label */}
            <div style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.14em", color: C.inkMuted, marginBottom: "0.65rem" }}>
              {activeSection === null ? "All Recipes" : sections.find(s => s.id === activeSection)?.name}
              {" "}— {visibleRecipes.length} {visibleRecipes.length === 1 ? "recipe" : "recipes"}
            </div>

            {/* Loading */}
            {loading && (
              <div style={{ color: C.inkFaint, fontSize: "0.85rem", padding: "2rem 0", textAlign: "center", fontStyle: "italic" }}>Opening cookbook…</div>
            )}

            {/* Empty state */}
            {!loading && visibleRecipes.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem 0", color: C.inkMuted }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🍳</div>
                <div style={{ fontSize: "0.88rem", fontStyle: "italic", marginBottom: "1rem" }}>
                  {search ? "No recipes match that search." : "No recipes here yet."}
                </div>
                {!search && sections.length === 0 && (
                  <div style={{ fontSize: "0.78rem", color: C.inkFaint }}>
                    Start by adding sections (⚙ Sections above), then add your first recipe.
                  </div>
                )}
                {!search && sections.length > 0 && (
                  <button onClick={() => setEditingRecipe({})}
                    style={{ background: "transparent", border: `1px dashed ${C.spine}`, borderRadius: 4, color: C.inkMuted, padding: "0.5rem 1.2rem", fontSize: "0.82rem", fontFamily: C.font, cursor: "pointer" }}>
                    + Add your first recipe
                  </button>
                )}
              </div>
            )}

            {/* Recipe cards */}
            {!loading && visibleRecipes.map(r => (
              <RecipeCard
                key={r.id}
                recipe={r}
                onEdit={handleEditRecipe}
                onDelete={handleDeleteRecipe}
                sectionName={sections.find(s => s.id === r.section_id)?.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── MODALS ───────────────────────────────────── */}
      {editingRecipe !== null && (
        <RecipeModal
          recipe={Object.keys(editingRecipe).length === 0 ? null : editingRecipe}
          sections={sections}
          sectionId={activeSection}
          onSave={handleSaveRecipe}
          onClose={() => setEditingRecipe(null)}
        />
      )}

      {showSectionMgr && (
        <SectionModal
          sections={sections}
          userId={authUser.id}
          onUpdate={setSections}
          onClose={() => setShowSectionMgr(false)}
        />
      )}
    </div>
  );
}
