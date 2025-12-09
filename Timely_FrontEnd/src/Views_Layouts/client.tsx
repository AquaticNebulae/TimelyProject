// src/Views_Layouts/client.tsx
import React from "react";
import { useTheme } from "./ThemeContext";
import {
  FolderOpen,
  Clock,
  MessageCircle,
  LogOut,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

type ClientHomeProps = {
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
};

const ClientsHomePage: React.FC<ClientHomeProps> = ({
  userName = "Client",
  userEmail = "",
  onLogout,
}) => {
  const { isDark } = useTheme();

  const bg = isDark ? "bg-slate-950" : "bg-slate-100";
  const card = isDark ? "bg-slate-900 border-slate-700" : "bg-white border-gray-200";
  const text = isDark ? "text-white" : "text-gray-900";
  const muted = isDark ? "text-slate-400" : "text-gray-600";

  const firstName = userName.split(" ")[0] || "Client";

  return (
    <div className={`min-h-screen ${bg} flex flex-col`}>
      {/* Simple top bar just for client */}
      <header
        className={`w-full border-b ${
          isDark ? "border-slate-800 bg-slate-900" : "border-gray-200 bg-white"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-semibold ${
                isDark ? "bg-blue-600" : "bg-blue-500"
              }`}
            >
              T
            </div>
            <div>
              <p className={`font-semibold ${text}`}>Timely Client Portal</p>
              <p className={`text-xs ${muted}`}>{userEmail}</p>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main body */}
      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
          {/* Welcome */}
          <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${text}`}>
                Welcome back, {firstName} 👋
              </h1>
              <p className={`mt-2 text-sm ${muted}`}>
                This is your client view. Here you can see an overview of your
                projects, hours and status updates shared by your consultant.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {/* Projects Summary */}
            <div className={`${card} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                  <p className={`text-sm font-semibold ${text}`}>Projects</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                  Read-only
                </span>
              </div>
              <p className={`text-xs ${muted}`}>
                You can review your current and past projects in the Projects
                section (read-only). Contact your consultant if something looks
                wrong.
              </p>
            </div>

            {/* Hours */}
            <div className={`${card} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-500" />
                  <p className={`text-sm font-semibold ${text}`}>Logged Hours</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className={`text-xs ${muted}`}>
                Your consultant logs time spent on your projects. You can ask them
                for a summary report at any time.
              </p>
            </div>

            {/* Messages */}
            <div className={`${card} border rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-purple-500" />
                  <p className={`text-sm font-semibold ${text}`}>Communication</p>
                </div>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <p className={`text-xs ${muted}`}>
                For any changes or questions, please email or call your consultant.
                The Timely portal is currently view-only for clients.
              </p>
            </div>
          </section>

          {/* Placeholder info / instructions */}
          <section className={`${card} border rounded-xl p-4`}>
            <h2 className={`text-base font-semibold mb-2 ${text}`}>
              What can I do in this portal?
            </h2>
            <ul className={`text-xs list-disc pl-5 space-y-1 ${muted}`}>
              <li>Review the status of your projects with Timely.</li>
              <li>
                Confirm that logged hours and timelines match what you discussed
                with your consultant.
              </li>
              <li>
                Contact your consultant using your usual communication channels for
                any changes or approvals.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ClientsHomePage;
