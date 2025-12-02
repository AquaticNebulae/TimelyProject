// src/Tabs/reports.tsx
import React, { useEffect, useState } from "react";

type UserRow = {
  customerId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  tempPassword: string;
};

const ReportsTab: React.FC = () => {
  const [data, setData] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:4000/api/users-report");
      if (!res.ok) throw new Error("Failed to fetch report");
      const json = await res.json();
      setData(json.data || []);
    } catch (err: any) {
      setError(err.message || "Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownloadCsv = () => {
    window.open("http://localhost:4000/api/users-report/csv", "_blank");
  };

  return (
    <div className="p-6 text-white bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchReport}
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

      {loading && <p className="text-slate-300">Loading report...</p>}
      {error && <p className="text-red-400">{error}</p>}

      {!loading && !error && data.length === 0 && (
        <p className="text-slate-300">No data yet. Add users from the Admin tab.</p>
      )}

      {!loading && !error && data.length > 0 && (
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
              {data.map((row) => (
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
    </div>
  );
};

export default ReportsTab;
