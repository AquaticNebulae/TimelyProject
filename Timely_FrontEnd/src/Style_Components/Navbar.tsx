import React from "react";
import { FaBars, FaSearch, FaBell, FaUserCircle } from "react-icons/fa";

type Props = {
    sidebarToggle: boolean;
    setSidebarToggle: (v: boolean) => void;
};

const Navbar: React.FC<Props> = ({ sidebarToggle, setSidebarToggle }) => {
    return (
        <header
            className={`
        fixed top-0 left-0 right-0 z-30 bg-gray-800/95 backdrop-blur
        transition-[padding] duration-200 px-4 py-3
        ${sidebarToggle ? "md:pl-16" : "md:pl-64"}
      `}
        >
            <nav className="flex items-center justify-between" aria-label="Main Navigation">

                
                <div className="flex items-center text-xl">
                    <button
                        className="text-white mr-4 cursor-pointer"
                        aria-label="Toggle sidebar"
                        onClick={() => setSidebarToggle(!sidebarToggle)}
                    >
                        <FaBars className="w-6 h-6" />
                    </button>

                    <span className="text-white font-semibold">TIMELY⌛</span>
                </div>

                
                <div className="flex items-center gap-x-5">

                    <div className="relative hidden md:flex items-center">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input
                            type="text"
                            placeholder="Search…"
                            className="md:w-64 pl-10 pr-3 py-2 rounded outline-none
               bg-gray-700 text-gray-100 placeholder-gray-300
               border border-gray-600 focus:border-gray-300
               focus:ring-2 focus:ring-gray-400/50"
                        />
                    </div>


                    <button className="text-white" aria-label="Notifications">
                        <FaBell className="w-6 h-6" />
                    </button>

                    <div className="relative group">
                        <button
                            className="text-white flex items-center"
                            aria-haspopup="true"
                            aria-expanded="false"
                        >
                            <FaUserCircle className="w-6 h-6 mt-1" />
                        </button>

                        <div className="     invisible opacity-0 
      group-hover:visible group-hover:opacity-100 
      absolute right-0 top-full mt-2
      bg-white rounded-lg shadow w-36 z-10
      transition-all duration-200">
                            <ul className="py-2 text-sm text-gray-900">
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100">Profile</a>
                                </li>
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100">Settings</a>
                                </li>
                                <li>
                                    <a href="#" className="block px-4 py-2 hover:bg-gray-100">Log out</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;
