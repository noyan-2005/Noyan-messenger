import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Input from "../ui/Input";
import OtpInput from "../ui/OtpInput";

export default function Login() {
  const [loginMode, setLoginMode] = useState("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Resend timer
  const [resendTimer, setResendTimer] = useState(60);

  // --------------------------------------------------
  // Resend countdown
  // --------------------------------------------------

  useEffect(() => {
    if (loginMode !== "verification") return;
    if (resendTimer <= 0) return;

    const timer = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loginMode, resendTimer]);

  // --------------------------------------------------
  // Go to verification
  // --------------------------------------------------

  const handleNext = () => {
    if (!phone.trim()) return;

    setOtp("");
    setResendTimer(60);
    setLoginMode("verification");

    // Later:
    // send verification code to backend
  };

  // --------------------------------------------------
  // Resend verification code
  // --------------------------------------------------

  const handleResend = () => {
    if (resendTimer > 0) return;

    setOtp("");
    setResendTimer(60);

    // Later:
    // send verification code again
  };

  // --------------------------------------------------
  // Change phone number
  // --------------------------------------------------

  const handleChangePhone = () => {
    setOtp("");
    setResendTimer(60);
    setLoginMode("phone");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">

      <div className="w-full max-w-100 rounded-4xl bg-white p-8 shadow-xl">

        {/* Header */}
        <div className="mb-10 text-center">

          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl">
            <img
              src="../../../public/icon.png"
              alt="Noyan"
            />
          </div>

          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome to Noyan
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Connect with your friends and start chatting.
          </p>

        </div>

        {/* Login Steps */}
        <AnimatePresence mode="wait">

          {/* =========================================
              PHONE
          ========================================= */}

          {loginMode === "phone" && (
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
                onClick={handleNext}
                disabled={!phone.trim()}
                className="
                  w-full
                  cursor-pointer
                  rounded-xl
                  bg-violet-600
                  py-3.5
                  font-medium
                  text-white
                  transition
                  hover:bg-violet-700
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Next
              </button>

              <button
                onClick={() => setLoginMode("credentials")}
                className="
                  block
                  w-full
                  cursor-pointer
                  rounded-2xl
                  p-3
                  text-center
                  text-sm
                  font-medium
                  text-violet-600
                  transition
                  hover:bg-violet-100
                "
              >
                Log in
              </button>

            </motion.div>
          )}

          {/* =========================================
              VERIFICATION
          ========================================= */}

          {loginMode === "verification" && (
            <motion.div
              key="verification"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >

              {/* Title */}
              <div className="text-center">

                <h2 className="text-xl font-semibold text-slate-900">
                  Verify your phone
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter the verification code sent to
                </p>

                <p className="mt-1 text-sm font-medium text-violet-700">
                  {phone}
                </p>

              </div>

              {/* OTP */}
              <OtpInput
                value={otp}
                onChange={setOtp}
                onComplete={(code) => {
                  console.log("OTP:", code);

                  // Later:
                  // verify OTP with backend
                }}
              />

              {/* Verify button */}
              <button
                disabled={otp.length !== 6}
                className="
                  w-full
                  rounded-xl
                  bg-violet-600
                  py-3.5
                  font-medium
                  text-white
                  transition
                  hover:bg-violet-700
                  cursor-pointer
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                Verify
              </button>

              {/* Resend */}
              <div className="text-center text-sm">

                {resendTimer > 0 ? (
                  <p className="text-slate-500">
                    Resend code in{" "}
                    <span className="font-medium text-slate-700">
                      00:{String(resendTimer).padStart(2, "0")}
                    </span>
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    className="
                      cursor-pointer
                      font-medium
                      text-violet-600
                      hover:text-violet-700
                    "
                  >
                    Resend code
                  </button>
                )}

              </div>

              {/* Change phone */}
              <button
                onClick={handleChangePhone}
                className="
                  block
                  w-full
                  cursor-pointer
                  rounded-2xl
                  p-3
                  text-center
                  text-sm
                  font-medium
                  text-violet-600
                  transition
                  hover:bg-violet-100
                "
              >
                Change phone number
              </button>

            </motion.div>
          )}

          {/* =========================================
              USERNAME + PASSWORD
          ========================================= */}

          {loginMode === "credentials" && (
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
                className="
                  w-full
                  cursor-pointer
                  rounded-xl
                  bg-violet-600
                  py-3
                  font-medium
                  text-white
                  transition
                  hover:bg-violet-700
                "
              >
                Login
              </button>

              <button
                onClick={() => setLoginMode("phone")}
                className="
                  block
                  w-full
                  cursor-pointer
                  rounded-2xl
                  p-3
                  text-center
                  text-sm
                  font-medium
                  text-violet-600
                  transition
                  hover:bg-violet-100
                "
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
