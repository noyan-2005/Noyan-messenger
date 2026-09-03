import ChatItem from "./ChatItem";
import HeaderIcon from "../ui/HeaderIcon";
import ChatSearch from "./ChatSearch";
import CreateChatButton from "./CreateChatButton";

export default function ChatSidebar({
  chats = [],
  activeChatId,
  onSelectChat,
}) {
  return (
    <aside
      className="
        flex
        h-full
        w-full
        shrink-0
        flex-col
        border-r
        border-gray-200
        bg-white

        md:w-75
      "
    >

      {/* Header */}

      <div
        className="
          flex
          items-center
          justify-between
          px-4
          py-4

          sm:px-5
          sm:py-5
        "
      >
        <HeaderIcon />
      </div>

      {/* Search */}

      <div className="px-1 sm:px-0">
        <ChatSearch />
      </div>

      {/* Chat List */}

      <div
        className="
          glass-scrollbar
          min-h-0
          flex-1
          overflow-y-auto
          px-2
        "
      >
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            active={
              chat.id === activeChatId
            }
            onClick={() =>
              onSelectChat?.(
                chat.id
              )
            }
          />
        ))}
      </div>
      <div className="relative shrink-0">
        <CreateChatButton />
      </div>
    </aside>
  );
}