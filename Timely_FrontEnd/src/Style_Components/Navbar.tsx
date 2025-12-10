import React from "react";

type NavbarProps = {
  onNavigate: (page: string) => void;
  user: { name: string; email: string; role: string };
  activePage: string;
};

const Navbar = ({ onNavigate, user, activePage }: NavbarProps) => {
  return (
    <div className="bg-slate-900 text-white p-4 border-b border-slate-700 flex justify-between items-center">
      <div>
        <h1 className="text-xl font-bold">Timely</h1>
        <p className="text-sm text-gray-400">Logged in as {user.name}</p>
      </div>
      <div className="space-x-4">
        <button onClick={() => onNavigate("dashboard")} className="hover:underline">
          Dashboard
        </button>
        <button onClick={() => onNavigate("settings")} className="hover:underline">
          Settings
        </button>
      </div>
    </div>
  );
};

export default Navbar;
