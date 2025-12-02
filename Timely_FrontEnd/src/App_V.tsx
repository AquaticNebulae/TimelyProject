import React, { useState, useEffect } from "react";
import SidebarLayout from "./Style_Components/Sidebar";
import Dashboard from "./Style_Components/Dashboard";
import Login from "./Style_Components/Login";
import AdminTab from "./Tabs/admin";
import ReportsTab from "./Tabs/reports_V";

// 👇 adjust this list to whatever emails should be admins
const ADMIN_EMAILS = ["fryv@timely.com", "mardij@timely.com"];

type UserInfo = {
  customerId: string;
  email: string;
  name: string;
};

export default function App() {
  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [activePage, setActivePage] = useState("dashboard");
  const [userData, setUserData] = useState<UserInfo | null>(null);

  // computed admin flag based on logged-in user's email
  const isAdmin = true; //set true to test admin UI without login. Erase it to see normal user view.
    !!userData &&
    !!userData.email &&
    ADMIN_EMAILS.includes(userData.email.toLowerCase());

  // Check if user is already logged in on mount
  useEffect(() => {
    const user = localStorage.getItem("timely_user");
    const authenticated = localStorage.getItem("timely_authenticated");

    if (user && authenticated === "true") {
      const parsed: UserInfo = JSON.parse(user);
      setUserData(parsed);
      setIsAuthed(true);
    }
  }, []);

  const handleLoginSuccess = (user: UserInfo) => {
    console.log("Login successful:", user);
    // Login.tsx already sets localStorage, but this keeps App state in sync
    setUserData(user);
    setIsAuthed(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("timely_user");
    localStorage.removeItem("timely_authenticated");
    setUserData(null);
    setIsAuthed(false);
    setActivePage("dashboard");
  };

  const handleNavigation = (page: string) => {
    if (page === "logout") {
      handleLogout();
      return;
    }

    // extra safety: ignore Admin nav if this user is not admin
    if (page === "admin" && !isAdmin) {
      return;
    }

    setActivePage(page);
  };

  if (!isAuthed) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex min-h-screen">
      <SidebarLayout
        sidebarToggle={sidebarToggle}
        onNavigate={handleNavigation}
        isAdmin={isAdmin} // 👈 tell sidebar if user is admin
      />

      <div className={`${sidebarToggle ? "" : "ml-64"} w-full`}>
        {/* DASHBOARD */}
        {activePage === "dashboard" && (
          <Dashboard
            sidebarToggle={sidebarToggle}
            setSidebarToggle={setSidebarToggle}
          />
        )}

        {/* PROJECTS */}
        {activePage === "projects" && (
          <div className="p-6 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Projects</h1>
            <p>Projects view coming soon...</p>
          </div>
        )}

        {/* CLIENT */}
        {activePage === "client" && (
          <div className="p-6 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Clients</h1>
            <p>Client view coming soon...</p>
          </div>
        )}

        {/* CONSULTANTS */}
        {activePage === "consultants" && (
          <div className="p-6 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Consultants</h1>
            <p>Consultants view coming soon...</p>
          </div>
        )}

        {/* REPORTS */}
        {activePage === "reports" && <ReportsTab />}

        {/* ADMIN – only reachable if isAdmin is true */}
        {activePage === "admin" && isAdmin && <AdminTab />}

        {/* HOURS */}
        {activePage === "hours" && (
          <div className="p-6 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Hours</h1>
            <p>Hours view coming soon...</p>
          </div>
        )}

        {/* SETTINGS */}
        {activePage === "settings" && (
          <div className="p-6 text-white bg-gray-900 min-h-screen">
            <h1 className="text-2xl font-semibold mb-4">Settings</h1>
            <p>Settings view coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
