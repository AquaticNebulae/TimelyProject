// src/Tabs/hours.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  Clock,
  Calendar,
  User,
  FolderOpen,
  Plus,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

interface HoursLog {
  logId: string;
  projectId: string;
  consultantId?: string;
  consultantEmail?: string;
  date: string;
  hours: number;
  description?: string;
}

interface Project {
  projectId: string;
  projectName: string;
  projectCode?: string;
}

interface Consultant {
  consultantId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
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

const HoursPage: React.FC = () => {
  const { isDark } = useTheme();
  const s = {
    bg: isDark ? "bg-slate-950" : "bg-gray-50",
    text: isDark ? "text-white" : "text-gray-900",
    textMuted: isDark ? "text-slate-400" : "text-gray-600",
    textSubtle: isDark ? "text-slate-500" : "text-gray-400",
    card: isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
    cardInner: isDark ? "bg-slate-800" : "bg-gray-100",
    input:
      isDark
        ? "bg-slate-900 border-slate-700 text-white"
        : "bg-white border-gray-300 text-gray-900",
    button:
      isDark
        ? "bg-slate-700 hover:bg-slate-600 text-white"
        : "bg-gray-200 hover:bg-gray-300 text-gray-800",
    buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    tableHeader: isDark ? "bg-slate-800" : "bg-gray-100",
    tableRow: isDark
      ? "border-slate-800 hover:bg-slate-800/60"
      : "border-gray-200 hover:bg-gray-50",
    divider: isDark ? "border-slate-800" : "border-gray-200",
  };

  const { role: userRole, email: currentEmail } = useMemo(
    () => getCurrentUser(),
    []
  );
  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const [projects, setProjects] = useState<Project[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [logs, setLogs] = useState<HoursLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    projectId: string;
    date: string;
    hours: string;
    description: string;
  }>({
    projectId: "",
    date: new Date().toISOString().slice(0, 10),
    hours: "",
    description: "",
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (
    message: string,
    type: "success" | "error" | "info" = "success"
  ) => {
    const id = `toast_${Date.now()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      const [projRes, consRes, logsRes] = await Promise.all([
        safeFetch(`${API_BASE}/projects`),
        safeFetch(`${API_BASE}/consultants`),
        safeFetch(`${API_BASE}/hours-logs`),
      ]);

      if (projRes?.data) setProjects(projRes.data);
      if (consRes?.data) setConsultants(consRes.data);
      if (logsRes?.data) setLogs(logsRes.data);

      setLoading(false);
    };

    // Clients should never really hit this tab; App doesn’t route them here,
    // but if they somehow do, we still run load() to avoid crashes.
    load();
  }, []);

  const myLogs = useMemo(() => {
    if (isAdmin || !currentEmail) return logs;
    const lower = currentEmail.toLowerCase();
    return logs.filter(
      (l) => (l.consultantEmail || "").toLowerCase() === lower
    );
  }, [logs, isAdmin, currentEmail]);

  const totalHours = useMemo(
    () => myLogs.reduce((sum, l) => sum + (Number(l.hours) || 0), 0),
    [myLogs]
  );

  const getProjectName = (projectId: string) => {
    const p = projects.find((x) => x.projectId === projectId);
    return p ? p.projectName : "Unknown project";
  };

  const getConsultantName = (log: HoursLog) => {
    if (!isAdmin) return "You";
    const email = (log.consultantEmail || "").toLowerCase();
    const c = consultants.find(
      (x) => (x.email || "").toLowerCase() === email
    );
    if (c) return `${c.firstName} ${c.lastName}`;
    return log.consultantEmail || "Unknown";
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin && !isConsultant) return;

    if (!form.projectId || !form.date || !form.hours) {
      showToast("Project, date, and hours are required.", "error");
      return;
    }

    const hoursNum = Number(form.hours);
    if (Number.isNaN(hoursNum) || hoursNum <= 0) {
      showToast("Hours must be a positive number.", "error");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        projectId: form.projectId,
        date: form.date,
        hours: hoursNum,
        description: form.description,
        consultantEmail: currentEmail || undefined,
      };

      const res = await fetch(`${API_BASE}/hours-log-create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.error || "Failed to log hours.");
      }

      showToast("Hours logged successfully.");
      setForm((prev) => ({ ...prev, hours: "", description: "" }));

      // reload logs
      const logsRes = await safeFetch(`${API_BASE}/hours-logs`);
      if (logsRes?.data) setLogs(logsRes.data);
    } catch (err: any) {
      setError(err.message || "Error logging hours.");
      showToast(err.message || "Error logging hours.", "error");
    } finally {
      setSaving(false);
    }
  };

