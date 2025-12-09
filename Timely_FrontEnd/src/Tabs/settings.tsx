import React, { useEffect, useState } from "react";
import { useTheme } from "../Views_Layouts/ThemeContext";
import {
  User,
  Shield,
  Lock,
  Bell,
  Trash2,
  Info,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  X,
  FileText,
} from "lucide-react";

type UserRole = "admin" | "consultant" | "client";

type StoredUser = {
  customerId: string;
  email: string;
  name: string;
  role?: string;
};

type ToastType = "success" | "error" | "info";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type UploadedDoc = {
  id: string;
  name: string;
  size: number;
  uploadedAt: string;
};

const SettingsPage: React.FC = () => {
  const { isDark } = useTheme();

  // --- THEME STYLES ---
  const s = {
    bg: isDark ? "bg-slate-950" : "bg-slate-50",
    text: isDark ? "text-slate-50" : "text-slate-900",
    textMuted: isDark ? "text-slate-400" : "text-slate-600",
    textSubtle: isDark ? "text-slate-500" : "text-slate-400",
    card: isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
    input:
      (isDark
        ? "bg-slate-900 border-slate-700 text-slate-50"
        : "bg-white border-slate-300 text-slate-900") +
      " focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
    pill: isDark ? "bg-slate-800 text-slate-200" : "bg-slate-100 text-slate-700",
    pillActive: isDark ? "bg-blue-600 text-white" : "bg-blue-600 text-white",
    dangerBg: isDark ? "bg-red-500/10" : "bg-red-50",
    dangerBorder: isDark ? "border-red-500/50" : "border-red-200",
    dangerText: "text-red-600",
    btnPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    btnSubtle: isDark
      ? "bg-slate-800 hover:bg-slate-700 text-slate-100"
      : "bg-slate-100 hover:bg-slate-200 text-slate-800",
    sectionLabel: isDark ? "text-slate-300" : "text-slate-700",
  };

  // --- USER / ROLE ---
  const [userRole, setUserRole] = useState<UserRole>("client");
  const [userName, setUserName] = useState<string>("User");
  const [userEmail, setUserEmail] = useState<string>("user@example.com");
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("timely_user");
      if (stored) {
        const parsed: StoredUser = JSON.parse(stored);
        const role = (parsed.role || "client").toLowerCase() as UserRole;
        setUserRole(role === "admin" || role === "consultant" || role === "client" ? role : "client");
        setUserName(parsed.name || "User");
        setUserEmail(parsed.email || "user@example.com");
        setCustomerId(parsed.customerId || null);
      }
    } catch {
      // fall back to defaults
    }
  }, []);

  const isAdmin = userRole === "admin";
  const isConsultant = userRole === "consultant";
  const isClient = userRole === "client";

  // --- SECTIONS ---
  type SectionKey =
    | "profile"
    | "security"
    | "notifications"
    | "documents"
    | "my-consultant"
    | "account";

  const [activeSection, setActiveSection] = useState<SectionKey>("profile");

  const availableSections: {
    id: SectionKey;
    label: string;
    icon: React.ReactNode;
    visible: boolean;
  }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" />, visible: true },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" />, visible: true },
    {
      id: "notifications",
      label: "Preferences",
      icon: <Bell className="w-4 h-4" />,
      visible: true, // all roles can toggle notifications per PDF
    },
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="w-4 h-4" />,
      visible: true, // uploads for everyone; semantics differ by role
    },
    {
      id: "my-consultant",
      label: "My Consultant",
      icon: <Info className="w-4 h-4" />,
      visible: isClient, // ONLY client sees this, per PDF: "their consultant info"
    },
    {
      id: "account",
      label: "Account Management",
      icon: <Trash2 className="w-4 h-4" />,
      visible: true, // all roles can manage/delete their account; copy changes per role
    },
  ];

  // --- TOASTS ---
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const ToastIcon: React.FC<{ type: ToastType }> = ({ type }) => {
    if (type === "success") {
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    }
    if (type === "error") {
      return <X className="w-4 h-4 text-red-500" />;
    }
    return <Info className="w-4 h-4 text-blue-500" />;
  };

  // --- PROFILE FORM ---
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    photoUrl: "",
    calendarLink: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const [firstName, ...rest] = userName.split(" ");
    setProfile((prev) => ({
      ...prev,
      firstName: firstName || prev.firstName,
      lastName: rest.join(" ") || prev.lastName,
    }));
  }, [userName]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      // TODO: Call backend endpoint when available
      showToast("Profile updated successfully.", "success");
    } catch (err) {
      showToast("Could not save profile. Please try again.", "error");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // --- SECURITY (CHANGE PASSWORD) ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      showToast("Please enter and confirm your new password.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New password and confirmation do not match.", "error");
      return;
    }
    setIsChangingPassword(true);
    try {
      // TODO: replace with real API when wired
      showToast("Password updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      showToast("Failed to update password. Please try again.", "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // --- NOTIFICATIONS / PREFERENCES ---
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    // could persist to localStorage or backend if needed
    showToast("Notification preferences saved.", "success");
  };

  // --- DOCUMENTS / UPLOADS ---
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);

  const docsStorageKey =
    "timely_documents_" + (customerId || userEmail || "anonymous");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(docsStorageKey);
      if (stored) {
        setUploadedDocs(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docsStorageKey]);

  const persistDocs = (docs: UploadedDoc[]) => {
    setUploadedDocs(docs);
    try {
      localStorage.setItem(docsStorageKey, JSON.stringify(docs));
    } catch {
      // ignore
    }
  };

  const handleDocumentsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newDocs: UploadedDoc[] = [];
    const now = new Date().toISOString();
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      newDocs.push({
        id: `${now}_${f.name}_${i}`,
        name: f.name,
        size: f.size,
        uploadedAt: now,
      });
    }
    const all = [...uploadedDocs, ...newDocs];
    persistDocs(all);
    showToast("Document list updated (demo only – not sent to server).", "success");
  };

  const handleRemoveDoc = (id: string) => {
    const filtered = uploadedDocs.filter((d) => d.id !== id);
    persistDocs(filtered);
  };

  // --- MY CONSULTANT (CLIENT ONLY) ---
  const [assignedConsultant, setAssignedConsultant] = useState<{
    name: string;
    email: string;
    phone?: string;
    calendarLink?: string;
  } | null>(null);

  useEffect(() => {
    if (!isClient || !customerId) return;
    const stored = localStorage.getItem("timely_my_consultant");
    if (stored) {
      try {
        setAssignedConsultant(JSON.parse(stored));
      } catch {
        setAssignedConsultant(null);
      }
    } else {
      setAssignedConsultant(null);
    }
  }, [isClient, customerId]);

  // --- ACCOUNT MANAGEMENT (DELETE ACCOUNT) ---
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      showToast('Type "DELETE" to confirm account deletion.', "error");
      return;
    }
    setIsDeletingAccount(true);
    try {
      // TODO: real backend call, e.g. DELETE /api/users/:id
      showToast("Account deleted (demo only – implement backend!).", "success");
      // In real app, we would also log the user out here.
    } catch {
      showToast("Could not delete account. Please try again.", "error");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // --- RENDER HELPERS ---
  const SectionPill: React.FC<{
    sec: SectionKey;
    label: string;
    icon: React.ReactNode;
  }> = ({ sec, label, icon }) => {
    const active = activeSection === sec;
    const base =
      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer transition-colors";
    return (
      <button
        type="button"
        onClick={() => setActiveSection(sec)}
        className={`${base} ${active ? s.pillActive : s.pill}`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  const renderProfileSection = () => (
    <div className={`border rounded-2xl p-6 ${s.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold">
          {userName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${s.text}`}>Profile</h2>
          <p className={s.textMuted}>
            Manage your personal details
            {isConsultant && " and public consultant info"}.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleProfileSave}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            First Name
          </label>
          <input
            className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
            value={profile.firstName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, firstName: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Last Name
          </label>
          <input
            className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
            value={profile.lastName}
            onChange={(e) =>
              setProfile((p) => ({ ...p, lastName: e.target.value }))
            }
          />
        </div>
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Email
          </label>
          <div className="flex items-center gap-2">
            <Mail className={`w-4 h-4 ${s.textSubtle}`} />
            <input
              className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
              value={userEmail}
              onChange={(e) => setUserEmail(e.target.value)}
            />
          </div>
          <p className={`mt-1 text-xs ${s.textSubtle}`}>
            Clients are allowed to change email/phone per PDF.
          </p>
        </div>
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Phone
          </label>
          <div className="flex items-center gap-2">
            <Phone className={`w-4 h-4 ${s.textSubtle}`} />
            <input
              className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
              value={profile.phone}
              onChange={(e) =>
                setProfile((p) => ({ ...p, phone: e.target.value }))
              }
            />
          </div>
        </div>

        {(isConsultant || isAdmin) && (
          <>
            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
              >
                Profile Photo URL
              </label>
              <input
                className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
                value={profile.photoUrl}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, photoUrl: e.target.value }))
                }
              />
              <p className={`mt-1 text-xs ${s.textSubtle}`}>
                Consultants can manage their public profile photo.
              </p>
            </div>
            <div>
              <label
                className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
              >
                Calendar Link
              </label>
              <div className="flex items-center gap-2">
                <Calendar className={`w-4 h-4 ${s.textSubtle}`} />
                <input
                  className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
                  value={profile.calendarLink}
                  onChange={(e) =>
                    setProfile((p) => ({ ...p, calendarLink: e.target.value }))
                  }
                />
              </div>
              <p className={`mt-1 text-xs ${s.textSubtle}`}>
                Consultants can share a booking link for meetings.
              </p>
            </div>
          </>
        )}

        <div className="md:col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg text-sm font-medium ${s.btnPrimary}`}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );

  const renderSecuritySection = () => (
    <div className={`border rounded-2xl p-6 ${s.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${s.text}`}>Security</h2>
          <p className={s.textMuted}>
            Change your password after login (required by PDF).
          </p>
        </div>
      </div>

      <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Current Password
          </label>
          <input
            type="password"
            className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            New Password
          </label>
          <input
            type="password"
            className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Confirm New Password
          </label>
          <input
            type="password"
            className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className={`px-4 py-2 rounded-lg text-sm font-medium ${s.btnPrimary}`}
          disabled={isChangingPassword}
        >
          {isChangingPassword ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className={`border rounded-2xl p-6 ${s.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <Bell className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${s.text}`}>Preferences</h2>
          <p className={s.textMuted}>
            Enable or disable how Timely contacts you.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveNotifications} className="space-y-4 max-w-md">
        <label className="flex items-center justify-between gap-3">
          <div>
            <p className={s.text}>Email notifications</p>
            <p className={`text-xs ${s.textSubtle}`}>
              Receive updates and alerts via email.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEmailNotifications((v) => !v)}
            className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
              emailNotifications ? "bg-blue-600" : "bg-slate-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                emailNotifications ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <label className="flex items-center justify-between gap-3">
          <div>
            <p className={s.text}>SMS notifications</p>
            <p className={`text-xs ${s.textSubtle}`}>
              Send reminders and alerts to your phone.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSmsNotifications((v) => !v)}
            className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors ${
              smsNotifications ? "bg-blue-600" : "bg-slate-500/40"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                smsNotifications ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </label>

        <button
          type="submit"
          className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium ${s.btnPrimary}`}
        >
          Save Preferences
        </button>
      </form>
    </div>
  );

  const renderDocumentsSection = () => (
    <div className={`border rounded-2xl p-6 ${s.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${s.text}`}>Documents</h2>
          <p className={s.textMuted}>
            {isClient
              ? "Upload requested documents for your consultant (contracts, IDs, etc.)."
              : "Keep track of documents you’ve shared with clients or internally."}
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-xl">
        <div>
          <label
            className={`block text-xs font-semibold uppercase mb-1 ${s.sectionLabel}`}
          >
            Upload files
          </label>
          <input
            type="file"
            multiple
            onChange={handleDocumentsUpload}
            className="block w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
          <p className={`mt-1 text-xs ${s.textSubtle}`}>
            This stores a list of files in your browser only (demo). Backend
            upload can be wired later.
          </p>
        </div>

        <div className="border rounded-xl p-4">
          {uploadedDocs.length === 0 ? (
            <p className={s.textMuted}>No documents tracked yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {uploadedDocs.map((doc) => (
                <li
                  key={doc.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div>
                    <p className={s.text}>{doc.name}</p>
                    <p className={`text-xs ${s.textSubtle}`}>
                      {Math.round(doc.size / 1024)} KB •{" "}
                      {new Date(doc.uploadedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoc(doc.id)}
                    className={`text-xs ${s.textSubtle} hover:text-red-500`}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  const renderMyConsultantSection = () => (
    <div className={`border rounded-2xl p-6 ${s.card}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
          <User className="w-5 h-5" />
        </div>
        <div>
          <h2 className={`text-xl font-semibold ${s.text}`}>My Consultant</h2>
          <p className={s.textMuted}>
            View information about the consultant assigned to your request.
          </p>
        </div>
      </div>

      {assignedConsultant ? (
        <div className="space-y-3">
          <div>
            <p className={`text-sm font-semibold ${s.text}`}>
              {assignedConsultant.name}
            </p>
            <p className={`text-xs ${s.textSubtle}`}>Primary contact</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Mail className={`w-4 h-4 ${s.textSubtle}`} />
            <span className={s.text}>{assignedConsultant.email}</span>
          </div>
          {assignedConsultant.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className={`w-4 h-4 ${s.textSubtle}`} />
              <span className={s.text}>{assignedConsultant.phone}</span>
            </div>
          )}
          {assignedConsultant.calendarLink && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className={`w-4 h-4 ${s.textSubtle}`} />
              <a
                href={assignedConsultant.calendarLink}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-500 hover:underline"
              >
                Schedule a meeting
              </a>
            </div>
          )}
          <p className={`mt-4 text-xs ${s.textSubtle}`}>
            This section matches the PDF requirement that the client can see
            their consultant info.
          </p>
        </div>
      ) : (
        <div className="border border-dashed rounded-xl p-4 text-center">
          <p className={s.textMuted}>
            No consultant is currently linked to your account in this demo.
          </p>
          <p className={`mt-1 text-xs ${s.textSubtle}`}>
            Once your account is assigned to a consultant, their details will
            appear here.
          </p>
        </div>
      )}
    </div>
  );

  const renderAccountSection = () => {
    const roleLabel =
      userRole === "admin"
        ? "Admin"
        : userRole === "consultant"
        ? "Consultant"
        : "Client";

    const description =
      userRole === "admin"
        ? "Admin controls everything. Deleting your own admin account should only be done in exceptional cases."
        : userRole === "consultant"
        ? "As a consultant, you can remove your own access to Timely if you leave the team."
        : "Deleting your account will remove your access. Your projects and documents remain linked to the admin.";

    return (
      <div className={`border rounded-2xl p-6 ${s.card}`}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl ${s.dangerBg} flex items-center justify-center`}
          >
            <Trash2 className={`w-5 h-5 ${s.dangerText}`} />
          </div>
          <div>
            <h2 className={`text-xl font-semibold ${s.text}`}>
              Account Management
            </h2>
            <p className={s.textMuted}>{description}</p>
          </div>
        </div>

        <div className={`border rounded-xl p-4 ${s.dangerBg} ${s.dangerBorder}`}>
          <p className={`font-semibold mb-2 ${s.dangerText}`}>
            Delete My {roleLabel} Account
          </p>
          <p className={`${s.textSubtle} text-sm mb-4`}>
            This is primarily for demonstration. In a real deployment, admins
            might manage other users’ accounts from the Admin section.
          </p>
          <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md">
            <p className={`${s.textSubtle} text-xs`}>
              Type <span className="font-mono font-semibold">DELETE</span> to
              confirm.
            </p>
            <input
              className={`w-full px-3 py-2 rounded-lg border ${s.input}`}
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
            />
            <button
              type="submit"
              disabled={isDeletingAccount}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${s.dangerText} border border-red-500 hover:bg-red-500 hover:text-white transition-colors disabled:opacity-50`}
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </form>
        </div>
      </div>
    );
  };

  const renderActiveSection = () => {
    if (activeSection === "profile") return renderProfileSection();
    if (activeSection === "security") return renderSecuritySection();
    if (activeSection === "notifications") return renderNotificationsSection();
    if (activeSection === "documents") return renderDocumentsSection();
    if (activeSection === "my-consultant" && isClient)
      return renderMyConsultantSection();
    if (activeSection === "account") return renderAccountSection();
    // fallback
    return renderProfileSection();
  };

  return (
    <div className={`${s.bg} min-h-screen`}>
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${s.card}`}
          >
            <ToastIcon type={t.type} />
            <span className={s.text}>{t.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className={s.textSubtle}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${s.text}`}>Settings</h1>
          <p className={s.textMuted}>
            Manage your account. Options change depending on whether you are an
            admin, consultant, or client as defined in the System Roles PDF.
          </p>
        </div>

        {/* Tabs / Pills */}
        <div className="flex flex-wrap gap-3 mb-6">
          {availableSections
            .filter((sec) => sec.visible)
            .map((sec) => (
              <SectionPill
                key={sec.id}
                sec={sec.id}
                label={sec.label}
                icon={sec.icon}
              />
            ))}
        </div>

        {/* Active Section */}
        {renderActiveSection()}
      </div>
    </div>
  );
};

export default SettingsPage;
