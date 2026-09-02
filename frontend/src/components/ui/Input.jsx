import { useState } from "react";
import {
  Eye,
  EyeOff,
  User,
  LockKeyhole,
  Phone,
} from "lucide-react";

export default function Input({
  type = "text",
  label,
  value,
  onChange,
}) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const inputIcons = {
    phone: Phone,
    username: User,
    password: LockKeyhole,
  };

  const Icon = inputIcons[type];

  const isActive = focused || value;

  const getInputType = () => {
    if (type === "password") {
      return showPassword ? "text" : "password";
    }

    if (type === "phone") {
      return "tel";
    }

    return "text";
  };

  return (
    <div className="relative w-full pt-2">
      {/* Label */}
      <label
        className={`
          pointer-events-none absolute left-4 z-10 px-1 transition-all duration-200
          ${
            isActive
              ? "top-0 bg-white text-xs text-violet-600"
              : "top-8.5 -translate-y-1/2 text-base text-slate-400"
          }
        `}
      >
        {label}
      </label>

      {/* Input */}
      <input
        type={getInputType()}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="
          h-14
          w-full
          rounded-xl
          border
          border-slate-300
          bg-white
          px-4
          pr-12
          text-slate-800
          outline-none
          transition-all
          duration-200
          focus:border-violet-500
         
          
        "
      />

      {/* Password Toggle */}
      {type === "password" && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute
            right-4
            top-9
            -translate-y-1/2
            text-slate-400
            transition
            hover:text-violet-600
            cursor-pointer
          "
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
}