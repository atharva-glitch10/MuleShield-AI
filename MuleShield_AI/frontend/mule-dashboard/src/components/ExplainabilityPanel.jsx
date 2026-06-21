import React, { useRef, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Title,
} from "chart.js";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Title);

export default function ExplainabilityPanel({ features }) {
  const chartRef = useRef(null);

  // Prepare data sorted by absolute impact descending
  const sorted = [...features].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
  const labels = sorted.map(f => f.feature);
  const dataValues = sorted.map(f => f.impact);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Impact",
        data: dataValues,
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null; // chart not ready yet
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "#ff5c5c"); // low impact (right)
          gradient.addColorStop(1, "#00e0a4"); // high impact (left)
          return gradient;
        },
        borderWidth: 0,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `Impact: ${ctx.parsed.x.toFixed(4)}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: { ticks: { font: { size: 12 } } },
    },
    animation: {
      duration: 500,
      easing: "easeOutQuart",
    },
  };

  // Force re-render to apply gradient after first draw
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.update();
    }
  }, [features]);

  return (
    <div className="explainability-panel" style={{ height: 300, marginTop: 20 }}>
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
