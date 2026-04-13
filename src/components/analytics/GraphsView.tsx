"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useAnalytics } from "@/context/AnalyticsContext";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ChartOptions
} from "chart.js";
import { Line, Bar, Pie } from "react-chartjs-2";
import useSWR from "swr";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const fetcher = (url: string, body: any) => 
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(res => res.json());

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const COLORS = {
  GENERAL: "#4F46E5", // Indigo 600
  MALE: "#0EA5E9",    // Sky 500
  FEMALE: "#EC4899",  // Pink 500
  LGBTQ: "#8B5CF6",   // Violet 500
  ONLINE: "#10B981",  // Emerald 500
  OFFLINE: "#F59E0B", // Amber 500
  SYSTEMS: "#F97316", // Orange 500
  STAFF: "#8B5CF6",   // Violet 500
  ENVIRONMENT: "#06B6D4", // Cyan 500
  UNDEFINED: "#94A3B8"  // Slate 400
};

// Pre-load the logo to ensure it's available for canvas capture
const logoImage = typeof window !== "undefined" ? new Image() : null;
if (logoImage) logoImage.src = "/logo.png";

const legacyPlugin = (footer: string) => ({
  id: `legacyPlugin_${footer.replace(/[^a-z0-9]/gi, '_')}`, // Unique ID for each plugin instance
  afterDraw: (chart: any) => {
    const { ctx, options, chartArea } = chart;
    
    if (logoImage && logoImage.complete) {
      const titleHeight = options.plugins.title.font?.size || 18;
      const imgSize = titleHeight * 4.5;
      
      // Get title lines to estimate bounding box
      const titleLines = options.plugins.title.text || [];
      const centerX = chart.width / 2;
      
      // Heuristic: Calculate width of the longest title line
      const maxLine = titleLines.reduce((a: string, b: string) => a.length > b.length ? a : b, "");
      const textWidth = ctx.measureText(maxLine).width || (maxLine.length * titleHeight * 0.6);
      
      // Place logo to the far right of the chart
      const x = chart.width - imgSize - 30; 
      const y = 15; // Top aligned
      
      ctx.drawImage(logoImage, x, y, imgSize, imgSize);
    }

    if (footer) {
      ctx.save();
      ctx.font = "bold 14px Arial";
      ctx.fillStyle = "#000";
      ctx.fillText(footer, 30, chart.height - 20);
      ctx.restore();
    }
  }
});

