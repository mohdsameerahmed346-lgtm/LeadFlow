import { useState, useEffect, useRef } from "react";

// ── DEMO DATA ─────────────────────────────────────────────────────────────────
const DEMO_USER = { id: "u1", name: "Arjun Mehta", email: "arjun@leadflow.in", phone: "9876543210" };

const DEMO_LEADS = [
  { id: "l1", user_id: "u1", name: "Ravi Kumar", phone: "9876500001", budget: "80", location: "Gachibowli", notes: "Wants near metro. Wife involved in decision.", status: "hot", pipeline: "site_visit", source: "whatsapp", followup_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(), created_at: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: "l2", user_id: "u1", name: "Priya Sharma", phone: "9876500002", budget: "120", location: "Banjara Hills", notes: "Looking for 3BHK. Budget flexible by 10L.", status: "warm", pipeline: "contacted", source: "facebook", followup_time: new Date(Date.now() + 2 * 3600000).toISOString(), created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
  { id: "l3", user_id: "u1", name: "Suresh Reddy", phone: "9876500003", budget: "45", location: "Miyapur", notes: "First-time buyer. Needs loan assistance.", status: "new", pipeline: "new", source: "portal", followup_time: new Date(Date.now() + 24 * 3600000).toISOString(), created_at: new Date(Date.now() - 3 * 3600000).toISOString() },
  { id: "l4", user_id: "u1", name: "Anita Singh", phone: "9876500004", budget: "200", location: "Jubilee Hills", notes: "Premium property only. Immediate purchase.", status: "hot", pipeline: "negotiation", source: "referral", followup_time: new Date(Date.now() + 1 * 3600000).toISOString(), created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "l5", user_id: "u1", name: "Mohan Das", phone: "9876500005", budget: "60", location: "HITEC City", notes: "Prefers ground floor.", status: "cold", pipeline: "closed_lost", source: "instagram", followup_time: new Date(Date.now() - 3 * 86400000).toISOString(), created_at: new Date(Date.now() - 10 * 86400000).toISOString() },
  { id: "l6", user_id: "u1", name: "Kavitha Nair", phone: "9876500006", budget: "95", location: "Kondapur", notes: "2BHK, ready to move. Site visit done.", status: "warm", pipeline: "negotiation", source: "whatsapp", followup_time: new Date(Date.now() + 3 * 3600000).toISOString(), created_at: new Date(Date.now() - 7 * 86400000).toISOString() },
];

const TEMPLATES = [
  { id: "t1", title: "Initial Greeting", icon: "👋", message: "Hi {name}, thanks for your interest! I'm Arjun from LeadFlow Properties. I'd love to help you find your perfect home in {location}. When would be a good time to connect?" },
  { id: "t2", title: "Followup Reminder", icon: "📞", message: "Hi {name}, this is a gentle followup on the properties we discussed in {location}. We have some great new options within your budget. Would you like to schedule a site visit?" },
  { id: "t3", title: "Site Visit Invite", icon: "🏠", message: "Hi {name}, I have a great property ready for you to visit in {location}. It perfectly matches your requirements. Can we schedule a visit this weekend?" },
  { id: "t4", title: "Price Updated", icon: "💰", message: "Good news {name}! The property you were interested in {location} has a revised price. This is a great deal within your ₹{budget}L budget. Let's connect soon!" },
  { id: "t5", title: "Closing Push", icon: "🎯", message: "Hi {name}, just wanted to let you know that there's been high interest in the properties in {location}. I'd hate for you to miss out. Shall we proceed?" },
];

const PIPELINE_STAGES = [
  { key: "new", label: "New Lead", color: "#6366F1", bg: "#EEF2FF" },
  { key: "contacted", label: "Contacted", color: "#F59E0B", bg: "#FFFBEB" },
  { key: "site_visit", label: "Site Visit", color: "#8B5CF6", bg: "#F5F3FF" },
  { key: "negotiation", label: "Negotiation", color: "#EC4899", bg: "#FDF2F8" },
  { key: "closed_won", label: "Closed ✓", color: "#10B981", bg: "#ECFDF5" },
  { key: "closed_lost", label: "Lost ✗", color: "#9CA3AF", bg: "#F9FAFB" },
];

const SOURCES = ["WhatsApp", "Facebook", "Instagram", "Portal", "Referral", "Walk-in", "Other"];

// ── UTILS ─────────────────────────────────────────────────────────────────────
function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diff = d - now;
  const absDiff = Math.abs(diff);
  if (absDiff < 60000) return "just now";
  if (absDiff < 3600000) return `${Math.round(absDiff / 60000)}m ${diff < 0 ? "ago" : ""}`;
  if (absDiff < 86400000) return `${Math.round(absDiff / 3600000)}h ${diff < 0 ? "ago" : ""}`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function isOverdue(iso) { return iso && new Date(iso) < new Date(); }
function isToday(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getDate() === n.getDate() && d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
}

function getStatusColor(status) {
  return { hot: "#EF4444", warm: "#F59E0B", new: "#6366F1", cold: "#9CA3AF" }[status] || "#9CA3AF";
}

function getPipelineInfo(key) { return PIPELINE_STAGES.find(s => s.key === key) || PIPELINE_STAGES[0]; }

function openWhatsApp(phone, message = "") {
  const clean = phone.replace(/\D/g, "");
  const num = clean.startsWith("91") ? clean : `91${clean}`;
  const url = `https://wa.me/${num}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  window.open(url, "_blank");
}

// ── COMPONENTS ────────────────────────────────────────────────────────────────
function Badge({ color, bg, children, small }) {
  return (
    <span style={{ background: bg || "#F3F4F6", color: color || "#374151", padding: small ? "2px 8px" : "3px 10px", borderRadius: 20, fontSize: small ? 10 : 11, fontWeight: 600, letterSpacing: .3, display: "inline-flex", alignItems: "center", gap: 4 }}>
      {children}
    </span>
  );
}

function Card({ children, onClick, style = {} }) {
  return (
    <div onClick={onClick} style={{ background: "white", borderRadius: 16, padding: "16px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)", border: "1px solid #F1F1F1", cursor: onClick ? "pointer" : "default", transition: "transform .15s, box-shadow .15s", ...style }}
      onMouseEnter={e => onClick && (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")}
      onMouseLeave={e => onClick && (e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)")}>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, letterSpacing: .3, textTransform: "uppercase" }}>{label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 15, color: "#111827", background: "#FAFAFA", outline: "none", fontFamily: "inherit", boxSizing: "border-box", transition: "border-color .2s" }}
        onFocus={e => e.target.style.borderColor = "#7C3AED"}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"}
      />
    </div>
  );
}

function Select({ label, value, onChange, options, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 6, letterSpacing: .3, textTransform: "uppercase" }}>{label}{required && <span style={{ color: "#EF4444", marginLeft: 3 }}>*</span>}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 15, color: "#111827", background: "#FAFAFA", outline: "none", fontFamily: "inherit", appearance: "none", boxSizing: "border-box" }}
        onFocus={e => e.target.style.borderColor = "#7C3AED"}
        onBlur={e => e.target.style.borderColor = "#E5E7EB"}>
        {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", full, small, disabled, style: s = {} }) {
  const styles = {
    primary: { background: "#7C3AED", color: "white", border: "none" },
    secondary: { background: "#F3F4F6", color: "#374151", border: "none" },
    ghost: { background: "transparent", color: "#7C3AED", border: "1.5px solid #E5E7EB" },
    danger: { background: "#FEF2F2", color: "#EF4444", border: "none" },
    whatsapp: { background: "#25D366", color: "white", border: "none" },
    call: { background: "#EEF2FF", color: "#4338CA", border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...styles[variant], padding: small ? "8px 14px" : "12px 20px", borderRadius: 12, fontSize: small ? 13 : 15, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? .5 : 1, width: full ? "100%" : "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, fontFamily: "inherit", transition: "all .15s", ...s }}>
      {children}
    </button>
  );
}

function BottomNav({ page, setPage }) {
  const items = [
    { id: "home", icon: "⚡", label: "Home" },
    { id: "leads", icon: "👥", label: "Leads" },
    { id: "pipeline", icon: "📊", label: "Pipeline" },
    { id: "templates", icon: "💬", label: "Templates" },
    { id: "settings", icon: "⚙️", label: "Settings" },
  ];
  return (
    <nav style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "white", borderTop: "1px solid #F1F1F1", display: "flex", zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)", boxShadow: "0 -4px 20px rgba(0,0,0,0.06)", maxWidth: 480, margin: "0 auto" }}>
      {items.map(it => (
        <button key={it.id} onClick={() => setPage(it.id)}
          style={{ flex: 1, padding: "10px 4px 8px", border: "none", background: "transparent", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span style={{ fontSize: 10, fontWeight: page === it.id ? 700 : 400, color: page === it.id ? "#7C3AED" : "#9CA3AF", letterSpacing: .3 }}>{it.label}</span>
          {page === it.id && <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#7C3AED" }} />}
        </button>
      ))}
    </nav>
  );
}

function TopBar({ title, back, onBack, action }) {
  return (
    <div style={{ position: "sticky", top: 0, background: "rgba(250,250,250,0.96)", backdropFilter: "blur(12px)", borderBottom: "1px solid #F1F1F1", padding: "14px 20px", display: "flex", alignItems: "center", gap: 12, zIndex: 50 }}>
      {back && <button onClick={onBack} style={{ background: "#F3F4F6", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>}
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, flex: 1, letterSpacing: -.3, color: "#0F172A" }}>{title}</span>
      {action}
    </div>
  );
}

function LeadCard({ lead, onClick }) {
  const overdue = isOverdue(lead.followup_time);
  const today = isToday(lead.followup_time);
  const pi = getPipelineInfo(lead.pipeline);
  return (
    <Card onClick={onClick} style={{ marginBottom: 10, borderLeft: `3px solid ${getStatusColor(lead.status)}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${getStatusColor(lead.status)}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: getStatusColor(lead.status) }}>
            {lead.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{lead.name}</div>
            <div style={{ fontSize: 12, color: "#6B7280" }}>₹{lead.budget}L · {lead.location}</div>
          </div>
        </div>
        <Badge color={pi.color} bg={pi.bg}>{pi.label}</Badge>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {overdue && <Badge color="#EF4444" bg="#FEF2F2">⚠️ Overdue</Badge>}
          {today && !overdue && <Badge color="#7C3AED" bg="#EEF2FF">📅 Today</Badge>}
          {!overdue && !today && <span style={{ fontSize: 12, color: "#9CA3AF" }}>📅 {formatTime(lead.followup_time)}</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); openWhatsApp(lead.phone); }}
          style={{ background: "#DCFCE7", border: "none", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#16A34A", display: "flex", alignItems: "center", gap: 4 }}>
          💬 WA
        </button>
      </div>
    </Card>
  );
}

