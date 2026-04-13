import { Shell } from "@/components/layout/Shell";
import { ResponsesClient } from "./ResponsesClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Service Responses | PGLU Feedback v2",
  description: "View and classify client feedback responses",
};

export default function ResponsesPage() {
  return (
    <Shell>
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-black text-primary font-display uppercase tracking-tight">Service Responses</h2>
          <p className="text-on-surface/50 text-xs font-bold uppercase tracking-widest mt-1 italic">Detailed feedback and comment classification</p>
        </div>

        <ResponsesClient />
      </div>
    </Shell>
  );
}
