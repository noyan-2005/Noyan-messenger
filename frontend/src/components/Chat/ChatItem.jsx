export default function ChatItem({
  chat,
  active = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={` cursor-pointer w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors duration-200
        ${
          active
            ? "bg-gray-100"
            : "hover:bg-gray-50"
        }
      `}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={chat.avatar}
          alt={chat.name}
          className="w-11 h-11 rounded-full object-cover"
        />

        {chat.online && (
          <span
            className=" absolute right-0 bottom-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white
            "
          />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold text-gray-900">
            {chat.name}
          </span>

          <span className="shrink-0 text-xs text-gray-400">
            {chat.time}
          </span>
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-gray-500">
            {chat.lastMessage}
          </p>

          {chat.unread > 0 && (
            <span
              className=" flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 px-1.5 text-[10px] font-semibold text-white
              "
            >
              {chat.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}