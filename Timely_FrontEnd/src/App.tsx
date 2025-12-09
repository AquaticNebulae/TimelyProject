// src/App.tsx
import React, { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./Views_Layouts/ThemeContext";
import SidebarLayout from "./Style_Components/Sidebar";
import Navbar from "./Style_Components/Navbar";
import Dashboard from "./Style_Components/Dashboard";
import ClientsHomePage from "./Views_Layouts/client";
import Login from "./Style_Components/Login";
import AdminTab from "./Tabs/admin";
import ReportsTab from "./Tabs/reports";
import EmailGenerator from "./Views_Layouts/EmailGenerator";
import RealEstateProjects from "./Tabs/projects";
import ClientsPage from "./Tabs/clients";
import ConsultantsPage from "./Tabs/consultants";
import HoursPage from "./Tabs/hours";
import SettingsPage from "./Tabs/settings";

type UserRole = "admin" | "consultant" | "client";

type UserInfo = {
  customerId: string;
  email: string;
  name: string;
  role?: UserRole;
};

const normalizeRole = (role?: string): UserRole => {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "admin";
  if (r === "consultant") return "consultant";
  return "client";
};

function AppContent() {
  const { isDark } = useTheme();

  const [sidebarToggle, setSidebarToggle] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activePage, setActivePage] = useState("dashboard");
  const [pageHistory, setPageHistory] = useState<string[]>(["dashboard"]);
  const [userData, setUserData] = useState<UserInfo | null>(null);

  const currentRole: UserRole | undefined = userData?.role;
  const isAdmin = currentRole === "admin";
  const isConsultant = currentRole === "consultant";
  const isClient = currentRole === "client";
  const isStaff = isAdmin || isConsultant;

  // 1) Restore auth from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("timely_user");
    const authenticated = localStorage.getItem("timely_authenticated");

    if (storedUser && authenticated === "true") {
      try {
        const parsed = JSON.parse(storedUser) as {
          customerId: string;
          email: string;
          name: string;
          role?: string;
        };

        const normalizedUser: UserInfo = {
          customerId: parsed.customerId,
          email: parsed.email,
          name: parsed.name,
          role: normalizeRole(parsed.role),
        };

        setUserData(normalizedUser);
        setIsAuthed(true);
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }

    setIsLoading(false);
  }, []);

  // 2) Called by Login.tsx after successful login
  const handleLoginSuccess = (user: {
    customerId: string;
    email: string;
    name: string;
    role?: string;
  }) => {
    const normalizedUser: UserInfo = {
      customerId: user.customerId,
      email: user.email,
      name: user.name,
      role: normalizeRole(user.role),
    };

    setUserData(normalizedUser);
    setIsAuthed(true);
    localStorage.setItem("timely_user", JSON.stringify(normalizedUser));
    localStorage.setItem("timely_authenticated", "true");

    // Decide initial landing page based on role
    if (normalizedUser.role === "client") {
      setActivePage("client_home");
      setPageHistory(["client_home"]);
    } else {
      setActivePage("dashboard");
      setPageHistory(["dashboard"]);
    }
  };

  // 3) Logout
  const handleLogout = () => {
    setIsAuthed(false);
    setUserData(null);
    setActivePage("dashboard");
    setPageHistory(["dashboard"]);
    localStorage.removeItem("timely_user");
    localStorage.removeItem("timely_authenticated");
  };

  // 4) Guarded navigation (used by sidebar & navbar)
  const handleNavigation = (page: string) => {
    // Special: logout item in sidebar
    if (page === "logout") {
      handleLogout();
      return;
    }

    // Admin-only pages
    const adminOnlyPages = new Set(["admin", "EmailGenerator"]);
    if (adminOnlyPages.has(page) && !isAdmin) {
      return;
    }

    // Staff-only pages (projects, clients tab, consultants tab, reports, hours, settings, dashboard)
    const staffOnlyPages = new Set([
      "dashboard",
      "projects",
      "client",
      "consultants",
      "reports",
      "hours",
      "settings",
    ]);

    if (staffOnlyPages.has(page) && !isStaff) {
      // Clients can't navigate into staff layout
      return;
    }

    // Client-only page from here is just "client_home"
    if (page === "client_home" && !isClient) {
      return;
    }

    setActivePage(page);
    setPageHistory((prev) => [...prev, page]);
  };

  // 5) Back button in sidebar
  const handleBack = () => {
    setPageHistory((prev) => {
      if (prev.length <= 1) return prev;
      const newHistory = [...prev];
      newHistory.pop();
      const previousPage = newHistory[newHistory.length - 1] || "dashboard";
      setActivePage(previousPage);
      return newHistory;
    });
  };

  // 6) Decide what to render when not logged in
  if (!isAuthed) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-slate-950" : "bg-slate-100"
        }`}
      >
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // 7) Role-specific layout
  // Client: their own dedicated portal, no sidebar/navbar
  if (isClient) {
    return (
      <ClientsHomePage
        userName={userData?.name || "Client"}
        userEmail={userData?.email || ""}
        onLogout={handleLogout}
      />
    );
  }

  // Admin / Consultant: full sidebar + navbar layout
  const renderActivePage = () => {
    switch (activePage) {
      case "dashboard":
        return (
          <Dashboard
            sidebarToggle={sidebarToggle}
            setSidebarToggle={setSidebarToggle}
            userName={userData?.name}
            userEmail={userData?.email}
            onNavigate={handleNavigation}
          />
        );
      case "projects":
        return <RealEstateProjects />;
      case "client":
        return <ClientsPage />;
      case "consultants":
        return <ConsultantsPage userRole={currentRole} />;
      case "reports":
        return <ReportsTab />;
      case "hours":
        return <HoursPage />;
      case "admin":
        return <AdminTab />;
      case "EmailGenerator":
        return <EmailGenerator />;
      case "settings":
        return <SettingsPage />;
      default:
        return (
          <Dashboard
            sidebarToggle={sidebarToggle}
            setSidebarToggle={setSidebarToggle}
            userName={userData?.name}
            userEmail={userData?.email}
            onNavigate={handleNavigation}
          />
        );
    }
  };

  return (
    <div
      className={`min-h-screen flex ${
        isDark ? "bg-slate-950 text-white" : "bg-slate-100 text-gray-900"
      }`}
    >
      {/* Sidebar (staff only) */}
      <SidebarLayout
        sidebarToggle={sidebarToggle}
        setSidebarToggle={setSidebarToggle}
        onNavigate={handleNavigation}
        onBack={pageHistory.length > 1 ? handleBack : undefined}
        isAdmin={isAdmin}
        activePage={activePage}
        userName={userData?.name}
        userEmail={userData?.email}
        userRole={currentRole}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-screen ml-0 md:ml-72 transition-all">
        {/* Navbar with search + user menu */}
        <Navbar
          sidebarToggle={sidebarToggle}
          setSidebarToggle={setSidebarToggle}
          onNavigate={handleNavigation}
          activePage={activePage}
          onLogout={handleLogout}
          userRole={currentRole}
          userName={userData?.name}
          userEmail={userData?.email}
        />

        {/* Main page */}
        <main className="flex-1 p-4 md:p-6">{renderActivePage()}</main>
      </div>
    </div>
  );
}

const App: React.FC = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;
