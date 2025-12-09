// src/Style_Components/Dashboard.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  FolderOpen,
  Users,
  User as UserIcon,
  Clock,
  Calendar,
  Bell,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  FileText,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

interface Project {
  projectId: string;
  projectCode?: string;
  projectName: string;
  status?: string;
}

interface Client {
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Consultant {
  consultantId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface HoursLog {
  logId: string;
  projectId: string;
  consultantEmail?: string;
  date: string;
  hours: number;
}

interface Alert {
  id: string | number;
  type: "info" | "warning";
  message: string;
  page?: string;
}

type Props = {
  sidebarToggle: boolean;
  setSidebarToggle?: (v: boolean) => void;
  onNavigate: (page: string) => void;
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
};

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

const Dashboard: React.FC<Props> = ({
  onNavigate,
  userName = "User",
  userEmail,
  userRole = "admin",
}) => {
  const { isDark } = useTheme();

  const s = {
    bg: isDark ? "bg-slate-950" : "bg-gray-50",
    text: isDark ? "text-white" : "text-gray-900",
    textMuted: isDark ? "text-slate-400" : "text-gray-600",
    textSubtle: isDark ? "text-slate-500" : "text-gray-400",
    card: isDark ? "bg-slate-900 border-slate-800" : "bg-white border-gray-200",
    softCard: isDark ? "bg-slate-800" : "bg-gray-100",
    accent: isDark ? "text-blue-400" : "text-blue-600",
    accentBg: isDark ? "bg-blue-500/10" : "bg-blue-50",
    accentBorder: isDark ? "border-blue-500/40" : "border-blue-500/40",
    chip: isDark ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700",
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [hours, setHours] = useState<HoursLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [projRes, clientRes, consRes, hoursRes] = await Promise.all([
        safeFetch(`${API_BASE}/projects`),
        safeFetch(`${API_BASE}/users-report`),
        safeFetch(`${API_BASE}/consultants`),
        safeFetch(`${API_BASE}/hours-logs`),
      ]);

      if (projRes?.data) setProjects(projRes.data);
      if (clientRes?.data) setClients(clientRes.data);
      if (consRes?.data) setConsultants(consRes.data);
      if (hoursRes?.data) setHours(hoursRes.data);

      setLoading(false);
    };
    load();
  }, []);

  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const myHours = useMemo(() => {
    if (!isConsultant || !userEmail) return hours;
    const lower = userEmail.toLowerCase();
    return hours.filter(
      (h) => (h.consultantEmail || "").toLowerCase() === lower
    );
  }, [hours, isConsultant, userEmail]);