// ── SCREENS ───────────────────────────────────────────────────────────────────

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("arjun@leadflow.in");
  const [pass, setPass] = useState("demo123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function handle() {
    if (!email || !pass) { setErr("Please fill all fields."); return; }
    if (mode === "signup" && !name) { setErr("Please enter your name."); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(DEMO_USER); }, 1000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F5F3FF 0%, #FAFAFA 50%, #EEF2FF 100%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');body{font-family:'DM Sans',sans-serif;margin:0;background:#FAFAFA}`}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ width: 56, height: 56, background: "#7C3AED", borderRadius: 16, margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>⚡</div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: -1 }}>LeadFlow</h1>
          <p style={{ color: "#6B7280", fontSize: 14, margin: 0 }}>WhatsApp-first CRM for real estate agents</p>
        </div>

        <div style={{ background: "white", borderRadius: 20, padding: 28, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>
          <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px", letterSpacing: -.3 }}>{mode === "login" ? "Welcome back 👋" : "Get started 🚀"}</h2>
          <p style={{ color: "#6B7280", fontSize: 13, margin: "0 0 22px" }}>{mode === "login" ? "Login to your account" : "Create your free account"}</p>

          <div style={{ background: "#EEF2FF", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#4338CA" }}>
            💡 Demo: arjun@leadflow.in / demo123
          </div>

          {mode === "signup" && <Input label="Full Name" value={name} onChange={setName} placeholder="Arjun Mehta" required />}
          <Input label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" required />
          <Input label="Password" value={pass} onChange={setPass} placeholder="••••••••" type="password" required />

          {err && <div style={{ color: "#EF4444", fontSize: 13, marginBottom: 12, background: "#FEF2F2", padding: "8px 12px", borderRadius: 8 }}>⚠️ {err}</div>}

          <Btn onClick={handle} full disabled={loading}>{loading ? "Please wait..." : mode === "login" ? "Login →" : "Create Account →"}</Btn>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "#6B7280" }}>
            {mode === "login" ? "No account? " : "Have account? "}
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setErr(""); }} style={{ color: "#7C3AED", fontWeight: 600, cursor: "pointer" }}>
              {mode === "login" ? "Sign up free" : "Login"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ leads, setPage, setSelectedLead, setShowAddLead }) {
  const overdue = leads.filter(l => isOverdue(l.followup_time) && !["closed_won", "closed_lost"].includes(l.pipeline));
  const todayLeads = leads.filter(l => isToday(l.followup_time) && !isOverdue(l.followup_time));
  const hot = leads.filter(l => l.status === "hot" && !["closed_won", "closed_lost"].includes(l.pipeline));

  return (
    <div style={{ paddingBottom: 90 }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0, letterSpacing: -.5 }}>Good morning, Arjun 👋</h1>
            <p style={{ color: "#6B7280", fontSize: 13, margin: "3px 0 0" }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 16, fontFamily: "'Syne',sans-serif" }}>A</div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 22 }}>
          {[
            { label: "Total Leads", value: leads.length, color: "#7C3AED", bg: "#F5F3FF" },
            { label: "Hot Leads", value: hot.length, color: "#EF4444", bg: "#FEF2F2" },
            { label: "Overdue", value: overdue.length, color: "#F59E0B", bg: "#FFFBEB" },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 14, padding: "14px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: s.color, marginTop: 4, fontWeight: 600, letterSpacing: .3 }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#EF4444", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>⚠️ Overdue Followups</h3>
              <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 600 }}>{overdue.length}</span>
            </div>
            {overdue.slice(0, 3).map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setPage("lead_detail"); }} />
            ))}
          </div>
        )}

        {/* Today's Followups */}
        {todayLeads.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#7C3AED", margin: 0 }}>📅 Today's Followups</h3>
              <span style={{ fontSize: 12, color: "#7C3AED", fontWeight: 600 }}>{todayLeads.length}</span>
            </div>
            {todayLeads.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setPage("lead_detail"); }} />
            ))}
          </div>
        )}

        {/* Hot Leads */}
        {hot.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>🔥 Hot Leads</h3>
            </div>
            {hot.map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setPage("lead_detail"); }} />
            ))}
          </div>
        )}

        {overdue.length === 0 && todayLeads.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
            <p style={{ fontWeight: 600, color: "#374151" }}>All caught up!</p>
            <p style={{ fontSize: 13 }}>No overdue followups today.</p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAddLead(true)}
        style={{ position: "fixed", bottom: 80, right: 20, width: 56, height: 56, borderRadius: "50%", background: "#7C3AED", border: "none", boxShadow: "0 4px 16px rgba(124,58,237,0.4)", cursor: "pointer", fontSize: 24, color: "white", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 90 }}>
        +
      </button>
    </div>
  );
}

