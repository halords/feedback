"use client";

import React from "react";
import UsersClient from "./UsersClient";
import UsersTable from "@/components/users/UsersTable";

export default function UsersPage() {
  return (
    <UsersClient>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <UsersTable />
      </div>
    </UsersClient>
  );
}
