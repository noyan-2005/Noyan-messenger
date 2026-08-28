import { X, Reply } from "lucide-react";

export default function ReplyPreview({
  message,
  onCancel,
}) {
  if (!message) return null;

  return (
    <div
      className="
        reply-preview-enter
        flex
        items-center
        gap-3
        border-b
        border-gray-200/70
        bg-white/50
        px-4
        py-2.5
        backdrop-blur-xl
      "
    >
      {/* Reply Icon */}
      <div
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          bg-indigo-100
          text-indigo-600
        "
      >
        <Reply
          size={16}
          strokeWidth={2}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className="
            text-xs
            font-semibold
            text-indigo-600
          "
        >
          Replying to{" "}
          {message.sender === "me"
            ? "yourself"
            : "user"}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-xs
            text-gray-500
          "
        >
          {message.text}
        </p>
      </div>

      {/* Close */}
      <button
        type="button"
        onClick={onCancel}
        aria-label="Cancel reply"
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          text-gray-400
          transition
          hover:bg-gray-100
          hover:text-gray-700
        "
      >
        <X size={17} />
      </button>
    </div>
  );
}