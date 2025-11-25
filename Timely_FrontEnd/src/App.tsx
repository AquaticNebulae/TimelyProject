import React, { useState } from "react";
import SidebarLayout from "./Style_Components/Sidebar";
import Dashboard from "./Style_Components/Dashboard";
import Login from "./Style_Components/Login";
import EmailGenerator from "./Views_Layouts/EmailGenerator";


export default function App() {
    const [sidebarToggle, setSidebarToggle] = useState(false);
    const [isAuthed, setIsAuthed] = useState(true); // change to true to remove log in

    const [activePage, setActivePage] = useState("dashboard");

    if (!isAuthed) {
        return <Login onSuccess={() => setIsAuthed(true)} />;
    }

    return (
        <div className="flex min-h-screen">
            <SidebarLayout
                sidebarToggle={sidebarToggle}
                onNavigate={setActivePage}        
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
                    <div className="p-6 text-white">Projects view…</div>
                )}

                {/* CLIENT */}
                {activePage === "client" && (
                    <div className="p-6 text-white">Client view…</div>
                )}

                {/* CONSULTANTS */}
                {activePage === "consultants" && (
                    <div className="p-6 text-white">Consultants view…</div>
                )}

                {/* REPORTS */}
                {activePage === "reports" && (
                    <div className="p-6 text-white">Reports view…</div>
                )}

                {/* ADMIN →  */}
                {activePage === "EmailGenerator" && (
                    <div className="p-6">
                        <EmailGenerator />
                    </div>
                )}

                {/* HOURS */}
                {activePage === "hours" && (
                    <div className="p-6 text-white">Hours view…</div>
                )}

                {/* SETTINGS */}
                {activePage === "settings" && (
                    <div className="p-6 text-white">Settings view…</div>
                )}
            </div>
        </div>
    );
}


