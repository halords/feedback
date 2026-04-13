import { SettingsClient } from "./SettingsClient";

export const metadata = {
  title: "Settings | PGLU Feedback v2",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
