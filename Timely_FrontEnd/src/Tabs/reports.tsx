// src/Tabs/reports.tsx

import React, { useEffect, useMemo, useState } from "react";
import DataTable from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useTheme } from "../Views_Layouts/ThemeContext";
import { BarChart2, Users, Clock, FolderOpen, AlertCircle } from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

type UserRow = {
  customerId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  tempPassword?: string;
};

interface HoursLog {
  logId: string;
  projectId: string;
  consultantEmail?: string;
  date: string;
  hours: number;
}

interface Project {
  projectId: string;
  projectName: string;
  projectCode?: string;
}

interface ConsultantHoursSummary {
  consultant: string;
  email: string;
  totalHours: number;
  entries: number;
}

const safeFetch = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const getCurrentUser = (): { role: UserRole; email: string } => {
  try {
    const raw = localStorage.getItem("timely_user");
    if (!raw) return { role: "admin", email: "" };
    const parsed = JSON.parse(raw);
    const r = (parsed.role || "").toLowerCase();
    const role: UserRole =
      r === "admin" || r === "consultant" || r === "client" ? r : "admin";
    return { role, email: parsed.email || "" };
  } catch {
    return { role: "admin", email: "" };
  }
};

const ReportsTab: React.FC = () => {
  const { isDark } = useTheme();
  const s = {
    bg: isDark ? "bg-slate-950" : "bg-gray-50",
    text: isDark ? "text-white" : "text-gray-900",
    textMuted: isDark ? "text-slate-400" : "text-gray-600",
    textSubtle: isDark ? "text-slate-500" : "text-gray-400",
    card: isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
    cardInner: isDark ? "bg-slate-800" : "bg-gray-100",
    chip: isDark ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700",
  };

  const { role: userRole, email: currentEmail } = useMemo(
    () => getCurrentUser(),
    []
  );
  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const [userReport, setUserReport] = useState<UserRow[]>([]);
  const [hours, setHours] = useState<HoursLog[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [usersRes, hoursRes, projRes] = await Promise.all([
        safeFetch(`${API_BASE}/users-report`),
        safeFetch(`${API_BASE}/hours-logs`),
        safeFetch(`${API_BASE}/projects`),
      ]);

      if (usersRes?.data) setUserReport(usersRes.data);
      if (hoursRes?.data) setHours(hoursRes.data);
      if (projRes?.data) setProjects(projRes.data);

      setLoading(false);
    };
    load();
  }, []);

  const myHours = useMemo(() => {
    if (!isConsultant || !currentEmail) return hours;
    const lower = currentEmail.toLowerCase();
    return hours.filter(
      (h) => (h.consultantEmail || "").toLowerCase() === lower
    );
  }, [hours, isConsultant, currentEmail]);

  const myProjectsTouched = useMemo(
    () => new Set(myHours.map((h) => h.projectId)).size,
    [myHours]
  );

  const lastActivityDate = useMemo(() => {
    if (myHours.length === 0) return null;
    const sorted = [...myHours].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return new Date(sorted[0].date);
  }, [myHours]);

  const consultantSummary: ConsultantHoursSummary[] = useMemo(() => {
    const map = new Map<string, ConsultantHoursSummary>();

    for (const h of hours) {
      const email = (h.consultantEmail || "Unknown").toLowerCase();
      const key = email || "unknown";
      const existing = map.get(key) || {
        consultant: email || "Unknown",
        email,
        totalHours: 0,
        entries: 0,
      };
      existing.totalHours += Number(h.hours) || 0;
      existing.entries += 1;
      map.set(key, existing);
    }

    return Array.from(map.values()).sort(
      (a, b) => b.totalHours - a.totalHours
    );
  }, [hours]);

  const userColumns = React.useMemo<ColumnDef<UserRow, any>[]>(
    () => [
      { accessorKey: "customerId", header: "ID" },
      {
        accessorFn: (row) =>
          `${row.firstName} ${row.middleName || ""} ${row.lastName}`.trim(),
        id: "fullName",
        header: "Name",
      },
      { accessorKey: "email", header: "Email" },
    ],
    []
  );

  // If a client magically lands here, friendly message.
  if (userRole === "client") {
    return (
      <div className={`${s.bg} min-h-screen`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className={`${s.card} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h1 className={`text-lg font-semibold ${s.text}`}>
                Reports are for staff
              </h1>
            </div>
            <p className={s.textMuted}>
              As a client, you don’t see internal reports. Your consultant and
              admin use this section to track performance and hours. You can see
              everything relevant to you from your dashboard and project
              details.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${s.bg} min-h-screen`}>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold ${s.text}`}>Reports</h1>
            <p className={`${s.textMuted} text-sm mt-1`}>
              {isAdmin
                ? "Analyze clients and consultant hours to understand performance."
                : "See a summary of your projects and hours logged in Timely."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs ${s.textSubtle}`}>Role</span>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-xs text-blue-100">
              <BarChart2 className="w-3 h-3" />
              {isAdmin ? "Admin view" : "Consultant view"}
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Role-specific content */}
        {isConsultant && (
          <>
            {/* Consultant stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                    Total hours logged
                  </p>
                  <p className={`text-2xl font-semibold ${s.text}`}>
                    {myHours
                      .reduce((sum, h) => sum + (Number(h.hours) || 0), 0)
                      .toFixed(1)}
                  </p>
                </div>
              </div>

              <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                    Projects touched
                  </p>
                  <p className={`text-2xl font-semibold ${s.text}`}>
                    {myProjectsTouched}
                  </p>
                </div>
              </div>

              <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                    Last activity
                  </p>
                  <p className={`text-sm font-semibold ${s.text}`}>
                    {lastActivityDate
                      ? lastActivityDate.toLocaleDateString()
                      : "No entries yet"}
                  </p>
                </div>
              </div>
            </div>

            {/* Consultant recent hours */}
            <div className={`${s.card} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <h2 className={`text-sm font-semibold ${s.text}`}>
                    Your recent hours
                  </h2>
                </div>
                <span className={`text-xs ${s.textSubtle}`}>
                  Showing up to 15 most recent entries
                </span>
              </div>

              {myHours.length === 0 ? (
                <div className={`${s.cardInner} rounded-xl p-4 text-sm ${s.textMuted}`}>
                  No hours logged yet. Use the Hours tab to start tracking your
                  work.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className={isDark ? "bg-slate-800" : "bg-gray-100"}>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold">
                          Date
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">
                          Project
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold">
                          Hours
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...myHours]
                        .sort(
                          (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                        )
                        .slice(0, 15)
                        .map((h) => {
                          const p = projects.find(
                            (x) => x.projectId === h.projectId
                          );
                          return (
                            <tr
                              key={h.logId}
                              className={
                                isDark
                                  ? "border-b border-slate-800 hover:bg-slate-800/60"
                                  : "border-b border-gray-200 hover:bg-gray-50"
                              }
                            >
                              <td className="px-3 py-2">
                                {new Date(h.date).toLocaleDateString()}
                              </td>
                              <td className="px-3 py-2">
                                {p
                                  ? p.projectName
                                  : `Project ${h.projectId || ""}`}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {Number(h.hours).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {isAdmin && (
          <>
            {/* Admin: user accounts table */}
            <div className={`${s.card} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <h2 className={`text-sm font-semibold ${s.text}`}>
                    Clients & accounts
                  </h2>
                </div>
              </div>

              <DataTable<UserRow>
                data={userReport}
                columns={userColumns}
                filterPlaceholder="Search clients by name or email…"
              />
            </div>

            {/* Admin: hours by consultant */}
            <div className={`${s.card} border rounded-2xl p-5`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <h2 className={`text-sm font-semibold ${s.text}`}>
                    Hours by consultant
                  </h2>
                </div>
                <span className={`text-xs ${s.textSubtle}`}>
                  {consultantSummary.length} consultants with logged hours
                </span>
              </div>

              {consultantSummary.length === 0 ? (
                <div className={`${s.cardInner} rounded-xl p-4 text-sm ${s.textMuted}`}>
                  No hours have been logged yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className={isDark ? "bg-slate-800" : "bg-gray-100"}>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold">
                          Consultant
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold">
                          Email
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold">
                          Entries
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold">
                          Total hours
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultantSummary.map((c) => (
                        <tr
                          key={c.email}
                          className={
                            isDark
                              ? "border-b border-slate-800 hover:bg-slate-800/60"
                              : "border-b border-gray-200 hover:bg-gray-50"
                          }
                        >
                          <td className="px-3 py-2">
                            {c.consultant || c.email || "Unknown"}
                          </td>
                          <td className="px-3 py-2">{c.email || "—"}</td>
                          <td className="px-3 py-2 text-right">{c.entries}</td>
                          <td className="px-3 py-2 text-right">
                            {c.totalHours.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {loading && (
          <div className="text-xs text-center text-slate-500">
            Loading fresh data…
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsTab;