function LeadsScreen({ leads, setPage, setSelectedLead, setShowAddLead }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search) || l.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || l.status === filter || l.pipeline === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="All Leads" action={
        <button onClick={() => setShowAddLead(true)} style={{ background: "#7C3AED", color: "white", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>+ Add</button>
      } />
      <div style={{ padding: "14px 16px 0" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search by name, phone, area..."
          style={{ width: "100%", padding: "12px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, marginBottom: 12, background: "white", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />

        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12, scrollbarWidth: "none" }}>
          {[["all", "All"], ["hot", "🔥 Hot"], ["warm", "☀️ Warm"], ["new", "✨ New"], ["cold", "❄️ Cold"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ flexShrink: 0, padding: "6px 14px", borderRadius: 20, border: filter === v ? "none" : "1.5px solid #E5E7EB", background: filter === v ? "#7C3AED" : "white", color: filter === v ? "white" : "#374151", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {l}
            </button>
          ))}
        </div>

        <p style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 10 }}>{filtered.length} lead{filtered.length !== 1 ? "s" : ""}</p>

        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9CA3AF" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
            <p>No leads found</p>
          </div>
        ) : filtered.map(lead => (
          <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setPage("lead_detail"); }} />
        ))}
      </div>
    </div>
  );
}

function AddLeadModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "", budget: "", location: "", source: "WhatsApp", notes: "", followup_time: "" });
  const [loading, setLoading] = useState(false);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function save() {
    if (!form.name || !form.phone) return;
    setLoading(true);
    setTimeout(() => {
      const newLead = { ...form, id: `l${Date.now()}`, user_id: "u1", status: "new", pipeline: "new", created_at: new Date().toISOString(), source: form.source.toLowerCase() };
      onSave(newLead);
      setLoading(false);
    }, 500);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: "20px 20px 0 0", width: "100%", maxWidth: 480, margin: "0 auto", maxHeight: "92vh", overflowY: "auto", paddingBottom: 24 }}>
        <div style={{ padding: "16px 20px 0", position: "sticky", top: 0, background: "white", zIndex: 10 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 16px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: "#0F172A", margin: 0 }}>➕ Quick Add Lead</h2>
            <button onClick={onClose} style={{ background: "#F3F4F6", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
            <div style={{ gridColumn: "1 / -1" }}><Input label="Name" value={form.name} onChange={v => set("name", v)} placeholder="Ravi Kumar" required /></div>
            <div style={{ gridColumn: "1 / -1" }}><Input label="Phone" value={form.phone} onChange={v => set("phone", v)} placeholder="9876543210" type="tel" required /></div>
            <Input label="Budget (₹L)" value={form.budget} onChange={v => set("budget", v)} placeholder="80" type="number" />
            <Input label="Area" value={form.location} onChange={v => set("location", v)} placeholder="Gachibowli" />
          </div>
          <Select label="Source" value={form.source} onChange={v => set("source", v)} options={SOURCES} />
          <Input label="Followup Date & Time" value={form.followup_time} onChange={v => set("followup_time", v)} type="datetime-local" />
          <Input label="Notes" value={form.notes} onChange={v => set("notes", v)} placeholder="Budget flexible, wants 2BHK..." />
          <Btn onClick={save} full disabled={!form.name || !form.phone || loading}>{loading ? "Saving..." : "💾 Save Lead"}</Btn>
        </div>
      </div>
    </div>
  );
}

