/* eslint-disable @typescript-eslint/no-explicit-any */
import { Fragment, useEffect, useState } from "react";

/* ---------------- data-grid engine ---------------- */
import DataTable from "./DataTable";

/* ------------- @tanstack/react-table ------------- */
import {
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    useReactTable,
    flexRender,
} from "@tanstack/react-table";
import type {
    ColumnDef,
    HeaderGroup,
    Row,
    CellContext,
    Cell,
} from "@tanstack/react-table";

/* ---------------- icons / ui ---------------- */
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi";
import { Dialog, Transition } from "@headlessui/react";

/* -------------------- types -------------------- */
interface Client {
    id: number;
    name: string;
    company: string;
    email: string;
    consultantCount: number;
    status: "Active" | "Inactive";
}

/* ------------------ component ------------------ */
export default function Clients() {
    const [data, setData] = useState<Client[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState<Client | null>(null);

    /* fake fetch ------------------------------ */
    useEffect(() => {
        fetch("/api/clients")
            .then((res) => res.json() as Promise<Client[]>)
            .then(setData)
            .catch(() =>
                setData([
                    {
                        id: 1,
                        name: "Acme Corp",
                        company: "Acme",
                        email: "john@acme.com",
                        consultantCount: 2,
                        status: "Active",
                    },
                ])
            );
    }, []);

    const columns = React.useMemo<ColumnDef<Client>[]>(
        () => [
            { accessorKey: "id", header: "ID" },
            { accessorKey: "name", header: "Name" },
            { accessorKey: "company", header: "Company" },
            { accessorKey: "email", header: "Email" },

            {
                accessorKey: "consultantCount",
                header: "Consultants",
                cell: ({ getValue }: CellContext<Client, unknown>) => (
                    <span className="font-semibold">{getValue<number>()}</span>
                ),
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ getValue }: CellContext<Client, unknown>) => {
                    const val = getValue<string>();
                    const color =
                        val === "Active" ? "bg-green-600/20 text-green-400" : "bg-red-600/20 text-red-400";
                    return (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${color}`}>
                            {val}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "",
                cell: ({ row }: { row: Row<Client> }) => (
                    <div className="flex gap-2 text-indigo-400">
                        <FiEdit2
                            className="cursor-pointer"
                            onClick={() => {
                                setSelected(row.original);
                                setIsOpen(true);
                            }}
                        />
                        <FiTrash2 className="cursor-pointer" />
                    </div>
                ),
            },
        ],
        []
    );

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel,
        getFilteredRowModel,
        getPaginationRowModel,
    });

    /* ------------ render ----------------- */
    return (
        <>
            <button
                onClick={() => {
                    setSelected(null);
                    setIsOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 px-4 py-1.5 rounded-lg text-sm font-medium text-white mb-4"
            >
                <FiPlus /> Add Client
            </button>

            <DataTable<Client> data={data} columns={columns} filterPlaceholder="Search clients…" />

            {/* Modal */}
            <Transition show={isOpen} appear>
                <Dialog as={Fragment} onClose={() => setIsOpen(false)} className="relative z-50">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-200"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/40" />
                    </Transition.Child>

                    <div className="fixed inset-0 flex items-center justify-center">
                        <Dialog.Panel className="w-full max-w-lg rounded-2xl bg-slate-900 p-6 text-slate-100">
                            <Dialog.Title as="h2" className="text-lg font-semibold mb-4">
                                {selected ? "Edit Client" : "New Client"}
                            </Dialog.Title>

                            {/* …form fields go here… */}

                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-1.5 hover:bg-indigo-700"
                            >
                                Save
                            </button>
                        </Dialog.Panel>
                    </div>
                </Dialog>
            </Transition>
        </>
    );
}
