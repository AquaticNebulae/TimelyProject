// src/Tabs/projects.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Calendar,
  Building2,
  Users,
  AlertCircle,
  CheckCircle2,
  X,
  Info,
  FolderOpen,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

type CurrentUser = {
  customerId: string;
  email: string;
  name: string;
  role?: UserRole | string;
};

interface Project {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  status: string;
}

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const getCurrentUserRole = (): { role: UserRole; email: string } => {
  try {
    const raw = localStorage.getItem("timely_user");
    if (!raw) return { role: "admin", email: "admin@timely.com" };
    const parsed: CurrentUser = JSON.parse(raw);

    const r = parsed.role;
    if (r === "admin" || r === "consultant" || r === "client") {
      return { role: r, email: parsed.email || "" };
    }
    return { role: "admin", email: parsed.email || "admin@timely.com" };
  } catch {
    return { role: "admin", email: "admin@timely.com" };
  }
};

const statusOptions = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

const RealEstateProjects: React.FC = () => {
  const { isDark } = useTheme();
  const styles = {
    bg: isDark ? "bg-slate-950" : "bg-gray-50",
    text: isDark ? "text-white" : "text-gray-900",
    textMuted: isDark ? "text-slate-400" : "text-gray-600",
    card: isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200",
    cardInner: isDark ? "bg-slate-800" : "bg-gray-100",
    tableHeader: isDark ? "bg-slate-800" : "bg-gray-100",
    tableRow: isDark
      ? "border-slate-700 hover:bg-slate-800/60"
      : "border-gray-200 hover:bg-gray-50",
    input: isDark
      ? "bg-slate-800 border-slate-700 text-white"
      : "bg-white border-gray-300 text-gray-900",
    button: isDark
      ? "bg-slate-700 hover:bg-slate-600 text-white"
      : "bg-gray-200 hover:bg-gray-300 text-gray-800",
    buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    badgeMuted: isDark ? "bg-slate-800 text-slate-200" : "bg-gray-100 text-gray-700",
  };

  const { role: userRole, email: userEmail } = useMemo(
    () => getCurrentUserRole(),
    []
  );
  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Admin-only form state
  const [newProjectName, setNewProjectName] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [newStatus, setNewStatus] = useState("planning");

  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((t) => t.id !== id)),
      3500
    );
  };

  const loadProjects = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/projects`);
      if (!res.ok) throw new Error("Failed to load projects");
      const json = await res.json();
      setProjects(json.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = async () => {
    setRefreshing(true);
    await loadProjects();
    setRefreshing(false);
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return projects.filter((p) => {
      const matchesSearch =
        !term ||
        p.projectName.toLowerCase().includes(term) ||
        (p.clientName || "").toLowerCase().includes(term) ||
        (p.projectCode || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" ? true : p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  // Admin-only: create project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    if (!newProjectName.trim() || !newClientName.trim()) {
      addToast("Project name and client name are required.", "error");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: newProjectName.trim(),
          clientName: newClientName.trim(),
          status: newStatus,
          createdBy: userEmail,
        }),
      });

      if (!res.ok) throw new Error("Failed to create project");
      addToast("Project created successfully.", "success");
      setNewProjectName("");
      setNewClientName("");
      setNewStatus("planning");
      await loadProjects();
    } catch (err: any) {
      addToast(err.message || "Error creating project", "error");
    }
  };

  // Admin-only: delete project
  const handleDeleteProject = async (projectId: string) => {
    if (!isAdmin) return;
    if (!window.confirm("Delete this project? This cannot be undone.")) return;

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete project");
      addToast("Project deleted.", "success");
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
    } catch (err: any) {
      addToast(err.message || "Error deleting project", "error");
    }
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${styles.bg} p-4 md:p-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? "bg-blue-600" : "bg-blue-500"
            }`}
          >
            <FolderOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${styles.text}`}>Projects</h1>
            <p className={`text-xs ${styles.textMuted}`}>
              {isConsultant
                ? "View projects assigned to your clients."
                : "Manage all Timely projects and assignments."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={refreshProjects}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${styles.button}`}
          >
            <RefreshCw className="w-3 h-3" />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <div className="text-[11px] px-2 py-1 rounded-full bg-slate-800/10 text-slate-500">
            Role: <span className="font-semibold">{userRole}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-3 mb-4">
        <div className={`${styles.card} border rounded-lg p-2 flex items-center gap-2`}>
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, client, or code"
            className={`w-full text-xs bg-transparent outline-none ${styles.text}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={`${styles.card} border rounded-lg p-2 flex items-center gap-2`}>
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className={`w-full text-xs rounded-md border px-2 py-1 bg-transparent ${styles.input}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={`${styles.cardInner} rounded-lg border border-dashed flex items-center justify-between px-3 py-2`}>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className={`text-xs ${styles.textMuted}`}>
              {projects.length} project(s) loaded
            </span>
          </div>
          <Users className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Admin-only create form */}
      {isAdmin && (
        <div className={`mb-4 ${styles.card} border rounded-lg p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" />
              <p className={`text-sm font-semibold ${styles.text}`}>
                Create new project
              </p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
              Admin only
            </span>
          </div>

          <form
            onSubmit={handleCreateProject}
            className="grid gap-3 md:grid-cols-3"
          >
            <div className="space-y-1">
              <label className={`text-xs ${styles.textMuted}`}>Project name</label>
              <input
                type="text"
                className={`w-full text-xs rounded-md border px-2 py-1 ${styles.input}`}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="ex. Website redesign"
              />
            </div>
            <div className="space-y-1">
              <label className={`text-xs ${styles.textMuted}`}>Client name</label>
              <input
                type="text"
                className={`w-full text-xs rounded-md border px-2 py-1 ${styles.input}`}
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="ex. Acme Corp"
              />
            </div>
            <div className="space-y-1">
              <label className={`text-xs ${styles.textMuted}`}>Status</label>
              <select
                className={`w-full text-xs rounded-md border px-2 py-1 ${styles.input}`}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium ${styles.buttonPrimary}`}
              >
                <Plus className="w-3 h-3" />
                Create project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Note for consultants (view only) */}
      {isConsultant && (
        <div className={`mb-3 ${styles.cardInner} rounded-lg border px-3 py-2 flex items-center gap-2`}>
          <Info className="w-4 h-4 text-amber-500" />
          <p className={`text-xs ${styles.textMuted}`}>
            Consultants can **view** projects but cannot create or delete them. Ask an
            admin to set up or remove projects.
          </p>
        </div>
      )}

      {/* Table */}
      <div className={`${styles.card} border rounded-xl overflow-hidden`}>
        <div className={`${styles.tableHeader} px-4 py-2 border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className={`text-xs font-semibold uppercase tracking-wide ${styles.textMuted}`}>
              Project list
            </span>
          </div>
          {error && (
            <div className="flex items-center gap-1 text-xs text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr
                className={`text-left text-[11px] uppercase tracking-wide ${styles.textMuted}`}
              >
                <th className="px-4 py-2 border-b">Code</th>
                <th className="px-4 py-2 border-b">Project</th>
                <th className="px-4 py-2 border-b">Client</th>
                <th className="px-4 py-2 border-b">Status</th>
                {isAdmin && <th className="px-4 py-2 border-b text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    Loading projects...
                  </td>
                </tr>
              ) : filteredProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    No projects found.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => (
                  <tr key={p.projectId} className={`${styles.tableRow} border-b`}>
                    <td className="px-4 py-2 align-middle">{p.projectCode}</td>
                    <td className="px-4 py-2 align-middle">{p.projectName}</td>
                    <td className="px-4 py-2 align-middle">{p.clientName}</td>
                    <td className="px-4 py-2 align-middle">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-slate-800/10 text-slate-500">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        {statusOptions.find((o) => o.value === p.status)?.label ||
                          p.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2 align-middle text-right">
                        <button
                          onClick={() => handleDeleteProject(p.projectId)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[11px]"
                        >
                          <X className="w-3 h-3" />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toasts */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              px-3 py-2 rounded-md text-xs shadow-lg flex items-center gap-2
              ${
                t.type === "error"
                  ? "bg-red-500 text-white"
                  : t.type === "success"
                  ? "bg-emerald-500 text-white"
                  : isDark
                  ? "bg-slate-800 text-slate-100"
                  : "bg-white text-gray-800"
              }
            `}
          >
            {t.type === "error" && <AlertCircle className="w-3 h-3" />}
            {t.type === "success" && <CheckCircle2 className="w-3 h-3" />}
            {t.type === "info" && <Info className="w-3 h-3" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RealEstateProjects;
