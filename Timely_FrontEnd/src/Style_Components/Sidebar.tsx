import React from "react";

type SidebarProps = {
  sidebarToggle: boolean;
  onNavigate: (page: string) => void;
  isAdmin: boolean;
  activePage: string;
  userName: string;
  userEmail: string;
  userRole: string;
};

const Sidebar = ({
  sidebarToggle,
  onNavigate,
  isAdmin,
  activePage,
  userName,
  userEmail,
  userRole,
}: SidebarProps) => {
  return (
    <aside className="fixed h-screen w-64 bg-slate-800 text-white p-4">
      <h2 className="text-lg font-semibold mb-2">{userName}</h2>
      <p className="text-sm mb-4">{userEmail} ({userRole})</p>
      <nav className="flex flex-col space-y-2">
        <button onClick={() => onNavigate("dashboard")}>Dashboard</button>
        <button onClick={() => onNavigate("client")}>Clients</button>
        <button onClick={() => onNavigate("projects")}>Projects</button>
        <button onClick={() => onNavigate("hours")}>Hours</button>
        <button onClick={() => onNavigate("reports")}>Reports</button>
        <button onClick={() => onNavigate("settings")}>Settings</button>
        {isAdmin && (
          <>
            <button onClick={() => onNavigate("consultants")}>Consultants</button>
            <button onClick={() => onNavigate("admin")}>Admin</button>
            <button onClick={() => onNavigate("EmailGenerator")}>Email Generator</button>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