  // If somehow a client lands here, show a friendly message.
  if (userRole === "client") {
    return (
      <div className={`${s.bg} min-h-screen`}>
        <div className="max-w-3xl mx-auto px-6 py-12">
          <div className={`${s.card} border rounded-2xl p-6`}>
            <div className="flex items-center gap-3 mb-3">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <h1 className={`text-lg font-semibold ${s.text}`}>
                Hours are for staff only
              </h1>
            </div>
            <p className={s.textMuted}>
              As a client, you don’t log hours in Timely. Your consultant and
              admin track work time for you. You can always see project updates
              and documents from your dashboard.
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
            <h1 className={`text-3xl font-bold ${s.text}`}>Hours</h1>
            <p className={`${s.textMuted} text-sm mt-1`}>
              {isAdmin
                ? "View all logged hours across consultants and projects."
                : "Log your work time and track how much you’ve done this week."}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs ${s.textSubtle}`}>This period</span>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span className={`text-lg font-semibold ${s.text}`}>
                {totalHours.toFixed(1)}h
              </span>
            </div>
          </div>
        </div>

        {/* Log form */}
        <div className={`${s.card} border rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <h2 className={`text-sm font-semibold ${s.text}`}>
                Log new hours
              </h2>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            <div className="md:col-span-2">
              <label className={`block text-xs font-medium mb-1 ${s.textSubtle}`}>
                Project
              </label>
              <select
                name="projectId"
                value={form.projectId}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${s.input}`}
              >
                <option value="">Select project…</option>
                {projects.map((p) => (
                  <option key={p.projectId} value={p.projectId}>
                    {p.projectName}
                    {p.projectCode ? ` (${p.projectCode})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${s.textSubtle}`}>
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg border text-sm ${s.input}`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-xs font-medium mb-1 ${s.textSubtle}`}>
                Hours
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                name="hours"
                value={form.hours}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${s.input}`}
              />
            </div>

            <div className="md:col-span-4">
              <label className={`block text-xs font-medium mb-1 ${s.textSubtle}`}>
                Description (optional)
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={2}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${s.input}`}
                placeholder="What did you work on?"
              />
            </div>

            <div className="md:col-span-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <FolderOpen className={`w-3 h-3 ${s.textSubtle}`} />
                <span className={s.textSubtle}>
                  {projects.length === 0
                    ? "No projects yet – add one in Projects or Admin first."
                    : "Select the project that this time entry belongs to."}
                </span>
              </div>
              <button
                type="submit"
                disabled={saving || projects.length === 0}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold ${s.buttonPrimary} disabled:opacity-60`}
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Log hours
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Logs table */}
        <div className={`${s.card} border rounded-2xl p-5`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              <h2 className={`text-sm font-semibold ${s.text}`}>
                {isAdmin ? "All logged hours" : "Your recent hours"}
              </h2>
            </div>
            <button
              onClick={async () => {
                setLoading(true);
                const logsRes = await safeFetch(`${API_BASE}/hours-logs`);
                if (logsRes?.data) setLogs(logsRes.data);
                setLoading(false);
              }}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${s.button}`}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {myLogs.length === 0 ? (
            <div className={`${s.cardInner} rounded-xl p-4 text-sm ${s.textMuted}`}>
              {loading
                ? "Loading hours…"
                : "No hours logged yet for this user."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className={s.tableHeader}>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Project
                    </th>
                    {isAdmin && (
                      <th className="px-3 py-2 text-left text-xs font-semibold">
                        Consultant
                      </th>
                    )}
                    <th className="px-3 py-2 text-right text-xs font-semibold">
                      Hours
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {myLogs.map((log) => (
                    <tr key={log.logId} className={s.tableRow}>
                      <td className="px-3 py-2 align-top whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {getProjectName(log.projectId)}
                      </td>
                      {isAdmin && (
                        <td className="px-3 py-2 align-top whitespace-nowrap">
                          {getConsultantName(log)}
                        </td>
                      )}
                      <td className="px-3 py-2 align-top text-right">
                        {Number(log.hours).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-slate-400">
                        {log.description || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Toasts */}
        <div className="fixed bottom-4 right-4 space-y-2 z-40">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-2 rounded-lg text-sm shadow-lg border ${
                t.type === "error"
                  ? "bg-red-500/10 border-red-500/50 text-red-100"
                  : t.type === "info"
                  ? "bg-slate-800 border-slate-600 text-slate-100"
                  : "bg-emerald-600/10 border-emerald-500/60 text-emerald-100"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HoursPage;
