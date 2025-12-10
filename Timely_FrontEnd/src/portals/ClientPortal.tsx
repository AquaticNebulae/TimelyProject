import React, { useState } from "react";
import Settings from "../Tabs/settings";
import Hours from "../Tabs/hours";


const ClientPortal = ({ user }: { user: any }) => {
  const [activePage, setActivePage] = useState("settings");

  const renderPage = () => {
    switch (activePage) {
      case "settings":
        return <Settings />;
      case "hours":
        return <Hours />;
      default:
        return <Settings />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      {/* TODO: Replace Hours and Settings views with client-specific DB data:
          - Hours tracked
          - Assigned consultant
          - Uploads/documents from cloud storage */}
      <div className="mb-4 flex justify-between">
        <h1 className="text-2xl font-semibold">Client Portal</h1>
        <div className="space-x-2">
          <button
            onClick={() => setActivePage("settings")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "settings"
                ? "bg-blue-600 text-white"
                : "bg-slate-800"
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActivePage("hours")}
            className={`px-4 py-2 rounded-lg ${
              activePage === "hours"
                ? "bg-blue-600 text-white"
                : "bg-slate-800"
            }`}
          >
            Hours
          </button>
        </div>
      </div>
      {renderPage()}
    </div>
  );
};

export default ClientPortal;
