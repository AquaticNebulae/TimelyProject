import React, { useEffect, useState } from "react";
import DataTable from "./DataTable";
import { ColumnDef } from "@tanstack/react-table";

interface Report {
    id: number;
    title: string;
    created: string; // ISO date
    owner: string;
}

export default function Reports() {
    const [data, setData] = useState<Report[]>([]);

    useEffect(() => {
        fetch("/api/reports")
            .then(res => res.json())
            .then(setData)
            .catch(() =>
                setData([
                    { id: 1, title: "Q1 Summary", created: "2025-01-15", owner: "Lisa Wong" },
                ])
            );
    }, []);

    const columns = React.useMemo<ColumnDef<Report, any>[]>(
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

    return <DataTable<Report> data={data} columns={columns} filterPlaceholder="Search reports…" />;
}
