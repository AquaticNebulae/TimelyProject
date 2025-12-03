// src/Tabs/admin.tsx
import React, { useEffect, useState } from "react";
import EmailGenerator from "../Views_Layouts/EmailGenerator";

const API_BASE = "http://localhost:4000";

// ---- Types ----
type UserRow = {
  customerId: string;
  clientCode: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  tempPassword: string;
};

type ProjectRow = {
  projectId: string;
  projectCode: string;
  projectName: string;
  clientName: string;
  status: string;
};

type ConsultantRow = {
  consultantId: string;
  consultantCode: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
};

type AuditLogItem = {
  logId: string;
  timestamp: string;
  actionType: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  details: string;
};

type AdminSection = "home" | "projects" | "clients" | "consultants" | "settings";
type ClientViewMode = "add" | "select";

const AdminTab: React.FC = () => {
  const [section, setSection] = useState<AdminSection>("home");
  const [clientView, setClientView] = useState<ClientViewMode>("add");

  const [adminEmail, setAdminEmail] = useState<string>("admin@timely.com");

  // Clients/users
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userActionMessage, setUserActionMessage] = useState<string | null>(
    null
  );

  // Projects
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [projectClientName, setProjectClientName] = useState("");
  const [projectStatus, setProjectStatus] = useState("");

  // Consultants
  const [consultants, setConsultants] = useState<ConsultantRow[]>([]);
  const [consultantsLoading, setConsultantsLoading] = useState(false);
  const [consultantsError, setConsultantsError] = useState<string | null>(null);
  const [consFirstName, setConsFirstName] = useState("");
  const [consLastName, setConsLastName] = useState("");
  const [consEmail, setConsEmail] = useState("");
  const [consRole, setConsRole] = useState("");

  // Audit / notifications
  const [notifications, setNotifications] = useState<AuditLogItem[]>([]);
  const [notifError, setNotifError] = useState<string | null>(null);

  // Assignment UI
  const [assignClientIdForConsultant, setAssignClientIdForConsultant] =
    useState<string>("");
  const [assignConsultantId, setAssignConsultantId] = useState<string>("");

  const [assignClientIdForProject, setAssignClientIdForProject] =
    useState<string>("");
  const [assignProjectId, setAssignProjectId] = useState<string>("");
  const [assignProjectConsultantId, setAssignProjectConsultantId] =
    useState<string>("");

  // ---- Fetch helpers ----

  const fetchUsers = async () => {
    try {
      setUserLoading(true);
      setUserError(null);
      const res = await fetch(`${API_BASE}/api/users-report`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const json = await res.json();
      setUsers(json.data || []);
    } catch (err: any) {
      setUserError(err.message || "Error fetching users");
    } finally {
      setUserLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      setProjectsLoading(true);
      setProjectsError(null);
      const res = await fetch(`${API_BASE}/api/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const json = await res.json();
      setProjects(json.data || []);
    } catch (err: any) {
      setProjectsError(err.message || "Error fetching projects");
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchConsultants = async () => {
    try {
      setConsultantsLoading(true);
      setConsultantsError(null);
      const res = await fetch(`${API_BASE}/api/consultants`);
      if (!res.ok) throw new Error("Failed to fetch consultants");
      const json = await res.json();
      setConsultants(json.data || []);
    } catch (err: any) {
      setConsultantsError(err.message || "Error fetching consultants");
    } finally {
      setConsultantsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotifError(null);
      const res = await fetch(`${API_BASE}/api/audit-logs/latest?limit=10`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const json = await res.json();
      setNotifications(json.data || []);
    } catch (err: any) {
      setNotifError(err.message || "Error fetching notifications");
    }
  };

  // ---- Initial load ----
  useEffect(() => {
    // admin email from login
    try {
      const stored = localStorage.getItem("timely_user");
      if (stored) {
        const u = JSON.parse(stored);
        if (u?.email) setAdminEmail(u.email);
      }
    } catch {
      // ignore
    }

    fetchUsers();
    fetchProjects();
    fetchConsultants();
    fetchNotifications();
  }, []);

  // ---- Client actions ----

  const handleDeleteUser = async (customerId: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove user with ID ${customerId}?`
    );
    if (!confirmDelete) return;

    try {
      setUserActionMessage(null);
      setUserError(null);

      const res = await fetch(`${API_BASE}/api/users-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId, performedBy: adminEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete user.");
      }

      setUserActionMessage(`User ${customerId} removed successfully.`);
      setUsers((prev) =>
        prev.filter((u) => u.customerId !== String(customerId))
      );
      fetchNotifications();
    } catch (err: any) {
      setUserError(err.message || "Error deleting user.");
    }
  };

  // ---- Project actions ----

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      alert("Project name is required.");
      return;
    }

    try {
      setProjectsError(null);
      const res = await fetch(`${API_BASE}/api/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: projectName.trim(),
          clientName: projectClientName.trim(),
          status: projectStatus.trim(),
          performedBy: adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create project.");
      }

      setProjectName("");
      setProjectClientName("");
      setProjectStatus("");
      await fetchProjects();
      fetchNotifications();
    } catch (err: any) {
      setProjectsError(err.message || "Error creating project.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove project ID ${projectId}?`
    );
    if (!confirmDelete) return;

    try {
      setProjectsError(null);
      const res = await fetch(`${API_BASE}/api/projects-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, performedBy: adminEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete project.");
      }

      setProjects((prev) =>
        prev.filter((p) => p.projectId !== String(projectId))
      );
      fetchNotifications();
    } catch (err: any) {
      setProjectsError(err.message || "Error deleting project.");
    }
  };

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClientIdForProject || !assignProjectId) {
      alert("Select a client and a project.");
      return;
    }

    try {
      const payload: any = {
        clientId: assignClientIdForProject,
        projectId: assignProjectId,
        performedBy: adminEmail,
      };

      if (assignProjectConsultantId) {
        payload.consultantIds = [assignProjectConsultantId];
      }

      const res = await fetch(`${API_BASE}/api/projects/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign project.");
      }

      window.alert("Project assigned successfully.");
      fetchNotifications();
    } catch (err: any) {
      window.alert(err.message || "Error assigning project.");
    }
  };

  // ---- Consultant actions ----

  const handleCreateConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consFirstName.trim() || !consLastName.trim() || !consEmail.trim()) {
      alert("First name, last name, and email are required.");
      return;
    }

    try {
      setConsultantsError(null);
      const res = await fetch(`${API_BASE}/api/consultants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: consFirstName.trim(),
          lastName: consLastName.trim(),
          email: consEmail.trim(),
          role: consRole.trim(),
          performedBy: adminEmail,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create consultant.");
      }

      setConsFirstName("");
      setConsLastName("");
      setConsEmail("");
      setConsRole("");
      await fetchConsultants();
      fetchNotifications();
    } catch (err: any) {
      setConsultantsError(err.message || "Error creating consultant.");
    }
  };

  const handleDeleteConsultant = async (consultantId: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to remove consultant ID ${consultantId}?`
    );
    if (!confirmDelete) return;

    try {
      setConsultantsError(null);
      const res = await fetch(`${API_BASE}/api/consultants-delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultantId, performedBy: adminEmail }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete consultant.");
      }

      setConsultants((prev) =>
        prev.filter((c) => c.consultantId !== String(consultantId))
      );
      fetchNotifications();
    } catch (err: any) {
      setConsultantsError(err.message || "Error deleting consultant.");
    }
  };

  const handleAssignConsultant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignClientIdForConsultant || !assignConsultantId) {
      alert("Select a client and a consultant.");
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/client-consultants/assign`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: assignClientIdForConsultant,
            consultantId: assignConsultantId,
            performedBy: adminEmail,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to assign consultant.");
      }

      window.alert(data.message || "Consultant assigned successfully.");
      fetchNotifications();
    } catch (err: any) {
      window.alert(err.message || "Error assigning consultant.");
    }
  };

  // ---- Render sections ----

  const renderHome = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Admin Home</h1>
          <p className="text-sm text-slate-300">
            Overview of clients, projects and consultants. Use quick actions to
            add new records.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setSection("clients")}
          >
            + New Client
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setSection("consultants")}
          >
            + New Consultant
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setSection("projects")}
          >
            + New Project
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Total Clients</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Projects</p>
          <p className="text-2xl font-bold">{projects.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 mb-1">Consultants</p>
          <p className="text-2xl font-bold">{consultants.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2" />
        <div className="bg-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Notifications / Activity</h2>
            <button
              onClick={fetchNotifications}
              className="text-[11px] text-blue-400 hover:underline"
            >
              Refresh
            </button>
          </div>
          {notifError && (
            <p className="text-xs text-red-400 mb-1">{notifError}</p>
          )}
          {notifications.length === 0 && !notifError && (
            <p className="text-xs text-slate-400">
              No recent activity yet. Actions such as creating clients or
              assigning projects will appear here.
            </p>
          )}
          <ul className="space-y-1 max-h-64 overflow-y-auto text-xs">
            {notifications
              .slice()
              .reverse()
              .map((n) => (
                <li
                  key={n.logId}
                  className="border-b border-gray-700 pb-1 mb-1"
                >
                  <div className="text-slate-200">{n.details}</div>
                  <div className="text-[10px] text-slate-400">
                    {n.actionType} · {n.entityId} · {n.performedBy}
                  </div>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderClients = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-slate-300">
            Add new clients or manage existing ones and assignments.
          </p>
        </div>
        <div className="inline-flex rounded-lg overflow-hidden border border-gray-700">
          <button
            className={`px-3 py-1.5 text-xs font-semibold ${
              clientView === "add"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-slate-300"
            }`}
            onClick={() => setClientView("add")}
          >
            Add Client
          </button>
          <button
            className={`px-3 py-1.5 text-xs font-semibold ${
              clientView === "select"
                ? "bg-blue-600 text-white"
                : "bg-gray-800 text-slate-300"
            }`}
            onClick={() => setClientView("select")}
          >
            Manage Clients
          </button>
        </div>
      </div>

      {clientView === "add" && (
        <div className="-mx-4">
          {/* Email + temp password + CSV save */}
          <EmailGenerator />
        </div>
      )}

      {clientView === "select" && (
        <div className="mt-4 space-y-6">
          {/* Client list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Current Clients</h2>
              <button
                onClick={fetchUsers}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
              >
                Refresh
              </button>
            </div>

            {userActionMessage && (
              <div className="mb-3 rounded-lg border border-emerald-400 bg-emerald-900/40 px-3 py-2 text-xs text-emerald-200">
                {userActionMessage}
              </div>
            )}

            {userLoading && (
              <p className="text-slate-300 text-sm">Loading clients...</p>
            )}
            {userError && (
              <p className="text-red-400 text-sm">{userError}</p>
            )}

            {!userLoading && !userError && users.length === 0 && (
              <p className="text-slate-300 text-sm">
                No clients found. Use &quot;Add Client&quot; to create one.
              </p>
            )}

            {!userLoading && !userError && users.length > 0 && (
              <div className="overflow-x-auto mt-2">
                <table className="min-w-full text-sm text-left text-slate-100">
                  <thead>
                    <tr className="bg-gray-800">
                      <th className="px-3 py-2 border-b border-gray-700">
                        ID
                      </th>
                      <th className="px-3 py-2 border-b border-gray-700">
                        Name
                      </th>
                      <th className="px-3 py-2 border-b border-gray-700">
                        Email
                      </th>
                      <th className="px-3 py-2 border-b border-gray-700">
                        Temp Password
                      </th>
                      <th className="px-3 py-2 border-b border-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.customerId} className="hover:bg-gray-800">
                        <td className="px-3 py-2 border-b border-gray-800">
                          {u.clientCode}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-800">
                          {`${u.firstName} ${
                            u.middleName ? u.middleName + " " : ""
                          }${u.lastName}`}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-800">
                          {u.email}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-800 font-mono">
                          {u.tempPassword}
                        </td>
                        <td className="px-3 py-2 border-b border-gray-800">
                          <button
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700 mr-2"
                            onClick={() => handleDeleteUser(u.customerId)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Assignment: Client ↔ Consultant */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <form
              onSubmit={handleAssignConsultant}
              className="bg-gray-800 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold">
                Assign Consultant to Client
              </h3>
              <div className="flex flex-col gap-2">
                <select
                  className="bg-gray-900 rounded px-3 py-2 text-sm text-white border border-gray-700"
                  value={assignClientIdForConsultant}
                  onChange={(e) =>
                    setAssignClientIdForConsultant(e.target.value)
                  }
                >
                  <option value="">Select client...</option>
                  {users.map((u) => (
                    <option key={u.customerId} value={u.customerId}>
                      {u.clientCode} – {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>

                <select
                  className="bg-gray-900 rounded px-3 py-2 text-sm text-white border border-gray-700"
                  value={assignConsultantId}
                  onChange={(e) => setAssignConsultantId(e.target.value)}
                >
                  <option value="">Select consultant...</option>
                  {consultants.map((c) => (
                    <option key={c.consultantId} value={c.consultantId}>
                      {c.consultantCode} – {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="mt-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
              >
                Assign Consultant
              </button>
            </form>

            {/* Assignment: Project → Client (+ optional consultant) */}
            <form
              onSubmit={handleAssignProject}
              className="bg-gray-800 rounded-xl p-4 space-y-3"
            >
              <h3 className="text-sm font-semibold">
                Assign Project to Client
              </h3>
              <div className="flex flex-col gap-2">
                <select
                  className="bg-gray-900 rounded px-3 py-2 text-sm text-white border border-gray-700"
                  value={assignClientIdForProject}
                  onChange={(e) =>
                    setAssignClientIdForProject(e.target.value)
                  }
                >
                  <option value="">Select client...</option>
                  {users.map((u) => (
                    <option key={u.customerId} value={u.customerId}>
                      {u.clientCode} – {u.firstName} {u.lastName}
                    </option>
                  ))}
                </select>

                <select
                  className="bg-gray-900 rounded px-3 py-2 text-sm text-white border border-gray-700"
                  value={assignProjectId}
                  onChange={(e) => setAssignProjectId(e.target.value)}
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.projectId} value={p.projectId}>
                      {p.projectCode} – {p.projectName}
                    </option>
                  ))}
                </select>

                <select
                  className="bg-gray-900 rounded px-3 py-2 text-sm text-white border border-gray-700"
                  value={assignProjectConsultantId}
                  onChange={(e) =>
                    setAssignProjectConsultantId(e.target.value)
                  }
                >
                  <option value="">(Optional) Assign consultant...</option>
                  {consultants.map((c) => (
                    <option key={c.consultantId} value={c.consultantId}>
                      {c.consultantCode} – {c.firstName} {c.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="mt-1 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
              >
                Assign Project
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderProjects = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-slate-300">
            Create new projects and manage existing ones.
          </p>
        </div>
        <button
          onClick={fetchProjects}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleCreateProject}
        className="bg-gray-800 rounded-xl p-4 space-y-3 max-w-xl"
      >
        <h2 className="text-lg font-semibold mb-1">Add Project</h2>
        <div className="flex flex-col gap-2">
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Project name (required)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Client name (optional)"
            value={projectClientName}
            onChange={(e) => setProjectClientName(e.target.value)}
          />
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Status (e.g., Planned, In Progress, Complete)"
            value={projectStatus}
            onChange={(e) => setProjectStatus(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
        >
          Save Project
        </button>
        {projectsError && (
          <p className="text-xs text-red-400 mt-2">{projectsError}</p>
        )}
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Existing Projects</h2>
        {projectsLoading && (
          <p className="text-slate-300 text-sm">Loading projects...</p>
        )}
        {!projectsLoading && projects.length === 0 && (
          <p className="text-slate-300 text-sm">
            No projects found. Use the form above to create one.
          </p>
        )}
        {!projectsLoading && projects.length > 0 && (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm text-left text-slate-100">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-3 py-2 border-b border-gray-700">ID</th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Project
                  </th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Client
                  </th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Status
                  </th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.projectId} className="hover:bg-gray-800">
                    <td className="px-3 py-2 border-b border-gray-800">
                      {p.projectCode}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {p.projectName}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {p.clientName}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {p.status}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      <button
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteProject(p.projectId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderConsultants = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold">Consultants</h1>
          <p className="text-sm text-slate-300">
            Add consultants and manage their details.
          </p>
        </div>
        <button
          onClick={fetchConsultants}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white"
        >
          Refresh
        </button>
      </div>

      <form
        onSubmit={handleCreateConsultant}
        className="bg-gray-800 rounded-xl p-4 space-y-3 max-w-xl"
      >
        <h2 className="text-lg font-semibold mb-1">Add Consultant</h2>
        <div className="flex flex-col gap-2">
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="First name (required)"
            value={consFirstName}
            onChange={(e) => setConsFirstName(e.target.value)}
          />
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Last name (required)"
            value={consLastName}
            onChange={(e) => setConsLastName(e.target.value)}
          />
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Email (required)"
            value={consEmail}
            onChange={(e) => setConsEmail(e.target.value)}
          />
          <input
            className="bg-gray-900 rounded px-3 py-2 text-sm text-white outline-none border border-gray-700"
            placeholder="Role (e.g., PM, Developer, Analyst)"
            value={consRole}
            onChange={(e) => setConsRole(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="mt-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
        >
          Save Consultant
        </button>
        {consultantsError && (
          <p className="text-xs text-red-400 mt-2">{consultantsError}</p>
        )}
      </form>

      <div>
        <h2 className="text-lg font-semibold mb-2">Existing Consultants</h2>
        {consultantsLoading && (
          <p className="text-slate-300 text-sm">Loading consultants...</p>
        )}
        {!consultantsLoading && consultants.length === 0 && (
          <p className="text-slate-300 text-sm">
            No consultants found. Use the form above to create one.
          </p>
        )}
        {!consultantsLoading && consultants.length > 0 && (
          <div className="overflow-x-auto mt-2">
            <table className="min-w-full text-sm text-left text-slate-100">
              <thead>
                <tr className="bg-gray-800">
                  <th className="px-3 py-2 border-b border-gray-700">ID</th>
                  <th className="px-3 py-2 border-b border-gray-700">Name</th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Email
                  </th>
                  <th className="px-3 py-2 border-b border-gray-700">Role</th>
                  <th className="px-3 py-2 border-b border-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {consultants.map((c) => (
                  <tr key={c.consultantId} className="hover:bg-gray-800">
                    <td className="px-3 py-2 border-b border-gray-800">
                      {c.consultantCode}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {c.firstName} {c.lastName}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {c.email}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      {c.role}
                    </td>
                    <td className="px-3 py-2 border-b border-gray-800">
                      <button
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-700"
                        onClick={() => handleDeleteConsultant(c.consultantId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold mb-2">Settings</h1>
      <p className="text-sm text-slate-300">
        Future sprint: global admin settings for Timely (roles, access control,
        notification preferences, etc.).
      </p>
    </div>
  );

  // ---- Main render ----
  return (
    <div className="bg-gray-900 min-h-screen text-white flex">
      {/* inner admin sidebar */}
      <aside className="w-64 bg-gray-950 border-r border-gray-800 p-4">
        <h2 className="text-lg font-semibold mb-4">Admin Panel</h2>
        <nav className="space-y-1 text-sm">
          <button
            className={`w-full text-left px-3 py-2 rounded-lg ${
              section === "home" ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
            onClick={() => setSection("home")}
          >
            Home
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg ${
              section === "projects" ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
            onClick={() => setSection("projects")}
          >
            Projects
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg ${
              section === "consultants" ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
            onClick={() => setSection("consultants")}
          >
            Consultants
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg ${
              section === "clients" ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
            onClick={() => setSection("clients")}
          >
            Clients
          </button>
          <button
            className={`w-full text-left px-3 py-2 rounded-lg ${
              section === "settings" ? "bg-blue-600" : "hover:bg-gray-800"
            }`}
            onClick={() => setSection("settings")}
          >
            Settings
          </button>
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        {section === "home" && renderHome()}
        {section === "clients" && renderClients()}
        {section === "projects" && renderProjects()}
        {section === "consultants" && renderConsultants()}
        {section === "settings" && renderSettings()}
      </main>
    </div>
  );
};

export default AdminTab;
