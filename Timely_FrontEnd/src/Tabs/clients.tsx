// src/Tabs/clients.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  Search,
  Filter,
  RefreshCw,
  Users,
  Building2,
  Mail,
  Phone,
  AlertCircle,
} from "lucide-react";

const API_BASE = "http://localhost:4000/api";

type UserRole = "admin" | "consultant" | "client";

type CurrentUser = {
  customerId: string;
  email: string;
  name: string;
  role?: UserRole | string;
};

interface Client {
  customerId: string;
  clientCode: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
}

const getCurrentUserRole = (): UserRole => {
  try {
    const raw = localStorage.getItem("timely_user");
    if (!raw) return "admin";
    const parsed: CurrentUser = JSON.parse(raw);
    const r = parsed.role;
    if (r === "admin" || r === "consultant" || r === "client") return r;
    return "admin";
  } catch {
    return "admin";
  }
};

const ClientsPage: React.FC = () => {
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
  };

  const userRole = useMemo(() => getCurrentUserRole(), []);
  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const loadClients = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/users-report`);
      if (!res.ok) throw new Error("Failed to load clients");
      const json = await res.json();
      setClients(json.data || []);
    } catch (err: any) {
      setError(err.message || "Error loading clients");
    } finally {
      setLoading(false);
    }
  };

  const refreshClients = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  useEffect(() => {
    loadClients();
  }, []);

  const filteredClients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return clients.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const matchesSearch =
        !term ||
        fullName.includes(term) ||
        (c.clientCode || "").toLowerCase().includes(term) ||
        (c.email || "").toLowerCase().includes(term);

      if (typeFilter === "all") return matchesSearch;
      if (typeFilter === "withEmail") return matchesSearch && !!c.email;
      if (typeFilter === "missingEmail") return matchesSearch && !c.email;
      return matchesSearch;
    });
  }, [clients, searchTerm, typeFilter]);

  return (
    <div className={`min-h-[calc(100vh-4rem)] ${styles.bg} p-4 md:p-6`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isDark ? "bg-emerald-600" : "bg-emerald-500"
            }`}
          >
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-xl font-semibold ${styles.text}`}>Clients</h1>
            <p className={`text-xs ${styles.textMuted}`}>
              View the list of all clients registered in Timely.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={refreshClients}
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

      {/* Role note */}
      {(isConsultant || !isAdmin) && (
        <div
          className={`${styles.cardInner} mb-3 rounded-lg border px-3 py-2 flex items-center gap-2`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <p className={`text-xs ${styles.textMuted}`}>
            Client creation, password reset and role changes are done in the{" "}
            <span className="font-semibold">Admin tab</span> (admin only). This
            Clients section is <strong>view-only</strong> for consultants.
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-3 mb-4">
        <div className={`${styles.card} border rounded-lg p-2 flex items-center gap-2`}>
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or code"
            className={`w-full text-xs bg-transparent outline-none ${styles.text}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={`${styles.card} border rounded-lg p-2 flex items-center gap-2`}>
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            className={`w-full text-xs rounded-md border px-2 py-1 bg-transparent ${styles.input}`}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All clients</option>
            <option value="withEmail">With email</option>
            <option value="missingEmail">Missing email</option>
          </select>
        </div>

        <div className={`${styles.cardInner} rounded-lg border border-dashed px-3 py-2 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-500" />
            <span className={`text-xs ${styles.textMuted}`}>
              {clients.length} client(s) loaded
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${styles.card} border rounded-xl overflow-hidden`}>
        <div className={`${styles.tableHeader} px-4 py-2 border-b flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className={`text-xs font-semibold uppercase tracking-wide ${styles.textMuted}`}>
              Client list
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
                <th className="px-4 py-2 border-b">Name</th>
                <th className="px-4 py-2 border-b">Email</th>
                <th className="px-4 py-2 border-b">Contact</th>
                <th className="px-4 py-2 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    Loading clients...
                  </td>
                </tr>
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-xs text-slate-400"
                  >
                    No clients found.
                  </td>
                </tr>
              ) : (
                filteredClients.map((c) => (
                  <tr key={c.customerId} className={`${styles.tableRow} border-b`}>
                    <td className="px-4 py-2 align-middle">{c.clientCode}</td>
                    <td className="px-4 py-2 align-middle">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-4 py-2 align-middle">{c.email || "—"}</td>
                    <td className="px-4 py-2 align-middle">
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-500 text-[11px]"
                          disabled={!c.email}
                          title={c.email ? `Email ${c.email}` : "No email"}
                        >
                          <Mail className="w-3 h-3" />
                          Email
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-500/10 text-slate-500 text-[11px]"
                          disabled
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2 align-middle">
                      <span className="text-[11px] text-slate-400">
                        View only
                      </span>
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

export default ClientsPage;
