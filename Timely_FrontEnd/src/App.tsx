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

// User info now includes role from the server
type UserInfo = {
    customerId: string;
    email: string;
    name: string;
    role?: "admin" | "consultant" | "client";
};

// Inner app component that uses theme
function AppContent() {
    const { isDark } = useTheme();
    const [sidebarToggle, setSidebarToggle] = useState(false);
    const [isAuthed, setIsAuthed] = useState(false);
    const [isLoading, setIsLoading] = useState(true); // Prevents flicker
    const [activePage, setActivePage] = useState("dashboard");
    const [pageHistory, setPageHistory] = useState<string[]>(["dashboard"]);
    const [userData, setUserData] = useState<UserInfo | null>(null);

    // Role checks - now based on the role returned from server
    const isAdmin = userData?.role === "admin";
    const isConsultant = userData?.role === "consultant";
    const isClient = userData?.role === "client";

    // Staff = admins + consultants (anyone who's not a client)
    const isStaff = isAdmin || isConsultant;

    // Check authentication on mount
    useEffect(() => {
        const user = localStorage.getItem("timely_user");
        const authenticated = localStorage.getItem("timely_authenticated");
        if (user && authenticated === "true") {
            setUserData(JSON.parse(user));
            setIsAuthed(true);
        }
        // Done checking auth - stop loading
        setIsLoading(false);
    }, []);

    const handleLoginSuccess = (user: UserInfo) => {
        setUserData(user);
        setIsAuthed(true);
    };

    const handleLogout = () => {
        localStorage.removeItem("timely_user");
        localStorage.removeItem("timely_authenticated");
        setUserData(null);
        setIsAuthed(false);
        setActivePage("dashboard");
        setPageHistory(["dashboard"]);
    };

    const handleNavigation = (page: string) => {
        if (page === "logout") { handleLogout(); return; }

        // Only admins can access admin pages
        if ((page === "admin" || page === "EmailGenerator") && !isAdmin) return;

        // Add to history (avoid duplicates if same page)
        if (page !== activePage) {
            setPageHistory(prev => [...prev, page]);
        }
        setActivePage(page);
    };

    // Go back to previous page
    const handleBack = () => {
        if (pageHistory.length > 1) {
            const newHistory = [...pageHistory];
            newHistory.pop(); // Remove current page
            const previousPage = newHistory[newHistory.length - 1] || "dashboard";
            setPageHistory(newHistory);
            setActivePage(previousPage);
        } else {
            setActivePage("dashboard");
        }
    };

    // Theme-aware background classes
    const bgClass = isDark
        ? "bg-slate-950"
        : "bg-gray-100";

    // Show loading screen while checking auth - prevents flicker
    if (isLoading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${bgClass}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className={isDark ? "text-slate-400" : "text-gray-500"}>Loading...</p>
                </div>
            </div>
        );
    }

    // Not logged in - show login screen
    if (!isAuthed) return <Login onLoginSuccess={handleLoginSuccess} />;

    // CLIENT VIEW - clients only see their own portal
    if (isClient && userData) {
        return <ClientsHomePage userData={userData} onLogout={handleLogout} />;
    }

    // CONSULTANT VIEW - can see dashboard but limited admin access
    // ADMIN VIEW - full access to everything
    return (
        <div className={`flex min-h-screen ${bgClass} transition-colors duration-300`}>
            <SidebarLayout
                sidebarToggle={sidebarToggle}
                setSidebarToggle={setSidebarToggle}
                onNavigate={handleNavigation}
                onBack={handleBack}
                isAdmin={isAdmin}
                activePage={activePage}
                userName={userData?.name}
                userEmail={userData?.email}
                userRole={userData?.role}
            />

            {/* Main content area */}
            <div className={`flex-1 min-h-screen transition-all duration-300 ${sidebarToggle ? "ml-0" : "ml-72"}`}>
                {/* Global Navbar - shows on all pages except dashboard (which has its own) */}
                {activePage !== "dashboard" && (
                    <Navbar
                        sidebarToggle={sidebarToggle}
                        setSidebarToggle={setSidebarToggle}
                        activePage={activePage}
                        onNavigate={handleNavigation}
                        userName={userData?.name}
                        userEmail={userData?.email}
                    />
                )}

                {/* Page Content - add top padding when navbar is shown */}
                <div className={activePage !== "dashboard" ? "pt-16" : ""}>
                    {activePage === "dashboard" && (
                        <Dashboard
                            sidebarToggle={sidebarToggle}
                            setSidebarToggle={setSidebarToggle}
                            onNavigate={handleNavigation}
                            userName={userData?.name}
                            userEmail={userData?.email}
                        />
                    )}
                    {activePage === "projects" && <RealEstateProjects />}
                    {activePage === "client" && <ClientsPage />}
                    {activePage === "consultants" && <ConsultantsPage />}
                    {activePage === "reports" && <ReportsTab />}
                    {activePage === "hours" && <HoursPage />}

                    {/* Admin-only pages */}
                    {activePage === "admin" && isAdmin && <AdminTab />}
                    {activePage === "EmailGenerator" && isAdmin && (
                        <div className={isDark ? "bg-slate-900 min-h-screen" : "bg-white min-h-screen"}>
                            <EmailGenerator />
                        </div>
                    )}

                    {/* Settings Page */}
                    {activePage === "settings" && <SettingsPage />}
                </div>
            </div>
        </div>
    );
}

// Main App with ThemeProvider wrapper
export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}