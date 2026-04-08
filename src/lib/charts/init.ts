import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';

// Register Chart.js components globally
export function initCharts() {
  if (typeof window !== 'undefined') {
    ChartJS.register(
      CategoryScale,
      LinearScale,
      BarElement,
      LineElement,
      PointElement,
      ArcElement,
      Title,
      Tooltip,
      Legend
    );

    // Set global defaults matching Indigo Slate theme
    ChartJS.defaults.font.family = 'Inter, sans-serif';
    ChartJS.defaults.color = '#191c1e'; // on-surface
    ChartJS.defaults.plugins.legend.labels.usePointStyle = true;
    ChartJS.defaults.responsive = true;
    ChartJS.defaults.maintainAspectRatio = false;
  }
}
