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
        <ResponsesClient />
      </div>
    </Shell>
  );
}