  const totalHoursThisWeek = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    return myHours
      .filter((h) => {
        const d = new Date(h.date);
        return d >= startOfWeek && d <= now;
      })
      .reduce((sum, h) => sum + (Number(h.hours) || 0), 0);
  }, [myHours]);

  const alerts: Alert[] = useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.status && p.status.toLowerCase() !== "completed"
    );
    const out: Alert[] = [];

    if (isAdmin) {
      if (clients.length === 0) {
        out.push({
          id: 1,
          type: "warning",
          message: "No clients in the system yet. Use Admin → Clients to add.",
          page: "admin",
        });
      }
      if (consultants.length === 0) {
        out.push({
          id: 2,
          type: "warning",
          message:
            "No consultants registered. Invite consultants using Create Account.",
          page: "EmailGenerator",
        });
      }
    }

    if (isConsultant) {
      if (activeProjects.length === 0) {
        out.push({
          id: 3,
          type: "info",
          message: "No active projects assigned yet. Check back soon.",
          page: "projects",
        });
      }
      if (totalHoursThisWeek < 1) {
        out.push({
          id: 4,
          type: "warning",
          message: "You haven’t logged any hours this week.",
          page: "hours",
        });
      }
    }

    return out;
  }, [projects, clients, consultants, isAdmin, isConsultant, totalHoursThisWeek]);

  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" });
  const dayName = today.toLocaleString("default", { weekday: "long" });

  const fullName = userName || "User";
  const firstName = fullName.split(" ")[0];

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel =
    userRole === "admin"
      ? "Admin"
      : userRole === "consultant"
      ? "Consultant"
      : "Client";

  const quickActions =
    userRole === "admin"
      ? [
          {
            label: "New Project",
            icon: FolderOpen,
            page: "projects",
            color: "bg-blue-600 hover:bg-blue-700",
          },
          {
            label: "Add Client",
            icon: Users,
            page: "admin",
            color: "bg-purple-600 hover:bg-purple-700",
          },
          {
            label: "Create Account",
            icon: UserIcon,
            page: "EmailGenerator",
            color: "bg-emerald-600 hover:bg-emerald-700",
          },
          {
            label: "Review Hours",
            icon: Clock,
            page: "hours",
            color: "bg-amber-500 hover:bg-amber-600",
          },
        ]
      : userRole === "consultant"
      ? [
          {
            label: "Log Hours",
            icon: Clock,
            page: "hours",
            color: "bg-emerald-600 hover:bg-emerald-700",
          },
          {
            label: "My Projects",
            icon: FolderOpen,
            page: "projects",
            color: "bg-blue-600 hover:bg-blue-700",
          },
          {
            label: "My Clients",
            icon: Users,
            page: "client",
            color: "bg-purple-600 hover:bg-purple-700",
          },
        ]
      : [
          {
            label: "View My Projects",
            icon: FolderOpen,
            page: "projects",
            color: "bg-blue-600 hover:bg-blue-700",
          },
          {
            label: "Upload Documents",
            icon: FileText,
            page: "settings",
            color: "bg-purple-600 hover:bg-purple-700",
          },
          {
            label: "Contact Consultant",
            icon: MessageSquare,
            page: "settings",
            color: "bg-emerald-600 hover:bg-emerald-700",
          },
        ];

  return (
    <div className={`${s.bg} min-h-screen`}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Header row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className={`text-sm ${s.textSubtle}`}>{dayName}, {monthName} {today.getDate()}</p>
            <h1 className={`mt-1 text-3xl font-bold ${s.text}`}>
              Dashboard
            </h1>
            <p className={`mt-1 text-sm ${s.textMuted}`}>
              Welcome back, <span className="font-semibold">{firstName}</span>.{" "}
              {isAdmin
                ? "Review activity across clients, consultants, and projects."
                : isConsultant
                ? "Here’s a snapshot of your projects, clients, and hours."
                : "Track your projects and stay connected with your consultant."}
            </p>
          </div>

          {/* User chip */}
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.card}`}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold">
                {initials}
              </div>
            </div>
            <div>
              <p className={`text-sm font-medium ${s.text}`}>{fullName}</p>
              <p className={`text-xs ${s.textSubtle}`}>
                {roleLabel}
                {userEmail ? ` • ${userEmail}` : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-500 flex items-center justify-center">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                Projects
              </p>
              <p className={`text-2xl font-semibold ${s.text}`}>
                {projects.length}
              </p>
            </div>
          </div>

          <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-purple-600/10 text-purple-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                Clients
              </p>
              <p className={`text-2xl font-semibold ${s.text}`}>
                {clients.length}
              </p>
            </div>
          </div>

          <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                Consultants
              </p>
              <p className={`text-2xl font-semibold ${s.text}`}>
                {consultants.length}
              </p>
            </div>
          </div>

          <div className={`${s.card} border rounded-2xl p-4 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-xs uppercase tracking-wide ${s.textSubtle}`}>
                Hours this week
              </p>
              <p className={`text-2xl font-semibold ${s.text}`}>
                {totalHoursThisWeek.toFixed(1)}
              </p>
            </div>
          </div>
        </div>

        {/* Middle row: alerts + calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Alerts */}
          <div className={`lg:col-span-2 ${s.card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className={`w-4 h-4 ${s.accent}`} />
                <h2 className={`text-sm font-semibold ${s.text}`}>Alerts</h2>
              </div>
              <span className={`text-xs ${s.textSubtle}`}>
                {alerts.length === 0 ? "All caught up" : `${alerts.length} active`}
              </span>
            </div>

            {alerts.length === 0 ? (
              <div
                className={`mt-2 flex flex-col items-center justify-center gap-2 py-6 rounded-xl ${s.softCard}`}
              >
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <p className={`text-sm ${s.textMuted}`}>No alerts right now.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {alerts.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => a.page && onNavigate(a.page)}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-xl text-left ${
                      s.softCard
                    } hover:bg-slate-800/70 transition`}
                  >
                    <div className="mt-0.5">
                      {a.type === "warning" ? (
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Bell className={`w-4 h-4 ${s.accent}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${s.text}`}>{a.message}</p>
                      {a.page && (
                        <p className={`text-xs ${s.textSubtle} mt-1`}>
                          Click to open related page
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Simple calendar card */}
          <div className={`${s.card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${s.accent}`} />
                <h2 className={`text-sm font-semibold ${s.text}`}>Calendar</h2>
              </div>
              <span className={`text-xs ${s.textSubtle}`}>{monthName} {today.getFullYear()}</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-xs">
              {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                <div
                  key={d}
                  className={`h-7 flex items-center justify-center font-medium ${s.textSubtle}`}
                >
                  {d}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i + 1;
                const isToday = day === today.getDate();
                return (
                  <div
                    key={i}
                    className={`h-7 flex items-center justify-center rounded-lg ${
                      isToday
                        ? `${s.accentBg} ${s.accentBorder} border text-xs font-semibold`
                        : `${s.softCard} text-xs ${s.textMuted}`
                    }`}
                  >
                    {day <= 31 ? day : ""}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick actions + activity summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`lg:col-span-2 ${s.card} border rounded-2xl p-4`}>
            <div className="flex items-center justify-between mb-3">
              <h2 className={`text-sm font-semibold ${s.text}`}>Quick Actions</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => onNavigate(action.page)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium text-white ${action.color}`}
                >
                  <span>{action.label}</span>
                  <span className="bg-white/10 rounded-lg p-1.5">
                    <action.icon className="w-4 h-4" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={`${s.card} border rounded-2xl p-4`}>
            <div className="flex items-center gap-2 mb-3">
              <Clock className={`w-4 h-4 ${s.accent}`} />
              <h2 className={`text-sm font-semibold ${s.text}`}>
                This week’s focus
              </h2>
            </div>
            <p className={`text-sm ${s.textMuted} mb-3`}>
              {isAdmin
                ? "Review hours logged by consultants and make sure active projects are moving."
                : isConsultant
                ? "Log your time daily and keep project notes up to date."
                : "Check your project updates and upload any requested documents."}
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs ${s.chip}`}>
                <Clock className="w-3 h-3 inline mr-1" />
                {totalHoursThisWeek.toFixed(1)}h this week
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs ${s.chip}`}>
                <FolderOpen className="w-3 h-3 inline mr-1" />
                {projects.length} projects
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs ${s.chip}`}>
                <Users className="w-3 h-3 inline mr-1" />
                {clients.length} clients
              </span>
            </div>
          </div>
        </div>

        {loading && (
          <div className="mt-4 text-xs text-center text-slate-500">
            Loading fresh data from the server…
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
