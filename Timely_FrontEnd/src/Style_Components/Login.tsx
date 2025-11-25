import React, { useState } from "react";
import { FaIdBadge, FaFingerprint, FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import logo from "../assets/Timely.svg";
import bg from "../assets/timely_branded.png";

interface LoginProps {
    onLoginSuccess: (userData: { customerId: string; email: string; name: string }) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const togglePasswordVisibility = () => setShowPassword((v) => !v);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");
        setIsLoading(true);

        try {
            // Call backend to validate login
            const response = await fetch("http://localhost:4000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            // Login successful
            console.log("Login successful:", data);

            // Store user data in localStorage
            localStorage.setItem("timely_user", JSON.stringify(data.user));
            localStorage.setItem("timely_authenticated", "true");

            // Call success callback
            onLoginSuccess(data.user);

        } catch (error: any) {
            console.error("Login error:", error);
            setErrorMessage(error.message || "Invalid email or password");
        } finally {
            setIsLoading(false);
        }
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

                {errorMessage && (
                    <div className="w-full p-3 bg-red-500/20 border border-red-500 rounded-lg">
                        <p className="text-xs text-red-300 text-center">{errorMessage}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full space-y-3">
                    <div className="w-full flex items-center gap-2 bg-gray-800 p-2 rounded-xl">
                        <FaIdBadge className="text-white" />
                        <input
                            type="email"
                            placeholder="Company Email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-transparent border-0 w-full outline-none text-sm md:text-base text-white placeholder-gray-400"
                        />
                    </div>
                    <div className="relative w-full flex items-center gap-2 bg-gray-800 p-2 rounded-xl">
                        <FaFingerprint className="text-white" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        disabled={isLoading}
                        className="w-full p-2 bg-blue-500 rounded-xl hover:bg-blue-600 text-sm md:text-base text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                        {isLoading ? "Logging in..." : "Login"}
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