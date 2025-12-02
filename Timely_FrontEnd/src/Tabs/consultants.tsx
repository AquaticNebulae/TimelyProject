import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";
import type { ColumnDef } from "@tanstack/react-table";

interface Consultant {
    id: number;
    name: string;
    role: string;
    clientCount: number;
    workload: "Light" | "Medium" | "Heavy";
}

export default function Consultants() {
    const [data, setData] = useState<Consultant[]>([]);

    useEffect(() => {
        fetch("/api/consultants")
            .then(res => res.json())
            .then(setData)
            .catch(() =>
                setData([
                    { id: 1, name: "Lisa Wong", role: "Senior", clientCount: 5, workload: "Medium" },
                ])
            );
    }, []);

    const columns = React.useMemo<ColumnDef<Consultant, unknown>[]>(() => [
        { accessorKey: "id", header: "ID" },
        { accessorKey: "name", header: "Name" },
        { accessorKey: "role", header: "Role" },
        { accessorKey: "clientCount", header: "Clients" },

        /* workload badge – colour-coded on the fly */
        {
            accessorKey: "workload",
            header: "Workload",
            /** strongly-typed `getValue` so ESLint/TS keep quiet */
            cell: ({ getValue }): React.ReactNode => {
                const val = getValue<string>();
                const color = val === "Light" ? "green"
                    : val === "Medium" ? "yellow"
                        : "red";
                return (
                    <span className={`px-2 py-0.5 rounded text-xs bg-${color}-600/20 text-${color}-400`}>
                        {val}
                    </span>
                );
            },
        },
    ], []);

    /* render ------------------------------------------------------------------- */
    return (
        <DataTable<Consultant>
            data={data}
            columns={columns}
            filterPlaceholder="Search consultants…"
        />
    );