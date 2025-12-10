import React, { useState } from "react";
import Navbar from "../Style_Components/Navbar";
import Sidebar from "../Style_Components/Sidebar";
import Dashboard from "../Style_Components/Dashboard";

import Clients from "../Tabs/clients";
import Consultants from "../Tabs/consultants";
import Projects from "../Tabs/projects";
import Reports from "../Tabs/reports";
import Hours from "../Tabs/hours";
import Settings from "../Tabs/settings";

const ConsultantPortal = ({ user }: { user: any }) => {
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarToggle, setSidebarToggle] = useState(false);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard sidebarToggle={false} onNavigate={setActivePage} />;
      case "client":
        return <Clients />;
      case "consultants":
        return <Consultants />;
      case "projects":
        return <Projects />;
      case "reports":
        return <Reports />;
      case "hours":
        return <Hours />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard sidebarToggle={false} onNavigate={setActivePage} />;
    }
  };

  return (
    <>
      {/* TODO: Replace tab content with DB-powered pages:
          - Clients, Projects, Hours, Reports, Settings
          Ensure consultant can only see relevant scoped data */}
      <Sidebar
        sidebarToggle={false}
        onNavigate={setActivePage}
        isAdmin={false}
        activePage={activePage}
        userName={user.name}
        userEmail={user.email}
        userRole={user.role}
      />
        <Navbar
          onNavigate={setActivePage}
          activePage={activePage}
          sidebarToggle={sidebarToggle}
          setSidebarToggle={setSidebarToggle}
        />
        
        <main className="p-6">{renderPage()}</main>
      </>
    );
  };

export default ConsultantPortal;