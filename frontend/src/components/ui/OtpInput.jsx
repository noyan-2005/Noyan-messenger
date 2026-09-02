import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";

const OtpInput = forwardRef(
  (
    {
      value = "",
      onChange,
      onComplete,
      length = 6,
      disabled = false,
      autoFocus = true,
      className = "",
    },
    ref
  ) => {
    const inputRefs = useRef([]);

    // --------------------------------------------------
    // Make the component controllable from the parent
    // --------------------------------------------------

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRefs.current[0]?.focus();
      },

      clear: () => {
        onChange?.("");
        inputRefs.current[0]?.focus();
      },
    }));

    // --------------------------------------------------
    // Keep OTP value clean
    // --------------------------------------------------

    const otp = value
      .replace(/\D/g, "")
      .slice(0, length);

    // --------------------------------------------------
    // Auto focus on first input
    // --------------------------------------------------

    useEffect(() => {
      if (autoFocus && !disabled) {
        inputRefs.current[0]?.focus();
      }
    }, [autoFocus, disabled]);

    // --------------------------------------------------
    // Focus a specific input
    // --------------------------------------------------

    const focusInput = (index) => {
      if (index < 0 || index >= length) return;

      inputRefs.current[index]?.focus();
    };

    // --------------------------------------------------
    // Handle typing
    // --------------------------------------------------

    const handleChange = (e, index) => {
      const inputValue = e.target.value;

      // Only allow numbers
      const digit = inputValue.replace(/\D/g, "").slice(-1);

      if (!digit) {
        return;
      }

      const otpArray = otp.split("");

      // Make sure the array has enough items
      while (otpArray.length < length) {
        otpArray.push("");
      }

      otpArray[index] = digit;

      const newOtp = otpArray.join("").slice(0, length);

      onChange?.(newOtp);

      // Move to the next input
      if (index < length - 1) {
        focusInput(index + 1);
      }

      // OTP completed
      if (newOtp.length === length) {
        onComplete?.(newOtp);
      }
    };

    // --------------------------------------------------
    // Handle keyboard
    // --------------------------------------------------

    const handleKeyDown = (e, index) => {
      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();

        const otpArray = otp.split("");

        while (otpArray.length < length) {
          otpArray.push("");
        }

        if (otpArray[index]) {
          otpArray[index] = "";

          const newOtp = otpArray.join("").replace(/\D/g, "");

          onChange?.(newOtp);

          return;
        }

        if (index > 0) {
          otpArray[index - 1] = "";

          const newOtp = otpArray
            .join("")
            .replace(/\D/g, "");

          onChange?.(newOtp);

          focusInput(index - 1);
        }

        return;
      }

      // Arrow Left
      if (e.key === "ArrowLeft") {
        e.preventDefault();

        if (index > 0) {
          focusInput(index - 1);
        }

        return;
      }

      // Arrow Right
      if (e.key === "ArrowRight") {
        e.preventDefault();

        if (index < length - 1) {
          focusInput(index + 1);
        }

        return;
      }

      // Prevent non-numeric characters
      if (
        !/^\d$/.test(e.key) &&
        ![
          "Tab",
          "Shift",
          "Control",
          "Alt",
          "Meta",
          "Delete",
        ].includes(e.key)
      ) {
        e.preventDefault();
      }
    };

    // --------------------------------------------------
    // Handle paste
    // --------------------------------------------------

    const handlePaste = (e, index) => {
      e.preventDefault();

      const pastedValue = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, length);

      if (!pastedValue) return;

      const otpArray = Array(length).fill("");

      pastedValue.split("").forEach((digit, i) => {
        const targetIndex = index + i;

        if (targetIndex < length) {
          otpArray[targetIndex] = digit;
        }
      });

      const newOtp = otpArray.join("");

      onChange?.(newOtp);

      // Focus the appropriate input
      if (newOtp.length >= length) {
        focusInput(length - 1);
        onComplete?.(newOtp);
      } else {
        focusInput(
          Math.min(index + pastedValue.length, length - 1)
        );
      }
    };

    // --------------------------------------------------
    // Render
    // --------------------------------------------------

    return (
      <div
        className={`flex justify-center gap-2 sm:gap-3 ${className}`}
      >
        {Array.from({ length }).map((_, index) => (
          <input
            key={index}
            ref={(element) => {
              inputRefs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={otp[index] || ""}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={(e) => handlePaste(e, index)}
            className="
              h-12
              w-11
              rounded-xl
              border
              border-slate-300
              bg-white
              text-center
              text-lg
              font-semibold
              text-slate-900
              outline-none
              transition
              duration-200
              focus:border-violet-600
              focus:ring-2
              focus:ring-violet-100
              disabled:cursor-not-allowed
              disabled:bg-slate-100
              disabled:text-slate-400
              sm:h-13
              sm:w-12
            "
            aria-label={`Verification code digit ${index + 1}`}
          />
        ))}
      </div>
    );
  }
);

OtpInput.displayName = "OtpInput";

export default OtpInput;
