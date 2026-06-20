import { useState, useEffect, useRef } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ModelPerformance from "./pages/ModelPerformance.jsx";

import {
  PieChart, Pie, Cell, Tooltip, BarChart, Bar,
  XAxis, YAxis, ResponsiveContainer, Legend,
} from "recharts";
import {
  FaShieldAlt, FaDatabase, FaExclamationTriangle,
  FaCheckCircle, FaProjectDiagram, FaSearch,
  FaFileAlt, FaBrain, FaUpload, FaBolt,
  FaNetworkWired, FaChartPie, FaTachometerAlt,
  FaLayerGroup, FaStream, FaListAlt, FaWifi,
  FaChartBar,
} from "react-icons/fa";
import "./App.css";

const API = "http://127.0.0.1:8000";

// ─── custom tooltip for recharts ─────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0c2244", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      {label && <p style={{ color: "#94a3b8", marginBottom: 4 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#00e0a4", fontWeight: 600 }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── nav items ───────────────────────────────────────────────
const NAV = [
  { id: "dashboard", label: "Executive Dashboard", icon: <FaTachometerAlt /> },
  { id: "risk",      label: "Risk Scoring",        icon: <FaChartPie /> },
  { id: "model",     label: "Model Intelligence",  icon: <FaBrain /> },
  { id: "features",  label: "Feature Intelligence", icon: <FaLayerGroup /> },
  { id: "graph",     label: "Graph Intelligence",  icon: <FaProjectDiagram /> },
  { id: "alerts",    label: "Alerts Center",       icon: <FaBolt /> },
  { id: "live",      label: "Live Feed",           icon: <FaStream /> },
  { id: "investigate", label: "Investigation",     icon: <FaSearch /> },
  { id: "queue",     label: "Priority Queue",      icon: <FaListAlt /> },
  { id: "model-performance", label: "Model Performance", icon: <FaChartBar /> },
];

const IMPORTANT_FEATURES = [
  "F115","F321","F527","F531","F670","F1692",
  "F2082","F2122","F2582","F2678","F2737",
  "F2956","F3043","F3836","F3887","F3889",
  "F3891","F3894",
];

const PIE_COLORS = ["#00e0a4", "#ff5c5c"];

function getRiskClass(pct) {
  if (pct < 5) return "low";
  if (pct < 10) return "medium";
  return "high";
}

function getRiskLabel(pct) {
  if (pct < 5) return "Low Risk";
  if (pct < 10) return "Moderate Risk";
  return "High Risk";
}