export function GraphsView() {
  const { data: currentData, month, year, isLoading: currentLoading } = useAnalytics();
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = "/logo.png";
    img.onload = () => setLogoReady(true);
  }, []);

  const { data: trendData, isLoading: trendLoading } = useSWR(
    currentData ? ["/api/dashboard", ["ALL"], MONTHS, year] : null,
    ([url, offices, months, y]) => fetcher(url, { offices, month: months, year: y })
  );

  const entries = useMemo(() => {
    if (!currentData || !Array.isArray(currentData)) return [];
    return currentData.filter(o => o.overrate !== "N/A");
  }, [currentData]);

  const labels = useMemo(() => entries.map(o => o.department), [entries]);

  const genRatingData = { labels, datasets: [{ label: "General Rating", data: entries.map(o => parseFloat(o.overrate)), borderColor: COLORS.GENERAL, backgroundColor: "transparent", borderWidth: 3, tension: 0.4 }] };
  const summaryData = { labels, datasets: [
    { label: "Environment", data: entries.map(o => parseFloat(o.qValues.Q1?.RATE || "0")), backgroundColor: COLORS.ENVIRONMENT },
    { label: "Systems and Procedures", data: entries.map(o => parseFloat(o.sysRate || "0")), backgroundColor: COLORS.SYSTEMS },
    { label: "Staff Service", data: entries.map(o => parseFloat(o.staffRate || "0")), backgroundColor: COLORS.STAFF }
  ]};
  const enviData = { labels, datasets: [{ label: "Environment", data: entries.map(o => parseFloat(o.qValues.Q1?.RATE || "0")), borderColor: COLORS.ENVIRONMENT, backgroundColor: "transparent", borderWidth: 3, tension: 0.4 }] };
  const sysprocData = { labels, datasets: [{ label: "Systems and Procedures", data: entries.map(o => parseFloat(o.sysRate || "0")), borderColor: COLORS.SYSTEMS, backgroundColor: "transparent", borderWidth: 3, tension: 0.4 }] };
  const staffData = { labels, datasets: [{ label: "Staff Service", data: entries.map(o => parseFloat(o.staffRate || "0")), borderColor: COLORS.STAFF, backgroundColor: "transparent", borderWidth: 3, tension: 0.4 }] };

  const monthlyRatingTrend = useMemo(() => {
    if (!trendData || !Array.isArray(trendData)) return null;
    const monthlyAverages = MONTHS.map(m => {
      const monthStats = trendData.filter(d => d.month === m);
      if (monthStats.length === 0) return 0;
      let sum = 0, count = 0;
      monthStats.forEach(s => { if (s.overrate !== "N/A") { sum += parseFloat(s.overrate); count++; } });
      return count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
    });
    return { labels: MONTHS, datasets: [{ label: "Monthly Rating", data: monthlyAverages, borderColor: COLORS.GENERAL, borderWidth: 3, tension: 0.4 }] };
  }, [trendData]);

  const monthlyResTrend = useMemo(() => {
    if (!trendData || !Array.isArray(trendData)) return null;
    const monthlyTotals = MONTHS.map(m => trendData.filter(d => d.month === m).reduce((acc, curr) => acc + curr.collection, 0));
    return { labels: MONTHS, datasets: [{ label: "Monthly Respondents", data: monthlyTotals, borderColor: COLORS.GENERAL, borderWidth: 3, tension: 0.4 }] };
  }, [trendData]);

  const genderData = useMemo(() => {
    if (!entries.length) return null;
    const g = entries.reduce((acc, curr) => {
      acc.Male += curr.gender.Male; acc.Female += curr.gender.Female; acc.LGBTQ += curr.gender.LGBTQ; acc.Undefined += (curr.gender.Others || 0);
      return acc;
    }, { Male: 0, Female: 0, LGBTQ: 0, Undefined: 0 });
    return { labels: ["Male", "Female", "LGBTQ", "Undefined"], datasets: [{ data: [g.Male, g.Female, g.LGBTQ, g.Undefined], backgroundColor: [COLORS.MALE, COLORS.FEMALE, COLORS.LGBTQ, COLORS.UNDEFINED] }] };
  }, [entries]);

  const resDistData = { labels, datasets: [{ label: "Online", data: entries.map(o => o.online), backgroundColor: COLORS.ONLINE }, { label: "Offline", data: entries.map(o => o.offline), backgroundColor: COLORS.OFFLINE }] };

  const getOptions = (title: string, isPie: boolean = false): ChartOptions<any> => ({
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 13 / 8.5,
    layout: { padding: { bottom: 20, top: 0 } },
    plugins: {
      title: {
        display: true,
        text: [
          'Provincial Government of La Union',
          'CUSTOMER FEEDBACK CONSOLIDATION REPORT',
          title.toUpperCase(),
          `${month.toUpperCase()} ${year}`
        ],
        font: { size: 18, weight: 'bold', family: 'Arial' },
        color: '#000',
        padding: { top: 30, bottom: 30 }
      },
      legend: { 
        position: 'bottom',
        labels: { font: { weight: 'bold', size: 14 }, color: '#000' } 
      }
    },
    scales: isPie ? {} : {
      y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.1)" }, ticks: { font: { weight: 'bold', size: 13 }, color: '#000' } },
      x: { grid: { display: false }, title: { display: false }, ticks: { font: { weight: 'bold', size: 12 }, color: '#000' } }
    }
  });

  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const handleEvent = () => handleExport();
    window.addEventListener('export-graphs', handleEvent);
    return () => window.removeEventListener('export-graphs', handleEvent);
  }, [month, year]); // Re-bind if period changes

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const chartIds = [
        "genRating", "summary", "envi", "sysproc", "staffData", 
        "monthlyRating", "monthlyRes", "genders", "resDist"
      ];
      
      const images: string[] = [];
      for (const id of chartIds) {
        const canvas = document.getElementById(id) as HTMLCanvasElement;
        if (canvas) {
          images.push(canvas.toDataURL("image/png"));
        }
      }

      // To open a POST request in a new tab for previewing, we use a hidden form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/api/reports/graphs';
      form.target = '_blank';

      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = 'data';
      input.value = JSON.stringify({ images, month, year });
      form.appendChild(input);

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export graphs PDF");
    } finally {
      // We wait a bit before hiding overlay to ensure capture is complete
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  if ((currentLoading && !currentData) || trendLoading) {
    return <div className="space-y-8 animate-pulse">{[...Array(9)].map((_, i) => <div key={i} className="h-[500px] bg-on-surface/5 rounded-2xl" />)}</div>;
  }

  return (
    <div className="flex flex-col gap-12 pb-40 relative">
      {isExporting && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl border border-on-surface/5 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="font-display font-bold text-primary">Generating High-Fidelity Graphs PDF...</p>
            <p className="text-xs text-on-surface/50">Capturing charts and preparing your report.</p>
          </div>
        </div>
      )}

      <ChartCard canvasId="genRating" data={genRatingData} options={getOptions("General Rating")} type="line" footer="ADM-050-1" />
      <ChartCard canvasId="summary" data={summaryData} options={getOptions("Graphical Summary Report")} type="bar" footer="ADM-051-1" />
      <ChartCard canvasId="envi" data={enviData} options={getOptions("Environment Rating")} type="line" footer="ADM-052-1" />
      <ChartCard canvasId="sysproc" data={sysprocData} options={getOptions("Systems and Procedures Rating")} type="line" footer="ADM-053-1" />
      <ChartCard canvasId="staffData" data={staffData} options={getOptions("Staff Service Rating")} type="line" footer="ADM-054-1" />
      <ChartCard canvasId="monthlyRating" data={monthlyRatingTrend} options={getOptions("Monthly Rating")} type="line" footer="ADM-055-0" />
      <ChartCard canvasId="monthlyRes" data={monthlyResTrend} options={getOptions("Monthly Respondents")} type="line" footer="ADM-056-0" />
      <div className="bg-white rounded-3xl p-6 border border-on-surface/5 shadow-2xl flex items-center justify-center">
        {genderData && <Pie id="genders" data={genderData} options={getOptions("Gender", true)} plugins={[legacyPlugin("ADM-057-0")]} />}
      </div>
      <ChartCard canvasId="resDist" data={resDistData} options={getOptions("Respondents Distribution")} type="bar" footer="" />
    </div>
  );
}

function ChartCard({ canvasId, data, options, type, footer }: { canvasId: string, data: any, options: any, type: "line" | "bar", footer: string }) {
  if (!data) return null;
  const plugins = useMemo(() => [legacyPlugin(footer)], [footer]);
  return (
    <div className="bg-white rounded-3xl p-6 border border-on-surface/5 shadow-2xl overflow-hidden">
      <div>
        {type === "line" && <Line id={canvasId} data={data} options={options} plugins={plugins} />}
        {type === "bar" && <Bar id={canvasId} data={data} options={options} plugins={plugins} />}
      </div>
    </div>
  );
}