function LeadDetailScreen({ lead, onBack, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...lead });
  const [copied, setCopied] = useState(false);
  const pi = getPipelineInfo(form.pipeline);

  function set(k, v) { setForm(p => ({ ...p, [k]: v })); }

  function save() { onUpdate({ ...form }); setEditing(false); }

  function copyAndWA(message) {
    navigator.clipboard?.writeText(message).catch(() => {});
    openWhatsApp(lead.phone, message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ paddingBottom: 100, background: "#FAFAFA", minHeight: "100vh" }}>
      <TopBar title={lead.name} back onBack={onBack} action={
        <button onClick={() => setEditing(!editing)} style={{ background: editing ? "#7C3AED" : "#F3F4F6", color: editing ? "white" : "#374151", border: "none", borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          {editing ? "Cancel" : "✏️ Edit"}
        </button>
      } />

      <div style={{ padding: "16px" }}>
        {/* Header Card */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${getStatusColor(lead.status)}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: getStatusColor(lead.status), flexShrink: 0 }}>
              {lead.name.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              {editing ? <Input value={form.name} onChange={v => set("name", v)} placeholder="Name" /> :
                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A" }}>{lead.name}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                <Badge color={pi.color} bg={pi.bg}>{pi.label}</Badge>
                <Badge color={getStatusColor(lead.status)} bg={`${getStatusColor(lead.status)}15`}>{lead.status?.toUpperCase()}</Badge>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Btn variant="whatsapp" onClick={() => openWhatsApp(lead.phone)}>💬 WhatsApp</Btn>
            <Btn variant="call" onClick={() => window.open(`tel:${lead.phone}`)}>📞 Call Now</Btn>
          </div>
        </Card>

        {/* Details */}
        <Card style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 14px" }}>Lead Details</h3>
          {editing ? (
            <>
              <Input label="Phone" value={form.phone} onChange={v => set("phone", v)} type="tel" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 14px" }}>
                <Input label="Budget (₹L)" value={form.budget} onChange={v => set("budget", v)} type="number" />
                <Input label="Area" value={form.location} onChange={v => set("location", v)} />
              </div>
            </>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Phone", value: lead.phone },
                { label: "Budget", value: `₹${lead.budget}L` },
                { label: "Area", value: lead.location },
                { label: "Source", value: lead.source },
              ].map(d => (
                <div key={d.label}>
                  <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, letterSpacing: .3, textTransform: "uppercase" }}>{d.label}</div>
                  <div style={{ fontSize: 14, color: "#0F172A", fontWeight: 500, marginTop: 3 }}>{d.value || "—"}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pipeline */}
        <Card style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 12px" }}>Pipeline Stage</h3>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            {PIPELINE_STAGES.map(s => (
              <button key={s.key} onClick={() => { set("pipeline", s.key); onUpdate({ ...form, pipeline: s.key }); }}
                style={{ padding: "7px 12px", borderRadius: 10, border: `2px solid ${form.pipeline === s.key ? s.color : "#E5E7EB"}`, background: form.pipeline === s.key ? s.bg : "white", color: form.pipeline === s.key ? s.color : "#6B7280", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}>
                {s.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Followup */}
        <Card style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 12px" }}>📅 Followup Reminder</h3>
          {editing ? <Input value={form.followup_time} onChange={v => set("followup_time", v)} type="datetime-local" /> : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: isOverdue(lead.followup_time) ? "#EF4444" : "#0F172A" }}>
                  {lead.followup_time ? new Date(lead.followup_time).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Not set"}
                </div>
                {isOverdue(lead.followup_time) && <div style={{ fontSize: 12, color: "#EF4444", marginTop: 2 }}>⚠️ Overdue!</div>}
              </div>
              {lead.followup_time && (
                <Badge color={isOverdue(lead.followup_time) ? "#EF4444" : "#7C3AED"} bg={isOverdue(lead.followup_time) ? "#FEF2F2" : "#EEF2FF"}>
                  {formatTime(lead.followup_time)}
                </Badge>
              )}
            </div>
          )}
        </Card>

        {/* Notes */}
        <Card style={{ marginBottom: 12 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 12px" }}>📝 Notes</h3>
          {editing ? (
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Customer preferences, important details..."
              style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #E5E7EB", borderRadius: 12, fontSize: 14, color: "#0F172A", background: "#FAFAFA", outline: "none", resize: "vertical", minHeight: 80, fontFamily: "inherit", boxSizing: "border-box" }} />
          ) : (
            <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.65, margin: 0 }}>{lead.notes || "No notes added."}</p>
          )}
        </Card>

        {editing && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
            <Btn onClick={save} variant="primary">Save Changes</Btn>
            <Btn onClick={() => { setEditing(false); setForm({ ...lead }); }} variant="secondary">Cancel</Btn>
          </div>
        )}

        {/* Quick WhatsApp */}
        <Card>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 12px" }}>💬 Quick Message</h3>
          <Btn variant="whatsapp" full onClick={() => copyAndWA(`Hi ${lead.name}, this is a followup regarding the property in ${lead.location}. When would be a good time to connect?`)}>
            {copied ? "✅ Opened!" : "📲 Send Followup Message"}
          </Btn>
        </Card>
      </div>
    </div>
  );
}

