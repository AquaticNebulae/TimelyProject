// src/Tabs/reports_V.tsx
import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";

// User report data type 
type UserRow = {
    customerId: string;
    firstName: string;
    middleName: string;
    lastName: string;
    email: string;
    tempPassword: string;
};

interface Report {
    id: number;
    title: string;
    created: string; // ISO date
    owner: string;
}

const ReportsTab: React.FC = () => {
    // State for user reports (first version)
    const [userData, setUserData] = useState<UserRow[]>([]);
    const [userLoading, setUserLoading] = useState(false);
    const [userError, setUserError] = useState<string | null>(null);

    // State for general reports (second version)
    const [reportData, setReportData] = useState<Report[]>([]);

    // State for view toggle
    const [activeView, setActiveView] = useState<"users" | "general">("users");

    // Fetch user reports
    const fetchUserReport = async () => {
        try {
            setUserLoading(true);
            setUserError(null);
            const res = await fetch("http://localhost:4000/api/users-report");
            if (!res.ok) throw new Error("Failed to fetch report");
            const json = await res.json();
            setUserData(json.data || []);
        } catch (err: any) {
            setUserError(err.message || "Error fetching report");
        } finally {
            setUserLoading(false);
        }
    };

    // Fetch general reports
    const fetchGeneralReports = () => {
        fetch("/api/reports")
            .then((res) => res.json())
            .then(setReportData)
            .catch(() =>
                setReportData([
                    { id: 1, title: "Q1 Summary", created: "2025-01-15", owner: "Lisa Wong" },
                ])
            );
    };

    useEffect(() => {
        fetchUserReport();
        fetchGeneralReports();
    }, []);

    const handleDownloadCsv = () => {
        window.open("http://localhost:4000/api/users-report/csv", "_blank");
    };

    // Define columns for general reports DataTable
    const reportColumns = React.useMemo<ColumnDef<Report, any>[]>(
        () => [
            { accessorKey: "id", header: "ID" },
            { accessorKey: "title", header: "Title" },
            { accessorKey: "owner", header: "Owner" },
            {
                accessorKey: "created",
                header: "Created",
                cell: ({ getValue }) => new Date(getValue<string>()).toLocaleDateString(),
            },
        ],
        []
    );

    return (
        <div className="p-6 text-white bg-gray-900 min-h-screen">
            {/* Header with view toggle */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Reports</h1>
                <div className="flex gap-2">
                    {/* View Toggle Buttons */}
                    <button
                        onClick={() => setActiveView("users")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeView === "users"
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        User Reports
                    </button>
                    <button
                        onClick={() => setActiveView("general")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeView === "general"
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "bg-gray-700 hover:bg-gray-600"
                            }`}
                    >
                        General Reports
                    </button>
                </div>
            </div>

            {/* USER REPORTS VIEW */}
            {activeView === "users" && (
                <>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-medium text-slate-300">User Account Reports</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={fetchUserReport}
                                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold"
                            >
                                Refresh
                            </button>
                            <button
                                onClick={handleDownloadCsv}
                                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold"
                            >
                                Download CSV
                            </button>
                        </div>
                    </div>

                    {userLoading && <p className="text-slate-300">Loading report...</p>}
                    {userError && <p className="text-red-400">{userError}</p>}
                    {!userLoading && !userError && userData.length === 0 && (
                        <p className="text-slate-300">No data yet. Add users from the Admin tab.</p>
                    )}
                    {!userLoading && !userError && userData.length > 0 && (
                        <div className="overflow-x-auto mt-4">
                            <table className="min-w-full text-sm text-left">
                                <thead>
                                    <tr className="bg-gray-800">
                                        <th className="px-3 py-2 border-b border-gray-700">ID</th>
                                        <th className="px-3 py-2 border-b border-gray-700">First Name</th>
                                        <th className="px-3 py-2 border-b border-gray-700">Middle</th>
                                        <th className="px-3 py-2 border-b border-gray-700">Last Name</th>
                                        <th className="px-3 py-2 border-b border-gray-700">Email</th>
                                        <th className="px-3 py-2 border-b border-gray-700">Temp Password</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {userData.map((row) => (
                                        <tr key={row.customerId} className="hover:bg-gray-800">
                                            <td className="px-3 py-2 border-b border-gray-800">
                                                {row.customerId}
                                            </td>
                                            <td className="px-3 py-2 border-b border-gray-800">
                                                {row.firstName}
                                            </td>
                                            <td className="px-3 py-2 border-b border-gray-800">
                                                {row.middleName}
                                            </td>
                                            <td className="px-3 py-2 border-b border-gray-800">
                                                {row.lastName}
                                            </td>
                                            <td className="px-3 py-2 border-b border-gray-800">
                                                {row.email}
                                            </td>
                                            <td className="px-3 py-2 border-b border-gray-800 font-mono">
                                                {row.tempPassword}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* GENERAL REPORTS VIEW */}
            {activeView === "general" && (
                <div className="mt-4">
                    <h2 className="text-lg font-medium text-slate-300 mb-4">General Reports</h2>
                    <DataTable<Report>
                        data={reportData}
                        columns={reportColumns}
                        filterPlaceholder="Search reports…"
                    />
                </div>
            )}
        </div>
    );
};

export default ReportsTab;