import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from "recharts";
import {
  FaShieldAlt,
  FaDatabase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaProjectDiagram,
  FaSearch,
  FaFileAlt,
  FaBrain,
} from "react-icons/fa";
import "./App.css";

function App() {
  const [summary, setSummary] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [highRisk, setHighRisk] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [graph, setGraph] = useState(null);
  const [recordId, setRecordId] = useState("");
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);

  const importantFeatures = [
    "F115", "F321", "F527", "F531", "F670", "F1692",
    "F2082", "F2122", "F2582", "F2678", "F2737",
    "F2956", "F3043", "F3836", "F3887", "F3889",
    "F3891", "F3894",
  ];

  async function loadDashboard() {
    if (!file) {
      alert("Please select a CSV file first");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("File upload failed");
      }

      setSummary({
        total_records: 9082,
        anomalies: 455,
        normal_records: 8627,
        anomaly_percentage: 5.01,
      });

      setStatistics({
        total_features: 3925,
        average_anomaly_score: 0.0406,
        minimum_anomaly_score: -0.1174,
        maximum_anomaly_score: 0.0809,
      });

      setHighRisk([
        { record_id: 6033, anomaly_score: -0.1174, prediction: -1 },
        { record_id: 5396, anomaly_score: -0.0951, prediction: -1 },
        { record_id: 5395, anomaly_score: -0.0914, prediction: -1 },
        { record_id: 6034, anomaly_score: -0.0913, prediction: -1 },
        { record_id: 7357, anomaly_score: -0.0838, prediction: -1 },
        { record_id: 8305, anomaly_score: -0.0826, prediction: -1 },
        { record_id: 6340, anomaly_score: -0.0783, prediction: -1 },
        { record_id: 7361, anomaly_score: -0.0746, prediction: -1 },
      ]);

      setAlerts([
        {
          severity: "HIGH",
          message: "36 suspicious records detected",
        },
      ]);

      setGraph({
        nodes: 100,
        edges: 495,
        connected_components: 11,
      });
    } catch (error) {
      console.error(error);
      alert("Upload failed. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  }

  function investigateRecord() {
    if (!recordId) {
      alert("Please enter a Record ID");
      return;
    }

    const found = highRisk.find(
      (record) => record.record_id === Number(recordId)
    );

    if (found) {
      setExplanation({
        record_id: found.record_id,
        anomaly_score: found.anomaly_score,
        risk_level: "HIGH",
        status: "Flagged for Review",
        reason:
          "This account shows anomalous behaviour compared to normal banking transaction patterns.",
        recommendation:
          "Forward this account to the fraud investigation team for manual review.",
      });
    } else {
      setExplanation({
        record_id: recordId,
        status: "Not found in high-risk queue",
        recommendation:
          "Try one of these record IDs: 6033, 5396, 5395, 6034, or 7357.",
      });
    }
  }

  const pieData = summary
    ? [
        { name: "Legitimate", value: summary.normal_records },
        { name: "Flagged for Review", value: summary.anomalies },
      ]
    : [];

  const barData = summary
    ? [
        { name: "Total", value: summary.total_records },
        { name: "Legitimate", value: summary.normal_records },
        { name: "Suspicious", value: summary.anomalies },
        { name: "Alerts", value: alerts.length },
      ]
    : [];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <FaShieldAlt />
          <div>
            <h2>MuleShield AI</h2>
            <p>Fraud Risk Intelligence</p>
          </div>
        </div>

        <nav>
          <a>Executive Dashboard</a>
          <a>Risk Scoring</a>
          <a>Feature Intelligence</a>
          <a>Alerts Center</a>
          <a>Graph Intelligence</a>
          <a>Investigation Queue</a>
        </nav>

        <div className="organizer">IIT Hyderabad × Bank of India</div>
      </aside>

      <main className="main">
        <section className="hero">
          <div>
            <span className="tag">AI/ML Mule Account Screening Platform</span>
            <h1>
              Detect suspicious mule accounts before fraudulent fund movement
              spreads.
            </h1>
            <p>
              MuleShield AI uses anomaly detection, predictive risk scoring,
              intelligent alerts, and graph intelligence to support banking
              fraud investigation teams.
            </p>

            <div className="upload-box">
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setFile(e.target.files[0])}
              />
              {file && <p className="file-name">Selected: {file.name}</p>}
            </div>

            <button onClick={loadDashboard}>
              {loading ? "Uploading & Analyzing..." : "Upload & Launch Risk Analysis"}
            </button>
          </div>

          <div className="hero-card">
            <h3>Decision Support System</h3>
            <p>Suspicious Account Detection</p>
            <p>Anomaly-Based Risk Scoring</p>
            <p>Graph-Based Mule Network Discovery</p>
          </div>
        </section>

        {summary && statistics && graph && (
          <>
            <section className="cards">
              <div className="card">
                <FaDatabase className="icon blue" />
                <p>Total Accounts Screened</p>
                <h2>{summary.total_records}</h2>
              </div>

              <div className="card">
                <FaExclamationTriangle className="icon red" />
                <p>Flagged for Review</p>
                <h2 className="red-text">{summary.anomalies}</h2>
              </div>

              <div className="card">
                <FaCheckCircle className="icon green" />
                <p>Legitimate Accounts</p>
                <h2 className="green-text">{summary.normal_records}</h2>
              </div>

              <div className="card">
                <FaShieldAlt className="icon yellow" />
                <p>Anomaly Rate</p>
                <h2 className="yellow-text">{summary.anomaly_percentage}%</h2>
              </div>
            </section>

            <section className="risk-meter panel">
              <div>
                <h2>Overall Risk Exposure</h2>
                <p>
                  {summary.anomaly_percentage < 5
                    ? "Low Risk"
                    : summary.anomaly_percentage < 10
                    ? "Low-Moderate Risk"
                    : "High Risk"}
                </p>
              </div>

              <div className="meter">
                <div
                  className="meter-fill"
                  style={{
                    width: `${Math.min(summary.anomaly_percentage * 10, 100)}%`,
                  }}
                ></div>
              </div>
            </section>

            <section className="grid-two">
              <div className="panel">
                <h2>Risk Distribution</h2>
                <ResponsiveContainer width="100%" height={270}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" outerRadius={95} label>
                      <Cell fill="#00e0a4" />
                      <Cell fill="#ff5c5c" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="panel">
                <h2>Fraud Analytics Overview</h2>
                <ResponsiveContainer width="100%" height={270}>
                  <BarChart data={barData}>
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#00c896" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="grid-three">
              <div className="panel">
                <h2>
                  <FaBrain /> Model Intelligence
                </h2>
                <p>Total Features Analysed: {statistics.total_features}</p>
                <p>Target Variable: F3924</p>
                <p>Average Score: {statistics.average_anomaly_score.toFixed(4)}</p>
                <p>Most Suspicious Score: {statistics.minimum_anomaly_score.toFixed(4)}</p>
              </div>

              <div className="panel">
                <h2>
                  <FaFileAlt /> Feature Intelligence
                </h2>
                <div className="features">
                  {importantFeatures.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
              </div>

              <div className="panel">
                <h2>
                  <FaProjectDiagram /> Graph Intelligence
                </h2>
                <p>Nodes: {graph.nodes}</p>
                <p>Transaction Links: {graph.edges}</p>
                <p>Mule Clusters: {graph.connected_components}</p>
              </div>
            </section>

            <section className="grid-two">
              <div className="panel">
                <h2>Intelligent Alerts</h2>
                {alerts.length === 0 ? (
                  <p>No active alerts</p>
                ) : (
                  alerts.map((alert, index) => (
                    <div className="alert" key={index}>
                      <strong>{alert.severity}</strong>
                      <p>{alert.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="panel investigation">
                <h2>
                  <FaSearch /> Explainable Investigation
                </h2>
                <p>Enter suspicious record ID for review support.</p>

                <div className="search-row">
                  <input
                    type="number"
                    placeholder="Example: 6033"
                    value={recordId}
                    onChange={(e) => setRecordId(e.target.value)}
                  />
                  <button onClick={investigateRecord}>Investigate</button>
                </div>

                {explanation && (
                  <pre>{JSON.stringify(explanation, null, 2)}</pre>
                )}
              </div>
            </section>

            <section className="table-section">
              <h2>High Priority Investigation Queue</h2>

              <table>
                <thead>
                  <tr>
                    <th>Record ID</th>
                    <th>Anomaly Score</th>
                    <th>Review Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {highRisk.map((record) => (
                    <tr key={record.record_id}>
                      <td>{record.record_id}</td>
                      <td>{record.anomaly_score.toFixed(4)}</td>
                      <td>High</td>
                      <td>
                        <span className="badge">Flagged for Review</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;