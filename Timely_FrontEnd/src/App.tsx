import React, { useState, useEffect } from "react";
import SidebarLayout from "./Style_Components/Sidebar";
import Dashboard from "./Style_Components/Dashboard";
import Login from "./Style_Components/Login";
import EmailGenerator from "./Views_Layouts/EmailGenerator";
//james,W,mardi,mardij@timely.com,95fUdnH3*KrD
export default function App() {
    const [sidebarToggle, setSidebarToggle] = useState(false);
<<<<<<< HEAD
    const [isAuthed, setIsAuthed] = useState(true); // change to true to remove log in

=======
    const [isAuthed, setIsAuthed] = useState(false);
>>>>>>> b1b7439e47289ea930ba955fc737cea2d39262bc
    const [activePage, setActivePage] = useState("dashboard");
    const [userData, setUserData] = useState<any>(null);

    // Check if user is already logged in on mount
    useEffect(() => {
        const user = localStorage.getItem("timely_user");
        const authenticated = localStorage.getItem("timely_authenticated");

        if (user && authenticated === "true") {
            setUserData(JSON.parse(user));
            setIsAuthed(true);
        }
    }, []);

    const handleLoginSuccess = (user: any) => {
        console.log("Login successful:", user);
        setUserData(user);
        setIsAuthed(true); // change to true to deactivate log in 
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
        } else {
            setActivePage(page);
        }
    };

    if (!isAuthed) {
        return <Login onLoginSuccess={handleLoginSuccess} />;
    }

    return (
        <div className="flex min-h-screen">
            <SidebarLayout
                sidebarToggle={sidebarToggle}
                onNavigate={handleNavigation}
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
                {activePage === "reports" && (
                    <div className="p-6 text-white bg-gray-900 min-h-screen">
                        <h1 className="text-2xl font-semibold mb-4">Reports</h1>
                        <p>Reports view coming soon...</p>
                    </div>
                )}

                {/* ADMIN → Email Generator */}
                {activePage === "EmailGenerator" && (
                    <div className="bg-gray-900 min-h-screen">
                        <EmailGenerator />
                    </div>
                )}

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