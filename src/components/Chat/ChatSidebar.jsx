import ChatItem from "./ChatItem";
import HeaderIcon from "../ui/HeaderIcon";
import ChatSearch from "./ChatSearch"
import Navbar from "./Navbar";

export default function ChatSidebar({
  chats = [],
  activeChatId,
  onSelectChat,
}) {
  return (
    <aside className="flex h-full w-75 shrink-0 flex-col border-r border-gray-200 bg-white">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-5">
        <HeaderIcon />
      </div>
        
        <ChatSearch />

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-2">
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            active={chat.id === activeChatId}
            onClick={() => onSelectChat?.(chat.id)}
          />
        ))}
      </div>

      {/* Navbar */}
        <Navbar />
    </aside>
  );
}