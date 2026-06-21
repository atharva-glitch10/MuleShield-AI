import React, { useEffect, useState } from "react";
import MetricCard from "../components/MetricCard.jsx";
import ExplainabilityPanel from "../components/ExplainabilityPanel.jsx";
import axios from "axios";

import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";

const API = "http://127.0.0.1:8000";

export default function ModelPerformance() {
  const [metrics, setMetrics] = useState(null);
  const [rocData, setRocData] = useState([]);
  const [prData, setPrData] = useState([]);
  const [comparison, setComparison] = useState([]);
  const [globalShap, setGlobalShap] = useState([]);
  const [recordId, setRecordId] = useState("");
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    async function fetchData() {
      try {
        const [metRes, rocRes, prRes, compRes, shapRes] = await Promise.all([
          axios.get(`${API}/dashboard/model-performance`).catch(() => ({data: null})),
          axios.get(`${API}/dashboard/roc-curve`).catch(() => ({data: null})),
          axios.get(`${API}/dashboard/pr-curve`).catch(() => ({data: null})),
          axios.get(`${API}/dashboard/model-comparison`).catch(() => ({data: null})),
          axios.get(`${API}/explain/global-summary`).catch(() => ({data: null})),
        ]);
        
        if (metRes.data) setMetrics(metRes.data);
        if (compRes.data) setComparison(compRes.data);
        if (shapRes.data && shapRes.data.features) setGlobalShap(shapRes.data.features);
        
        if (rocRes.data && rocRes.data.fpr) {
          const formatted = rocRes.data.fpr.map((v, i) => ({
            fpr: v, tpr: rocRes.data.tpr[i]
          }));
          setRocData(formatted);
        }
        if (prRes.data && prRes.data.recall) {
          const formatted = prRes.data.recall.map((v, i) => ({
            recall: v, precision: prRes.data.precision[i]
          }));
          setPrData(formatted);
        }
      } catch (err) {
        console.error("Failed to fetch model performance data", err);
      }
    }
    fetchData();
  }, []);

  const loadExplanation = async () => {
    if (!recordId) return alert("Enter a record ID");
    setLoading(true);
    try {
      const res = await axios.get(`${API}/explain/${recordId}`);
      if (res.data && res.data.features) setFeatures(res.data.features);
    } catch (err) {
      console.error("Explain error", err);
      alert("Failed to load explanation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="model-performance-page">
      <h2 className="page-title">Model Performance Dashboard</h2>
      <div className="metric-cards-grid">
        {metrics?.status ? (
          <p style={{ color: "#facc15", gridColumn: "1/-1", padding: "16px" }}>⏳ {metrics.status}</p>
        ) : metrics ? (
          <>
            <MetricCard label="Accuracy" value={metrics.accuracy != null ? (metrics.accuracy * 100).toFixed(1) : "—"} unit="%" />
            <MetricCard label="Precision" value={metrics.precision != null ? (metrics.precision * 100).toFixed(1) : "—"} unit="%" />
            <MetricCard label="Recall" value={metrics.recall != null ? (metrics.recall * 100).toFixed(1) : "—"} unit="%" />
            <MetricCard label="F1 Score" value={metrics.f1 != null ? (metrics.f1 * 100).toFixed(1) : "—"} unit="%" />
            <MetricCard label="ROC AUC" value={metrics.roc_auc != null ? metrics.roc_auc.toFixed(3) : "—"} />
          </>
        ) : null}
      </div>

      <div className="charts-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        {rocData.length > 0 && (
          <div className="chart-card glass-panel" style={{ padding: "20px" }}>
            <h3>ROC Curve</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="fpr" type="number" domain={[0, 1]} name="False Positive Rate" stroke="#94a3b8" />
                  <YAxis type="number" domain={[0, 1]} name="True Positive Rate" stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ background: "#0c2244", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="tpr" stroke="#00e0a4" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {prData.length > 0 && (
          <div className="chart-card glass-panel" style={{ padding: "20px" }}>
            <h3>Precision-Recall Curve</h3>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={prData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="recall" type="number" domain={[0, 1]} name="Recall" stroke="#94a3b8" />
                  <YAxis type="number" domain={[0, 1]} name="Precision" stroke="#94a3b8" />
                  <RechartsTooltip contentStyle={{ background: "#0c2244", border: "1px solid rgba(255,255,255,0.1)" }} />
                  <Line type="monotone" dataKey="precision" stroke="#ff5c5c" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {comparison.length > 0 && (
        <section className="glass-panel" style={{ padding: "20px", marginTop: "20px" }}>
          <h3>Model Comparison (Cross-Validation)</h3>
          <table style={{ width: "100%", textAlign: "left", marginTop: "10px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
                <th style={{ padding: "10px" }}>Model</th>
                <th style={{ padding: "10px" }}>F1 Score (Mean)</th>
                <th style={{ padding: "10px" }}>F1 Score (Std)</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <td style={{ padding: "10px", color: i === 0 ? "#00e0a4" : "white" }}>{c.model}</td>
                  <td style={{ padding: "10px", fontWeight: "bold" }}>{c.f1_mean}</td>
                  <td style={{ padding: "10px", color: "#94a3b8" }}>±{c.f1_std}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {globalShap.length > 0 && (
        <section className="glass-panel" style={{ padding: "20px", marginTop: "20px" }}>
          <h3>Global Feature Importance (SHAP)</h3>
          <div style={{ height: 350, marginTop: "10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={globalShap} layout="vertical" margin={{ left: 50 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" />
                <RechartsTooltip contentStyle={{ background: "#0c2244", border: "1px solid rgba(255,255,255,0.1)" }} />
                <Bar dataKey="importance" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="explain-section" style={{ marginTop: "40px" }}>
        <h3>Local SHAP Explainability (Per-Record)</h3>
        <div className="explain-controls" style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
          <input
            type="number"
            placeholder="Record ID"
            value={recordId}
            onChange={e => setRecordId(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #334155", background: "#0f172a", color: "white" }}
          />
          <button onClick={loadExplanation} disabled={loading} className="btn-primary">
            {loading ? "Loading…" : "Load Explanation"}
          </button>
        </div>
        {features.length > 0 && <ExplainabilityPanel features={features} />}
      </section>
    </div>
  );
}
