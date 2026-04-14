import { Metadata } from "next";
import PhysicalReportsClient from "./PhysicalReportsClient";

export const metadata: Metadata = {
  title: "Physical Reports Editor | Feedback App",
  description: "Superadmin tool to edit raw physical report data.",
};

export default function PhysicalReportsPage() {
  return <PhysicalReportsClient />;
}
