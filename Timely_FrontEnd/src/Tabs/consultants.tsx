// src/Tabs/consultants.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  Search,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

type ConsultantsPageProps = {
  userRole?: UserRole;
};

type ConsultantRow = {
  consultantId: string;
  consultantCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
};

const safeFetch = async (url: string) => {
  try {
    const res = await fetch(url);
    const contentType = res.headers.get("content-type");
    if (!res.ok || !contentType?.includes("application/json")) return null;
    return await res.json();
  } catch (e) {
    console.error("Failed to fetch:", e);
    return null;
  }
};

const ConsultantsPage: React.FC<ConsultantsPageProps> = ({
  userRole = "admin",
}) => {
  const { isDark } = useTheme();
  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      const data = await safeFetch(`${API_BASE}/consultants`);
      if (data?.data) {
        setConsultants(data.data);
      } else {
        setError("Could not load consultants.");
        setConsultants([]);
      }
      setLoading(false);
    };
    load();
  }, []);

  const filteredConsultants = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return consultants.filter((c) => {
      if (!term) return true;
      const name = `${c.firstName} ${c.lastName}`.toLowerCase();
      return (
        name.includes(term) ||
        (c.email || "").toLowerCase().includes(term) ||
        (c.consultantCode || "").toLowerCase().includes(term)
      );
    });
  }, [consultants, searchTerm]);

  const stats = useMemo(
    () => ({
      total: consultants.length,
      active: consultants.length,
      onLeave: 0,
      hoursLogged: 0,
    }),
    [consultants]
  );

  const bg = isDark ? "bg-slate-950" : "bg-gray-100";
  const card = isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200";
  const cardSoft = isDark ? "bg-slate-800" : "bg-gray-50";
  const text = isDark ? "text-white" : "text-gray-900";
  const textMuted = isDark ? "text-slate-400" : "text-gray-500";

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${bg} p-4 md:p-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? "bg-purple-600" : "bg-purple-500"
            }`}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${text}`}>Consultants</h1>
            <p className={`text-xs ${textMuted}`}>
              {isAdmin
                ? "Manage your consultants and assignments."
                : "View the list of consultants in Timely."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`${cardSoft} border border-dashed rounded-lg px-3 py-1.5 flex items-center gap-2`}>
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className={`text-[11px] ${textMuted}`}>
              Total consultants: <span className="font-semibold">{stats.total}</span>
            </span>
          </div>
          <div className="text-[11px] px-2 py-1 rounded-full bg-slate-800/10 text-slate-500">
            Role: <span className="font-semibold">{userRole}</span>
          </div>
        </div>
      </div>

      {/* Role hint */}
      {isConsultant && (
        <div className={`${cardSoft} border rounded-lg px-3 py-2 mb-3 flex items-center gap-2`}>
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className={`text-xs ${textMuted}`}>
            Consultants can **view** this list. Only admins can add/remove consultants
            and change roles.
          </p>
        </div>
      )}

      {/* Admin-only quick action card */}
      {isAdmin && (
        <div className={`${card} border rounded-xl p-4 mb-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-purple-500" />
              <p className={`text-sm font-semibold ${text}`}>Admin quick note</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500">
              Admin only
            </span>
          </div>
          <p className={`text-xs ${textMuted}`}>
            Consultant creation and role changes are primarily handled in the{" "}
            <strong>Admin tab</strong> where you also assign consultants to
            clients/projects. This screen is mainly for overview and searching.
          </p>
        </div>
      )}

      {/* Search + Stats */}
      <div className="grid md:grid-cols-3 gap-3 mb-4">
        <div className={`${card} border rounded-lg p-2 flex items-center gap-2`}>
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or email"
            className={`w-full text-xs bg-transparent outline-none ${text}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={`${cardSoft} border rounded-lg px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <div>
              <p className={`text-[11px] ${textMuted}`}>Active consultants</p>
              <p className={`text-sm font-semibold ${text}`}>{stats.active}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        <div className={`${cardSoft} border rounded-lg px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <div>
              <p className={`text-[11px] ${textMuted}`}>Hours logged (placeholder)</p>
              <p className={`text-sm font-semibold ${text}`}>{stats.hoursLogged}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* Table */}
      <div className={`${card} border rounded-xl overflow-hidden`}>
        <div className="px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span
              className={`text-xs font-semibold uppercase tracking-wide ${textMuted}`}
            >
              Consultant list
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
                className={`text-left text-[11px] uppercase tracking-wide ${textMuted}`}
              >
                <th className="px-4 py-2 border-b">Code</th>
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Role</th>
                <th className="px-4 py-2 border-b">Status</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    Loading consultants...
                  </td>
                </tr>
              ) : filteredConsultants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    No consultants found.
                  </td>
                </tr>
              ) : (
                filteredConsultants.map((c) => (
                  <tr key={c.consultantId} className={`border-b ${cardSoft}`}>
                    <td className="px-4 py-2 align-middle">{c.consultantCode}</td>
                    <td className="px-4 py-2 align-middle">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-2 align-middle">{c.email}</td>
                    <td className="px-4 py-2 align-middle">
                      {c.role || "consultant"}
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-500 px-2 py-0.5 text-[10px]">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      {isAdmin ? (
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-500/10 text-purple-500 text-[11px]"
                          // actual edit/assign UI is handled in Admin tab
                          disabled
                        >
                          <Plus className="w-3 h-3" />
                          Manage (Admin tab)
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConsultantsPage;
