
import { useState } from "react";
import ChatSidebar from "./ChatSidebar";
import chats from "../../data/chatData";
import messages from "../../data/messages";
import initialMessages from "../../data/messages";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";


export default function ChatLayout() {
  const [activeChatId, setActiveChatId] = useState(
    chats[0]?.id
  );

  const [messages, setMessages] = useState(
    initialMessages
  );

  const [message, setMessage] = useState("");

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const activeMessages =
    messages[activeChatId] || [];

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
  };

  const handleSendMessage = () => {
    const text = message.trim();

    if (!text) return;

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      seen: false,
    };

    setMessages((prev) => ({
      ...prev,

      [activeChatId]: [
        ...(prev[activeChatId] || []),
        newMessage,
      ],
    }));

    setMessage("");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
      />

      {/* Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col">

        {/* Header */}
        <ChatHeader
          chat={activeChat}
          isTyping={false}
        />

        {/* Messages */}
        <MessageList
          messages={activeMessages}
        />

        {/* Input */}
        <MessageInput
          value={message}
          onChange={setMessage}
          onSend={handleSendMessage}
        />

      </main>
    </div>
  );
}