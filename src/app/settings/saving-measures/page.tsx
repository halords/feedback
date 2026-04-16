import { SavingMeasuresClient } from "./SavingMeasuresClient";

export const metadata = {
  title: "Saving Measures | PGLU Feedback v2",
  description: "Manage historical data archival and read optimizations.",
};

export default function SavingMeasuresPage() {
  return <SavingMeasuresClient />;
}
