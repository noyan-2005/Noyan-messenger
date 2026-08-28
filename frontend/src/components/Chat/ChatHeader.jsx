import {
  Phone,
  Video,
  MoreVertical,
  Menu,
} from "lucide-react";

import TypingIndicator from "./TypingIndicator";

export default function ChatHeader({
  chat,
  isTyping = false,
  onMenuClick,
}) {
  if (!chat) return null;

  return (
    <header
      className="
        flex
        h-[64px]
        shrink-0
        items-center
        justify-between
        border-b
        border-gray-200/80
        bg-white/80
        px-3
        backdrop-blur-xl

        sm:h-[68px]
        sm:px-4

        md:h-[72px]
        md:px-5
      "
    >

      {/* Left Side */}

      <div className="flex min-w-0 items-center gap-2 sm:gap-3">

        {/* Mobile Menu */}

        <button
          type="button"
          aria-label="Open chats"
          onClick={onMenuClick}
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900

            md:hidden
          "
        >
          <Menu
            size={21}
            strokeWidth={1.8}
          />
        </button>

        {/* Avatar */}

        <div className="relative shrink-0">

          <img
            src={chat.avatar}
            alt={chat.name}
            className="
              h-10
              w-10
              rounded-full
              object-cover
              ring-2
              ring-white

              sm:h-11
              sm:w-11
            "
          />

          {chat.online && (
            <span
              className="
                absolute
                bottom-0
                right-0
                h-2.5
                w-2.5
                rounded-full
                border-2
                border-white
                bg-emerald-500

                sm:h-3
                sm:w-3
              "
            />
          )}
        </div>

        {/* Name & Status */}

        <div className="min-w-0">

          <h2
            className="
              max-w-[150px]
              truncate
              text-sm
              font-semibold
              leading-5
              text-gray-900

              sm:max-w-[220px]
            "
          >
            {chat.name}
          </h2>

          <div className="flex h-4 items-center">

            {isTyping ? (
              <TypingIndicator />
            ) : (
              <span
                className={`
                  text-[11px]
                  leading-4

                  sm:text-xs

                  ${
                    chat.online
                      ? "text-emerald-500"
                      : "text-gray-400"
                  }
                `}
              >
                {chat.online
                  ? "Online"
                  : "Offline"}
              </span>
            )}

          </div>
        </div>
      </div>

      {/* Actions */}

      <div className="flex items-center gap-0.5 sm:gap-1">

        {/* Video Call */}

        <button
          type="button"
          aria-label="Start video call"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900

            sm:h-10
            sm:w-10
          "
        >
          <Video
            size={18}
            strokeWidth={1.8}
          />
        </button>

        {/* Voice Call */}

        <button
          type="button"
          aria-label="Start voice call"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900

            sm:h-10
            sm:w-10
          "
        >
          <Phone
            size={17}
            strokeWidth={1.8}
          />
        </button>

        {/* More */}

        <button
          type="button"
          aria-label="More options"
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            text-gray-500
            transition-all
            duration-200
            hover:bg-gray-100
            hover:text-gray-900

            sm:h-10
            sm:w-10
          "
        >
          <MoreVertical
            size={18}
            strokeWidth={1.8}
          />
        </button>

      </div>
    </header>
  );
}