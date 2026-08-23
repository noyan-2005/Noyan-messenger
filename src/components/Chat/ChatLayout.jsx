import { useState } from "react";

import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

import chats from "../../data/chatData";
import initialMessages from "../../data/messages";

export default function ChatLayout() {
  const [activeChatId, setActiveChatId] = useState(
    chats[0]?.id
  );

  const [messages, setMessages] = useState(
    initialMessages
  );

  const [message, setMessage] = useState("");

  const [typingUsers, setTypingUsers] = useState({});

  const [replyingTo, setReplyingTo] = useState(null);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const activeMessages =
    messages[activeChatId] || [];

  const isTyping =
    typingUsers[activeChatId] ?? false;

  // -----------------------------
  // Select Chat
  // -----------------------------

  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setReplyingTo(null);
  };

  // -----------------------------
  // Send Message
  // -----------------------------

  const handleSendMessage = () => {
    const text = message.trim();

    if (!text) return;

    const newMessage = {
      id: Date.now(),
      sender: "theme",
      text,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: "sending",

      replyTo: replyingTo
        ? replyingTo.id
        : null,
    };

    setMessages((prev) => ({
      ...prev,

      [activeChatId]: [
        ...(prev[activeChatId] || []),
        newMessage,
      ],
    }));

    setMessage("");

    // بعد از ارسال، Reply Preview بسته شود
    setReplyingTo(null);

    // -----------------------------
    // Mock Message Status
    // -----------------------------

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,

        [activeChatId]: (
          prev[activeChatId] || []
        ).map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                status: "sent",
              }
            : msg
        ),
      }));
    }, 500);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,

        [activeChatId]: (
          prev[activeChatId] || []
        ).map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                status: "delivered",
              }
            : msg
        ),
      }));
    }, 1000);

    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,

        [activeChatId]: (
          prev[activeChatId] || []
        ).map((msg) =>
          msg.id === newMessage.id
            ? {
                ...msg,
                status: "seen",
              }
            : msg
        ),
      }));
    }, 2000);
  };

  // -----------------------------
  // Mock Typing
  // -----------------------------

  const simulateTyping = (chatId) => {
    setTypingUsers((prev) => ({
      ...prev,
      [chatId]: true,
    }));

    setTimeout(() => {
      setTypingUsers((prev) => ({
        ...prev,
        [chatId]: false,
      }));
    }, 2000);
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

      <main
        className="
          relative
          flex
          min-w-0
          flex-1
          flex-col
          overflow-hidden
          bg-cover
          bg-center
        "
        style={{
          backgroundImage:
            "url('/patern.jpg')",
        }}
      >

        {/* Header */}

        <div className="relative z-10 shrink-0">
          <ChatHeader
            chat={activeChat}
            isTyping={isTyping}
          />
        </div>

        {/* Messages */}

        <div className="relative z-50 min-h-0 flex-1">
          <MessageList
            messages={activeMessages}
            onReply={(message) => {
              setReplyingTo(message);
            }}
          />
        </div>

        {/* Input */}

        <div className="relative z-10 shrink-0">
          <MessageInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>

        {/* Temporary Testing Button */}

        <button
          type="button"
          onClick={() =>
            simulateTyping(activeChatId)
          }
          className="
            absolute
            bottom-44
            left-5
            z-50
            rounded-lg
            bg-indigo-600
            px-3
            py-2
            text-xs
            text-white
            shadow-md
            transition
            hover:bg-indigo-700
          "
        >
          Simulate Typing
        </button>

      </main>
    </div>
  );
}