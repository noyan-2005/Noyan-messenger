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

  const handleSendMessage = (messageData) => {
    const text =
      messageData?.text?.trim() || "";

    const attachments =
      messageData?.attachments || [];

    if (
      !text &&
      attachments.length === 0
    ) {
      return;
    }

    const newMessage = {
      id: Date.now(),
      sender: "me",
      text,
      attachments,

      time: new Date().toLocaleTimeString(
        [],
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      ),

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
  // Reply
  // -----------------------------

  const handleReplyMessage = (message) => {
    setReplyingTo(message);
  };

  // -----------------------------
  // Delete Message
  // -----------------------------

  const handleDeleteMessage = (
    message
  ) => {
    setMessages((prev) => ({
      ...prev,

      [activeChatId]: (
        prev[activeChatId] || []
      ).filter(
        (msg) => msg.id !== message.id
      ),
    }));
  };

  // -----------------------------
  // Copy Message
  // -----------------------------

  const handleCopyMessage = (message) => {
    console.log(
      "Message copied:",
      message.id
    );
  };

  // -----------------------------
  // Forward Message
  // -----------------------------

  const handleForwardMessage = (
    message
  ) => {
    console.log(
      "Forward message:",
      message
    );
  };

  // -----------------------------
  // Reaction
  // -----------------------------

  const handleReaction = (message) => {
    console.log(
      "Reaction:",
      message
    );
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
            onReply={handleReplyMessage}
            onCopy={handleCopyMessage}
            onForward={
              handleForwardMessage
            }
            onDelete={
              handleDeleteMessage
            }
            onReaction={handleReaction}
          />
        </div>

        {/* Input */}

        <div className="relative z-50 shrink-0">
          <MessageInput
            value={message}
            onChange={setMessage}
            onSend={handleSendMessage}
            onTyping={(value) => {
              // Typing handler
            }}
            replyingTo={replyingTo}
            onCancelReply={() =>
              setReplyingTo(null)
            }
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