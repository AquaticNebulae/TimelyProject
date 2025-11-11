import React, { useState } from "react";
import { FaIdBadge, FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "../assets/Timely.svg";
import bg from "../assets/timely_branded.png";

const Login: React.FC = () => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const togglePasswordVisibility = () => setShowPassword((v) => !v);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("login submit");
    };

    return (
        <div
            className="w-full h-screen flex items-center justify-center"
            style={{
                backgroundImage: `url(${bg})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            }}
        >
            <div className="w-[90%] max-w-sm md:max-w-md p-6 bg-gray-900/90 flex flex-col items-center gap-4 rounded-xl shadow-lg shadow-slate-500">

                <img src={logo} alt="Timely logo" className="w-12 md:w-14" />

                <h1 className="text-lg md:text-xl font-semibold text-white">Welcome</h1>
                <p className="text-xs md:text-sm text-gray-400 text-center">
                    Accounts are created by Timely administrator.
                </p>

                <form onSubmit={handleSubmit} className="w-full space-y-3">

                    <div className="w-full flex items-center gap-2 bg-gray-800 p-2 rounded-xl">
                        <FaIdBadge className="text-white" />
                        <input
                            type="text"
                            placeholder="User ID"
                            required
                            className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-400"
                        />
                    </div>

                    <div className="relative w-full flex items-center gap-2 bg-gray-800 p-2 rounded-xl">
                        <FaFingerprint className="text-white" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-400"
                        />
                        <button
                            type="button"
                            onClick={togglePasswordVisibility}
                            className="absolute right-3"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            {showPassword ? <FaRegEyeSlash className="text-white" /> : <FaRegEye className="text-white" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="w-full p-2 bg-blue-500 rounded-xl hover:bg-blue-600 text-sm md:text-base text-white"
                    >
                        Login
                    </button>
                </form>

                <div className="w-full border-t border-gray-700 pt-3">
                    <p className="text-xs md:text-sm text-gray-400 text-center">
                        Having trouble?{" "}
                        <span className="text-white underline cursor-pointer">
                            Contact Timely.
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
