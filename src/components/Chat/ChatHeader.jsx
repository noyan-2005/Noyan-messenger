import { Phone, Video, MoreVertical } from "lucide-react";
import TypingIndicator from "./TypingIndicator";

export default function ChatHeader({
  chat,
  isTyping = false,
}) {
  if (!chat) return null;

  return (
    <header
      className="
        flex
        h-[72px]
        shrink-0
        items-center
        justify-between
        border-b
        border-gray-200/80
        bg-white/80
        px-5
        backdrop-blur-xl
      "
    >
      {/* User Info */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Avatar */}
        <div className="relative shrink-0">
          <img
            src={chat.avatar}
            alt={chat.name}
            className="
              h-11
              w-11
              rounded-full
              object-cover
              ring-2
              ring-white
            "
          />

          {chat.online && (
            <span
              className="
                absolute
                bottom-0
                right-0
                h-3
                w-3
                rounded-full
                border-2
                border-white
                bg-emerald-500
              "
            />
          )}
        </div>

        {/* Name & Status */}
        <div className="min-w-0">
          {/* Name */}
          <h2
            className="
              truncate
              text-sm
              font-semibold
              leading-5
              text-gray-900
            "
          >
            {chat.name}
          </h2>

          {/* Status */}
          <div className="flex h-4 items-center">
            {isTyping ? (
              <TypingIndicator />
            ) : (
              <span
                className={`
                  text-xs
                  leading-4
                  ${
                    chat.online
                      ? "text-emerald-500"
                      : "text-gray-400"
                  }
                `}
              >
                {chat.online ? "Online" : "Offline"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Video Call */}
        <button
          type="button"
          aria-label="Start video call"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900
          "
        >
          <Video
            size={19}
            strokeWidth={1.8}
          />
        </button>

        {/* Voice Call */}
        <button
          type="button"
          aria-label="Start voice call"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900
          "
        >
          <Phone
            size={18}
            strokeWidth={1.8}
          />
        </button>

        {/* More */}
        <button
          type="button"
          aria-label="More options"
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900
          "
        >
          <MoreVertical
            size={19}
            strokeWidth={1.8}
          />
        </button>
      </div>
    </header>
  );
}