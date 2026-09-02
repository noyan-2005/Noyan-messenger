import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Input from "../ui/Input";

export default function Login() {
  const [loginMode, setLoginMode] = useState("phone");

  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      
      <div className="w-full max-w-100 rounded-4xl bg-white p-8 shadow-xl">
        
        {/* ثابت */}
        <div className="mb-10 text-center">
          
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img src="../../../public/icon.png" alt=""/>
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome to Noyan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Connect with your friends and start chatting.
          </p>

        </div>

        <AnimatePresence mode="wait">
            {loginMode === "phone" ? (
                <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
                >
                <Input
                    type="phone"
                    label="Phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                />

                <button
                    className="w-full rounded-xl bg-violet-600 py-3.5 font-medium text-white cursor-pointer"
                >
                    Next
                </button>

                <div className="text-center text-sm text-slate-500">

                    <button
                    onClick={() => setLoginMode("credentials")}
                    className="block w-full p-3 rounded-2xl text-center text-sm font-medium text-violet-600 hover:bg-violet-100 cursor-pointer"
                    >
                    Log in
                    </button>
                </div>
                </motion.div>
            ) : (
                <motion.div
                key="credentials"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
                >
                <Input
                    type="username"
                    label="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />

                <Input
                    type="password"
                    label="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    className="w-full rounded-xl bg-violet-600 py-3 font-medium text-white cursor-pointer"
                >
                    Login
                </button>

                <button
                    onClick={() => setLoginMode("phone")}
                    className="block w-full p-3 rounded-2xl text-center text-sm font-medium text-violet-600 hover:bg-violet-100 cursor-pointer"
                >
                    Login with phone number
                </button>
                </motion.div>
            )}
        </AnimatePresence>

      </div>

    </main>
  );
}