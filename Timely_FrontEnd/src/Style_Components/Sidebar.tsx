import React from "react";
import {
    FaHome,
    FaUserCog,
    FaRegSun,
    FaClock,
    FaBookReader,
    FaLaugh,
    FaLayerGroup,
    FaLongArrowAltRight,
} from "react-icons/fa";
import { FaRegFolder } from "react-icons/fa6";

type Props = {
    sidebarToggle: boolean;
    onNavigate: (page: string) => void;
};

const Sidebar: React.FC<Props> = ({ sidebarToggle, onNavigate }) => {
    const itemBase =
        "mb-2 rounded py-2 hover:bg-blue-500 cursor-pointer select-none";
    const itemInner = "px-3 flex items-center gap-3";

    return (
        <aside
            className={`${sidebarToggle ? "hidden" : "block"} w-64 bg-gray-800 fixed top-0 left-0 h-full px-4 py-2 pt-16`}
        >
            <div className="mt-1 mb-4">
                <h1 className="text-2xl text-white font-bold">Dashboard</h1>
            </div>

            <hr className="border-gray-700" />

            <ul className="mt-6 text-white font-medium">
                <li className={itemBase} onClick={() => onNavigate("dashboard")}>
                    <div className={itemInner}>
                        <FaHome className="w-5 h-5" />
                        Home
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("projects")}>
                    <div className={itemInner}>
                        <FaRegFolder className="w-5 h-5" />
                        Projects
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("client")}>
                    <div className={itemInner}>
                        <FaLaugh className="w-5 h-5" />
                        Client
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("consultants")}>
                    <div className={itemInner}>
                        <FaBookReader className="w-5 h-5" />
                        Consultants
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("reports")}>
                    <div className={itemInner}>
                        <FaLayerGroup className="w-5 h-5" />
                        Reports
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("EmailGenerator")}>
                    <div className={itemInner}>
                        <FaUserCog className="w-5 h-5" />
                        Admin
                    </div>
                </li>

                <li className={itemBase} onClick={() => onNavigate("hours")}>
                    <div className={itemInner}>
                        <FaClock className="w-5 h-5" />
                        Hours
                    </div>
                </li>
            </ul>

            <hr className="border-gray-700 my-3" />

            <ul className="text-white font-medium">
                <li className={itemBase} onClick={() => onNavigate("settings")}>
                    <div className={itemInner}>
                        <FaRegSun className="w-5 h-5" />
                        Settings
                    </div>
                </li>

                <li className="mb-2 rounded py-2 hover:bg-red-600 cursor-pointer select-none"
                    onClick={() => onNavigate("logout")}>
                    <div className={itemInner}>
                        <FaLongArrowAltRight className="w-5 h-5" />
                        Logout
                    </div>
                </li>
            </ul>
        </aside>
    );
};

export default Sidebar;

