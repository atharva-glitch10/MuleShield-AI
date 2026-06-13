import { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import "./App.css";

function App() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");

  const fetchData = async () => {
    try {
      const [summaryRes, alertsRes] = await Promise.all([
        axios.get("http://127.0.0.1:8000/dashboard/summary"),
        axios.get("http://127.0.0.1:8000/alerts")
      ]);
      setSummary(summaryRes.data);
      setAlerts(alertsRes.data.alerts || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to connect to the backend API. Is the FastAPI server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setUploadMessage("Uploading and processing dataset...");
    setUploadStatus("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setUploadStatus("success");
      setUploadMessage(`Successfully processed ${response.data.rows} rows.`);
      setLoading(true);
      await fetchData();
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus("error");
      setUploadMessage("Failed to upload dataset. Ensure backend is running.");
    } finally {
      setIsUploading(false);
      event.target.value = null;
    }
  };

  if (loading) {
    return <div className="loading-container"><div className="loader"></div><h2>Loading Dashboard...</h2></div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const pieData = [
    { name: "Normal", value: summary.normal_records },
    { name: "Anomalies", value: summary.anomalies }
  ];

  const COLORS = ["#4ade80", "#ef4444"];

  const barData = [
    {
      name: "Records",
      Normal: summary.normal_records,
      Anomalies: summary.anomalies,
    }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🛡️ MuleShield AI Dashboard</h1>
        <p>AI-Powered Mule Account Detection Platform</p>
      </header>

      <div className="upload-section">
        <div className="upload-card">
          <div className="upload-header">
            <h3>Upload Dataset</h3>
            <p>Upload a new CSV dataset to update the models and run anomaly detection.</p>
          </div>
          <div className="upload-controls">
            <label className={`upload-button ${isUploading ? 'disabled' : ''}`} htmlFor="file-upload">
              {isUploading ? "Processing..." : "Choose CSV File"}
            </label>
            <input 
              id="file-upload" 
              type="file" 
              accept=".csv" 
              onChange={handleFileUpload} 
              disabled={isUploading}
            />
          </div>
          {uploadMessage && (
            <div className={`upload-message ${uploadStatus}`}>
              {uploadMessage}
            </div>
          )}
        </div>
      </div>

      <div className="alerts-container">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert alert-${alert.severity.toLowerCase()}`}>
            <strong>{alert.severity}:</strong> {alert.message}
          </div>
        ))}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Records</h3>
          <p className="stat-value">{summary.total_records.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Anomalies Detected</h3>
          <p className="stat-value danger">{summary.anomalies.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Normal Records</h3>
          <p className="stat-value success">{summary.normal_records.toLocaleString()}</p>
        </div>
        <div className="stat-card">
          <h3>Anomaly Rate</h3>
          <p className="stat-value warning">{summary.anomaly_percentage}%</p>
        </div>
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Distribution Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Volume Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Normal" fill="#4ade80" />
              <Bar dataKey="Anomalies" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;