function PipelineScreen({ leads, setPage, setSelectedLead }) {
  const grouped = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter(l => l.pipeline === s.key);
    return acc;
  }, {});

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="Pipeline" />
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
          {PIPELINE_STAGES.map(s => (
            <div key={s.key} style={{ flexShrink: 0, background: s.bg, borderRadius: 10, padding: "6px 12px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, fontWeight: 800, color: s.color }}>{grouped[s.key]?.length || 0}</div>
              <div style={{ fontSize: 10, color: s.color, fontWeight: 600, letterSpacing: .3, whiteSpace: "nowrap" }}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {PIPELINE_STAGES.filter(s => grouped[s.key]?.length > 0).map(stage => (
          <div key={stage.key} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color }} />
              <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>{stage.label}</h3>
              <span style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 600 }}>{grouped[stage.key].length}</span>
            </div>
            {grouped[stage.key].map(lead => (
              <LeadCard key={lead.id} lead={lead} onClick={() => { setSelectedLead(lead); setPage("lead_detail"); }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TemplatesScreen({ leads }) {
  const [copied, setCopied] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);

  function fillTemplate(msg) {
    if (!selectedLead) return msg;
    return msg
      .replace(/{name}/g, selectedLead.name)
      .replace(/{location}/g, selectedLead.location || "your area")
      .replace(/{budget}/g, selectedLead.budget || "your budget");
  }

  function handleTemplate(t) {
    const msg = fillTemplate(t.message);
    if (selectedLead) {
      navigator.clipboard?.writeText(msg).catch(() => {});
      openWhatsApp(selectedLead.phone, msg);
    } else {
      navigator.clipboard?.writeText(msg).catch(() => {});
    }
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="WhatsApp Templates" />
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "12px 14px", marginBottom: 16, fontSize: 13, color: "#92400E" }}>
          💡 Select a lead first to auto-fill their details, then tap a template to open WhatsApp directly.
        </div>

        <Select label="Send to (optional)" value={selectedLead?.id || ""} onChange={v => setSelectedLead(leads.find(l => l.id === v) || null)}
          options={[{ value: "", label: "— No lead selected —" }, ...leads.map(l => ({ value: l.id, label: `${l.name} (${l.location})` }))]} />

        {TEMPLATES.map(t => {
          const preview = fillTemplate(t.message);
          return (
            <Card key={t.id} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{t.icon}</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>{t.title}</span>
                </div>
                <Btn variant="whatsapp" small onClick={() => handleTemplate(t)}>
                  {copied === t.id ? "✅ Sent!" : "💬 Use"}
                </Btn>
              </div>
              <p style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.65, margin: 0, background: "#F9FAFB", borderRadius: 8, padding: "10px 12px" }}>{preview}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SettingsScreen({ user, onLogout }) {
  const stats = [
    { label: "Total Leads", value: DEMO_LEADS.length },
    { label: "Active Leads", value: DEMO_LEADS.filter(l => !["closed_won", "closed_lost"].includes(l.pipeline)).length },
    { label: "Closed Won", value: DEMO_LEADS.filter(l => l.pipeline === "closed_won").length },
  ];

  return (
    <div style={{ paddingBottom: 90 }}>
      <TopBar title="Settings" />
      <div style={{ padding: "16px" }}>
        <Card style={{ marginBottom: 14, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: "#7C3AED", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 24, fontFamily: "'Syne',sans-serif", margin: "0 auto 12px" }}>
            {user.name.charAt(0)}
          </div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: "#0F172A" }}>{user.name}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 3 }}>{user.email}</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
            <Badge color="#7C3AED" bg="#EEF2FF">⭐ Pro Plan</Badge>
            <Badge color="#10B981" bg="#ECFDF5">✓ Active</Badge>
          </div>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 14px" }}>Your Stats</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {stats.map(s => (
              <div key={s.label} style={{ textAlign: "center", background: "#F9FAFB", borderRadius: 12, padding: "12px 8px" }}>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, color: "#7C3AED" }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, marginTop: 3, letterSpacing: .3 }}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 14px" }}>Preferences</h3>
          {[
            { icon: "🔔", label: "Push Notifications", desc: "Get reminded before followups" },
            { icon: "💬", label: "WhatsApp Reminders", desc: "Reminders via your own WhatsApp" },
            { icon: "🌙", label: "Daily Digest", desc: "Summary every morning at 9 AM" },
          ].map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #F1F1F1" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF" }}>{item.desc}</div>
                </div>
              </div>
              <div style={{ width: 44, height: 24, borderRadius: 12, background: "#7C3AED", position: "relative", cursor: "pointer" }}>
                <div style={{ position: "absolute", right: 3, top: 3, width: 18, height: 18, borderRadius: "50%", background: "white" }} />
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ marginBottom: 14 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 700, color: "#7C3AED", letterSpacing: .5, textTransform: "uppercase", margin: "0 0 14px" }}>Subscription</h3>
          <div style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)", borderRadius: 14, padding: "16px", color: "white", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, opacity: .7, letterSpacing: .5, marginBottom: 4 }}>CURRENT PLAN</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800 }}>Pro · ₹1,999/mo</div>
            <div style={{ fontSize: 12, opacity: .7, marginTop: 4 }}>Unlimited leads · All features</div>
          </div>
          <Btn variant="ghost" full>Manage Subscription</Btn>
        </Card>

        <Btn variant="danger" full onClick={onLogout}>🚪 Logout</Btn>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function LeadFlow() {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [leads, setLeads] = useState(DEMO_LEADS);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddLead, setShowAddLead] = useState(false);

  function addLead(lead) { setLeads(p => [lead, ...p]); setShowAddLead(false); }
  function updateLead(updated) { setLeads(p => p.map(l => l.id === updated.id ? updated : l)); setSelectedLead(updated); }
  function login(u) { setUser(u); setAuthed(true); }
  function logout() { setUser(null); setAuthed(false); setPage("home"); }

  if (!authed) return <AuthScreen onLogin={login} />;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#FAFAFA", position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', sans-serif; background: #FAFAFA; }
        ::-webkit-scrollbar { width: 0; }
        input, select, textarea, button { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {page === "lead_detail" && selectedLead ? (
        <LeadDetailScreen lead={selectedLead} onBack={() => setPage("leads")} onUpdate={updateLead} />
      ) : (
        <>
          {page === "home" && <HomeScreen leads={leads} setPage={setPage} setSelectedLead={setSelectedLead} setShowAddLead={setShowAddLead} />}
          {page === "leads" && <LeadsScreen leads={leads} setPage={setPage} setSelectedLead={setSelectedLead} setShowAddLead={setShowAddLead} />}
          {page === "pipeline" && <PipelineScreen leads={leads} setPage={setPage} setSelectedLead={setSelectedLead} />}
          {page === "templates" && <TemplatesScreen leads={leads} />}
          {page === "settings" && <SettingsScreen user={user} onLogout={logout} />}
          <BottomNav page={page} setPage={setPage} />
        </>
      )}

      {showAddLead && <AddLeadModal onSave={addLead} onClose={() => setShowAddLead(false)} />}
    </div>
  );
}