// ─── Component ───────────────────────────────────────────────
export default function App() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [summary, setSummary]     = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [highRisk, setHighRisk]   = useState([]);
  const [alerts, setAlerts]       = useState([]);
  const [graph, setGraph]         = useState(null);
  const [riskDist, setRiskDist]   = useState(null);
  const [recordId, setRecordId]   = useState("");
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [loadingExp, setLoadingExp] = useState(false);
  const [file, setFile]           = useState(null);
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [tableSearch, setTableSearch] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const feedRef = useRef(null);

  // ── Fetch all dashboard data ────────────────────────────────
  async function fetchAll() {
    try {
      const [sumRes, statRes, hrRes, alRes, grRes, rdRes] = await Promise.all([
        fetch(`${API}/dashboard/summary`),
        fetch(`${API}/dashboard/statistics`),
        fetch(`${API}/dashboard/high-risk`),
        fetch(`${API}/alerts`),
        fetch(`${API}/graph/summary`),
        fetch(`${API}/risk-distribution`),
      ]);
      if (sumRes.ok)  setSummary(await sumRes.json());
      if (statRes.ok) setStatistics(await statRes.json());
      if (hrRes.ok)   setHighRisk((await hrRes.json()).records || []);
      if (alRes.ok)   setAlerts((await alRes.json()).alerts || []);
      if (grRes.ok)   setGraph(await grRes.json());
      if (rdRes.ok)   setRiskDist(await rdRes.json());
      setDataLoaded(true);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    }
  }

  // ── Auto-load if model already exists ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${API}/model/status`);
        if (r.ok && (await r.json()).model_exists) await fetchAll();
      } catch {}
    })();
  }, []);

  // ── WebSocket live feed ─────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/simulation`);
    ws.onopen  = () => setWsConnected(true);
    ws.onclose = () => setWsConnected(false);
    ws.onerror = () => setWsConnected(false);
    ws.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data);
        setLiveAlerts(prev => [{ ...d, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
      } catch {}
    };
    return () => ws.close();
  }, []);

  // Scroll live feed to top on new entry
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [liveAlerts.length]);

  // ── Upload & train ──────────────────────────────────────────
  async function loadDashboard() {
    if (!file) return alert("Please select a CSV file first");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const up = await fetch(`${API}/upload`, { method: "POST", body: fd });
      if (!up.ok) throw new Error("Upload failed");
      const tr = await fetch(`${API}/train`, { method: "POST" });
      if (!tr.ok) throw new Error("Training failed");
      await fetchAll();
    } catch (err) {
      console.error(err);
      alert("Upload or analysis failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  // ── Investigation ───────────────────────────────────────────
  async function investigate() {
    if (!recordId) return alert("Please enter a Record ID");
    setLoadingExp(true);
    setExplanation(null);
    try {
      const r = await fetch(`${API}/explain/${recordId}`);
      const d = await r.json();
      if (d.error) {
        setExplanation({ record_id: recordId, risk_level: "UNKNOWN", status: "Not Found",
          reason: "This record is outside the uploaded dataset range.",
          recommendation: "Enter a valid record ID within the screened dataset." });
      } else {
        setExplanation({
          record_id: d.record_id,
          anomaly_score: d.anomaly_score,
          risk_score: d.risk_score,
          risk_level: d.risk_level,
          status: d.risk_level === "HIGH" ? "Flagged for Compliance Review" : "Monitored",
          reason: d.reasons?.length ? d.reasons.join(" ") : "Account metrics behave normally compared to baseline profiles.",
          recommendation: d.risk_level === "HIGH"
            ? "Submit Suspicious Activity Report (SAR) immediately and block further credit out-movement."
            : "No action required. Maintain standard automated monitoring.",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Failed to investigate record.");
    } finally {
      setLoadingExp(false);
    }
  }

  // ── Derived chart data ──────────────────────────────────────
  const pieData = summary ? [
    { name: "Legitimate",  value: summary.normal_records },
    { name: "Suspicious",  value: summary.anomalies },
  ] : [];

  const barData = summary ? [
    { name: "Total",       value: summary.total_records },
    { name: "Legitimate",  value: summary.normal_records },
    { name: "Suspicious",  value: summary.anomalies },
    { name: "Alerts",      value: alerts.length },
  ] : [];

  const riskDistData = riskDist ? [
    { name: "High",   value: riskDist.high_risk,   color: "#ff5c5c" },
    { name: "Medium", value: riskDist.medium_risk,  color: "#facc15" },
    { name: "Low",    value: riskDist.low_risk,     color: "#00e0a4" },
  ] : [];

  const filteredHighRisk = highRisk.filter(r =>
    tableSearch === "" || String(r.record_id).includes(tableSearch)
  );

  const riskClass = summary ? getRiskClass(summary.anomaly_percentage) : "low";

  // ── Scroll to section ───────────────────────────────────────
  function goTo(id) {
    setActiveNav(id);
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/model-performance" element={<ModelPerformance />} />
        <Route path="/" element={(
    <div className="app">
      {/* ═══ SIDEBAR ═══════════════════════════════════════════ */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><FaShieldAlt /></div>
          <div className="brand-text">
            <h2>MuleShield AI</h2>
            <p>Fraud Risk Intelligence</p>
          </div>
        </div>

        <div className="sidebar-section-label">Navigation</div>
        <nav>
          {NAV.map(n => (
            <a
              key={n.id}
              className={activeNav === n.id ? "active" : ""}
              onClick={() => goTo(n.id)}
            >
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-badge">
            <strong>System Status</strong>
            Backend: {wsConnected ? "🟢 Connected" : "🔴 Offline"}<br />
            Dataset: {dataLoaded ? "✅ Loaded" : "⏳ Awaiting"}<br />
            Algorithm: Isolation Forest
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: "var(--text-muted)" }}>
            IIT Hyderabad × Bank of India
          </div>
        </div>
      </aside>

      {/* ═══ MAIN ══════════════════════════════════════════════ */}
      <main className="main">

        {/* Top Bar */}
        <div className="topbar">
          <div className="topbar-left">
            <h1>Fraud Risk Intelligence Platform</h1>
            <p>Mule Account Screening & Anti-Money Laundering Analytics</p>
          </div>
          <div className="topbar-right">
            <div className={`status-dot ${wsConnected ? "" : "offline"}`} />
            <span className="status-label">
              {wsConnected ? "Live Stream Active" : "Awaiting Connection"}
            </span>
          </div>
        </div>

        {/* ── UPLOAD HERO ─────────────────────────────────────── */}
        <section id="section-dashboard">
          <div className="upload-hero">
            <div className="hero-content">
              <span className="tag">⚡ AI/ML Mule Account Screening Platform</span>
              <h1>Detect suspicious mule accounts before fraudulent fund movement spreads</h1>
              <p>
                MuleShield AI combines Isolation Forest anomaly detection, composite risk scoring,
                SHAP explainability, and graph-based network discovery to support banking fraud
                investigation teams in real time.
              </p>
              <div className="upload-controls">
                <label className="upload-file-label">
                  <FaUpload />
                  {file ? file.name : "Choose CSV Dataset"}
                  <input
                    type="file"
                    accept=".csv"
                    onChange={e => setFile(e.target.files[0])}
                  />
                </label>
                {file && (
                  <span className="file-selected-badge">
                    <FaCheckCircle /> {file.name}
                  </span>
                )}
                <button className="btn-primary" onClick={loadDashboard} disabled={loading}>
                  {loading ? <><span className="spinner" /> Analyzing…</> : <><FaBolt /> Launch Analysis</>}
                </button>
              </div>
            </div>

            <div className="hero-capability-card">
              <h3>Platform Capabilities</h3>
              {[
                { icon: "🔍", title: "Anomaly Detection", sub: "Isolation Forest ML model" },
                { icon: "📊", title: "Risk Scoring", sub: "Composite Z-score system" },
                { icon: "🌐", title: "Graph Intelligence", sub: "Mule network clustering" },
                { icon: "💡", title: "Explainability", sub: "SHAP-based reasoning" },
                { icon: "⚡", title: "Real-time Alerts", sub: "WebSocket live stream" },
              ].map(c => (
                <div className="capability-item" key={c.title}>
                  <div className="capability-icon">{c.icon}</div>
                  <div>
                    <div className="capability-text">{c.title}</div>
                    <div className="capability-sub">{c.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DATA SECTIONS (only when loaded) ─────────────────── */}
        {!dataLoaded && (
          <div className="empty-state" style={{ marginTop: 40 }}>
            <div className="empty-icon">📂</div>
            <h3>No dataset loaded</h3>
            <p>Upload a CSV file above and click "Launch Analysis" to populate the dashboard with live analytics.</p>
          </div>
        )}

        {dataLoaded && summary && statistics && graph && (<>

          {/* ── EXECUTIVE KPI CARDS ────────────────────────────── */}
          <div className="cards">
            <div className="card card-blue">
              <div className="card-header">
                <span className="card-label">Total Screened</span>
                <div className="card-icon"><FaDatabase /></div>
              </div>
              <div className="card-value">{summary?.total_records?.toLocaleString() ?? "—"}</div>
              <div className="card-sub">Accounts analysed in dataset</div>
              <div className="card-trend" style={{ color: "#38bdf8" }}>📁 Full dataset loaded</div>
            </div>

            <div className="card card-red">
              <div className="card-header">
                <span className="card-label">Flagged Anomalies</span>
                <div className="card-icon"><FaExclamationTriangle /></div>
              </div>
              <div className="card-value">{summary?.anomalies?.toLocaleString() ?? "—"}</div>
              <div className="card-sub">Suspected mule accounts</div>
              <div className="card-trend" style={{ color: "#ff5c5c" }}>⚠️ Requires review</div>
            </div>

            <div className="card card-green">
              <div className="card-header">
                <span className="card-label">Legitimate Accounts</span>
                <div className="card-icon"><FaCheckCircle /></div>
              </div>
              <div className="card-value">{summary?.normal_records?.toLocaleString() ?? "—"}</div>
              <div className="card-sub">No anomalous activity detected</div>
              <div className="card-trend" style={{ color: "#00e0a4" }}>✅ Low risk</div>
            </div>

            <div className="card card-yellow">
              <div className="card-header">
                <span className="card-label">Anomaly Rate</span>
                <div className="card-icon"><FaShieldAlt /></div>
              </div>
              <div className="card-value">{summary?.anomaly_percentage ?? "—"}%</div>
              <div className="card-sub">Of total accounts flagged</div>
              <div className="card-trend" style={{ color: "#facc15" }}>
                {summary ? getRiskLabel(summary.anomaly_percentage) : "—"}
              </div>
            </div>
          </div>

          {/* ── RISK METER ─────────────────────────────────────── */}
          <div id="section-risk" className="risk-meter-panel">
            <div className="risk-meter-label">
              <h3>Overall Risk Exposure</h3>
              <div className={`risk-level-text ${riskClass}`}>{summary ? getRiskLabel(summary.anomaly_percentage) : "—"}</div>
            </div>
            <div className="risk-meter-track">
              <div className="risk-meter-bar">
                <div
                  className="risk-meter-fill"
                  style={{ width: `${Math.min((summary?.anomaly_percentage ?? 0) * 10, 100)}%` }}
                />
              </div>
              <div className="risk-meter-scale">
                <span>0%</span><span>5% — Low</span><span>10% — Moderate</span><span>100%</span>
              </div>
            </div>
            <div className={`risk-percentage ${riskClass === "low" ? "" : riskClass === "medium" ? "yellow-text" : "red-text"}`}
              style={{ color: riskClass === "low" ? "#00e0a4" : riskClass === "medium" ? "#facc15" : "#ff5c5c" }}>
              {summary?.anomaly_percentage ?? "—"}%
            </div>
          </div>

          {/* ── CHARTS ROW ─────────────────────────────────────── */}
          <div className="grid-two mb-20">
            <div className="panel">
              <div className="chart-title">Risk Distribution</div>
              <div className="chart-subtitle">Breakdown of legitimate vs. flagged accounts</div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" outerRadius={90} innerRadius={50} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`} labelLine={false}>
                    {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, color: "#94a3b8" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="panel">
              <div className="chart-title">Fraud Analytics Overview</div>
              <div className="chart-subtitle">Aggregated account & alert counts</div>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={barData} barSize={32}>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" fill="#00c896" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── RISK SCORE DISTRIBUTION ───────────────────────── */}
          {riskDist && (
            <div className="grid-one-thirds mb-20" id="section-risk">
              <div className="panel">
                <div className="section-header">
                  <h2><span className="sh-icon">📊</span> Risk Level Breakdown</h2>
                </div>
                <div className="risk-distribution">
                  {riskDistData.map(r => {
                    const total = (riskDist.high_risk + riskDist.medium_risk + riskDist.low_risk) || 1;
                    return (
                      <div className="risk-dist-row" key={r.name}>
                        <span className="risk-dist-label" style={{ color: r.color }}>{r.name}</span>
                        <div className="risk-dist-bar-wrap">
                          <div className="risk-dist-bar" style={{ width: `${(r.value / total) * 100}%`, background: r.color }} />
                        </div>
                        <span className="risk-dist-count">{r.value.toLocaleString()}</span>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 20 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={riskDistData} barSize={40}>
                      <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                        {riskDistData.map((r, i) => <Cell key={i} fill={r.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="panel" id="section-model">
                <div className="section-header">
                  <h2><span className="sh-icon"><FaBrain /></span> Model Intelligence</h2>
                  <span className="section-badge">Isolation Forest</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Algorithm</span>
                  <span className="model-stat-val blue">Isolation Forest</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Total Features</span>
                  <span className="model-stat-val">{statistics.total_features}</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Target Variable</span>
                  <span className="model-stat-val">F3924</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Avg Anomaly Score</span>
                  <span className="model-stat-val green">{statistics.average_anomaly_score?.toFixed(6)}</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Most Suspicious Score</span>
                  <span className="model-stat-val" style={{ color: "#ff5c5c" }}>{statistics.minimum_anomaly_score?.toFixed(6)}</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Records Screened</span>
                  <span className="model-stat-val">{summary?.total_records?.toLocaleString() ?? "—"}</span>
                </div>
                <div className="model-stat-row">
                  <span className="model-stat-key">Anomaly Threshold</span>
                  <span className="model-stat-val yellow">score &lt; 0</span>
                </div>
              </div>
            </div>
          )}

          {/* ── FEATURE & GRAPH INTELLIGENCE ─────────────────── */}
          <div className="grid-two mb-20">
            <div className="panel" id="section-features">
              <div className="section-header">
                <h2><span className="sh-icon"><FaFileAlt /></span> Feature Intelligence</h2>
                <span className="section-badge">{IMPORTANT_FEATURES.length} Key Features</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
                High-signal behavioural features selected by the Isolation Forest model for mule account detection.
                These columns exhibit the highest anomaly discrimination power.
              </p>
              <div className="features-grid" id="section-features">
                {IMPORTANT_FEATURES.map(f => (
                  <span className="feature-tag" key={f}>{f}</span>
                ))}
              </div>
            </div>

            <div className="panel" id="section-graph">
              <div className="section-header">
                <h2><span className="sh-icon"><FaProjectDiagram /></span> Graph Intelligence</h2>
                <span className="section-badge">Network Analysis</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8, lineHeight: 1.6 }}>
                Transaction graph built from account relationships.
                Connected components reveal suspected mule clusters.
              </p>
              <div className="graph-stats">
                <div className="graph-stat">
                  <div className="graph-stat-icon"><FaNetworkWired /></div>
                  <div className="graph-stat-body">
                    <div className="graph-stat-label">Account Nodes</div>
                    <div className="graph-stat-value">{graph.nodes?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="graph-stat">
                  <div className="graph-stat-icon" style={{ background: "rgba(56,189,248,0.12)", color: "#38bdf8" }}>🔗</div>
                  <div className="graph-stat-body">
                    <div className="graph-stat-label">Transaction Links</div>
                    <div className="graph-stat-value" style={{ color: "#38bdf8" }}>{graph.edges?.toLocaleString()}</div>
                  </div>
                </div>
                <div className="graph-stat">
                  <div className="graph-stat-icon" style={{ background: "rgba(255,92,92,0.12)", color: "#ff5c5c" }}>🕸</div>
                  <div className="graph-stat-body">
                    <div className="graph-stat-label">Mule Clusters Detected</div>
                    <div className="graph-stat-value" style={{ color: "#ff5c5c" }}>{graph.connected_components?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── ALERTS + LIVE FEED ────────────────────────────── */}
          <div className="grid-two mb-20">
            <div className="panel" id="section-alerts">
              <div className="section-header">
                <h2><span className="sh-icon"><FaBolt /></span> Alerts Center</h2>
                <span className="section-badge">{alerts.length} Active</span>
              </div>
              {alerts.length === 0 ? (
                <div className="empty-state" style={{ padding: "24px 0" }}>
                  <div className="empty-icon" style={{ fontSize: 28 }}>✅</div>
                  <h3>No active alerts</h3>
                  <p>All dataset-level checks passed successfully.</p>
                </div>
              ) : (
                alerts.map((a, i) => (
                  <div className={`alert-item ${a.severity?.toLowerCase() === "warning" ? "warning" : ""}`} key={i}>
                    <div className={`alert-dot ${a.severity?.toLowerCase() === "warning" ? "warning" : ""}`} />
                    <div className="alert-content">
                      <div className={`alert-severity ${a.severity?.toLowerCase() === "warning" ? "warning" : ""}`}>
                        {a.severity || "CRITICAL"}
                      </div>
                      <div className="alert-msg">{a.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="panel" id="section-live">
              <div className="section-header">
                <h2><span className="sh-icon"><FaStream /></span> Live Transaction Feed</h2>
                <span className="live-counter"><FaWifi style={{ marginRight: 4 }} />{liveAlerts.length} events</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 0 }}>
                Real-time simulation stream via WebSocket — showing incoming transaction classifications.
              </p>
              <div className="live-feed" ref={feedRef}>
                {liveAlerts.length === 0 ? (
                  <div className="live-feed-empty">Listening for transaction stream…</div>
                ) : liveAlerts.map((txn, i) => (
                  <div className="live-feed-entry" key={i}>
                    <span className="live-feed-time">[{txn.ts}]</span>
                    <span className="live-feed-id">{txn.transaction_id}</span>
                    <span className="live-feed-detail"> | ${txn.amount?.toFixed(2)} | RS:{txn.risk_score}</span>
                    {txn.is_anomaly
                      ? <span className="live-feed-anomaly"> ⚠ ANOMALY</span>
                      : <span className="live-feed-ok"> ✓ OK</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── INVESTIGATION ─────────────────────────────────── */}
          <div className="grid-two mb-20">
            <div className="panel" id="section-investigate">
              <div className="section-header">
                <h2><span className="sh-icon"><FaSearch /></span> Explainable Investigation</h2>
              </div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 0, lineHeight: 1.6 }}>
                Enter a record ID to retrieve the AI explanation, risk score, anomaly score,
                and compliance recommendation for any screened account.
              </p>
              <div className="search-row">
                <input
                  type="number"
                  placeholder="e.g. 6033"
                  value={recordId}
                  onChange={e => setRecordId(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && investigate()}
                />
                <button className="btn-investigate" onClick={investigate} disabled={loadingExp}>
                  {loadingExp ? <><span className="spinner" /> Searching…</> : <><FaSearch /> Investigate</>}
                </button>
              </div>

              {explanation && (
                <div className="explanation-card">
                  <div className="explanation-header">
                    <span className="explanation-id">Record #{explanation.record_id}</span>
                    <span className={`risk-badge ${explanation.risk_level?.toLowerCase() === "high" ? "high" : explanation.risk_level?.toLowerCase() === "medium" ? "medium" : "low"}`}>
                      {explanation.risk_level} RISK
                    </span>
                  </div>
                  <div className="explanation-body">
                    <div className="explanation-field">
                      <label>Status</label>
                      <p>{explanation.status}</p>
                    </div>
                    {explanation.anomaly_score !== undefined && (
                      <div className="explanation-field">
                        <label>Anomaly Score</label>
                        <p className="score-value" style={{ color: explanation.anomaly_score < 0 ? "#ff5c5c" : "#00e0a4" }}>
                          {explanation.anomaly_score.toFixed(6)}
                        </p>
                      </div>
                    )}
                    {explanation.risk_score !== undefined && (
                      <div className="explanation-field">
                        <label>Composite Risk Score</label>
                        <p className="score-value">{explanation.risk_score}/100</p>
                      </div>
                    )}
                    <div className="explanation-field">
                      <label>AI Reasoning</label>
                      <p>{explanation.reason}</p>
                    </div>
                    <div className="explanation-field">
                      <label>Compliance Recommendation</label>
                      <div className="recommendation-box"><p>{explanation.recommendation}</p></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Reference Panel */}
            <div className="panel" id="section-model">
              <div className="section-header">
                <h2><span className="sh-icon">📋</span> Investigation Guide</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { icon: "🔴", label: "HIGH RISK", desc: "Anomaly score < -0.05. Submit SAR immediately. Block credit movement." },
                  { icon: "🟡", label: "MEDIUM RISK", desc: "Score between -0.05 and 0.05. Enhanced monitoring recommended." },
                  { icon: "🟢", label: "LOW RISK", desc: "Score > 0.05. Normal behaviour. Routine automated monitoring." },
                  { icon: "📝", label: "SAR Filing", desc: "Use record ID and risk score when filing Suspicious Activity Reports." },
                  { icon: "🌐", label: "Graph Check", desc: "Cross-reference record with Graph Intelligence for network links." },
                ].map(g => (
                  <div key={g.label} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{g.icon}</span>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{g.label}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{g.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── HIGH PRIORITY QUEUE TABLE ─────────────────────── */}
          <div className="table-panel" id="section-queue">
            <div className="section-header">
              <h2><span className="sh-icon"><FaListAlt /></span> High Priority Investigation Queue</h2>
              <div className="table-controls">
                <input
                  className="table-search"
                  type="text"
                  placeholder="Filter by Record ID…"
                  value={tableSearch}
                  onChange={e => setTableSearch(e.target.value)}
                />
                <span className="section-badge">{filteredHighRisk.length} records</span>
              </div>
            </div>

            {filteredHighRisk.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">🎯</div><h3>No records found</h3><p>Adjust your filter or ensure data has been loaded.</p></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Record ID</th>
                      <th>Anomaly Score</th>
                      <th>Risk Level</th>
                      <th>Score Visualiser</th>
                      <th>Compliance Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHighRisk.slice(0, 30).map(r => {
                      const pct = Math.min(Math.abs(r.anomaly_score) * 400, 100);
                      const isHigh = r.anomaly_score < -0.05;
                      return (
                        <tr key={r.record_id}>
                          <td className="mono">#{r.record_id}</td>
                          <td className="mono" style={{ color: isHigh ? "#ff5c5c" : "#facc15" }}>
                            {r.anomaly_score.toFixed(6)}
                          </td>
                          <td>
                            <span className={`badge ${isHigh ? "badge-red" : "badge-yellow"}`}>
                              {isHigh ? "⚠ HIGH" : "⚡ MEDIUM"}
                            </span>
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div className="score-bar-wrap">
                              <div className="score-bar-bg">
                                <div className="score-bar-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="score-text" style={{ color: isHigh ? "#ff5c5c" : "#facc15" }}>
                                {pct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-red">Flagged for Review</span>
                          </td>
                          <td>
                            <button
                              onClick={() => { setRecordId(String(r.record_id)); goTo("investigate"); }}
                              style={{
                                background: "transparent",
                                border: "1px solid var(--border)",
                                color: "var(--text-secondary)",
                                padding: "5px 12px",
                                borderRadius: 6,
                                fontSize: 11,
                                cursor: "pointer",
                                transition: "var(--transition)",
                                fontFamily: "var(--font)",
                              }}
                              onMouseEnter={e => { e.target.style.borderColor = "#00e0a4"; e.target.style.color = "#00e0a4"; }}
                              onMouseLeave={e => { e.target.style.borderColor = "var(--border)"; e.target.style.color = "var(--text-secondary)"; }}
                            >
                              Investigate →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </>)}

          <div className="loading-overlay">
            <div className="spinner-large" />
            <p>Loading dashboard data…</p>
          </div>
          <div className="page-footer">
          MuleShield AI — IIT Hyderabad × Bank of India &nbsp;·&nbsp; Fraud Risk Intelligence Platform &nbsp;·&nbsp; {new Date().getFullYear()}
        </div>
      </main>
    </div>
        )} />
      </Routes>
    </BrowserRouter>
  );
}