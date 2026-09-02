import { useEffect, useState } from "react";

import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageList from "./MessageList";

import { useAuth } from "../../context/AuthContext";

export default function ChatLayout() {
  const { user } = useAuth();

  const [chats, setChats] = useState([]);

  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState({});

  const [message, setMessage] = useState("");

  const [typingUsers, setTypingUsers] =
    useState({});

  const [replyingTo, setReplyingTo] =
    useState(null);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  // -----------------------------
  // Fetch Chats
  // -----------------------------
    useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/accounts/chats/",
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Failed to fetch chats:", data);
          return;
        }

        console.log("Chats from API:", data);

       const formattedChats = (data.chats || []).map(
        (chat) => ({
          id: chat.id,

          name:
            chat.name ||
            (chat.type === "private"
              ? "Private Chat"
              : "Unnamed Group"),

          avatar: `https://ui-avatars.com/api/?name=${
            encodeURIComponent(
              chat.name ||
                (chat.type === "private"
                  ? "Private Chat"
                  : "Group")
            )
          }&background=random`,

          online: false,

          time: chat.last_message?.created_at
            ? new Date(
                chat.last_message.created_at
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",

          lastMessage:
            chat.last_message?.content ||
            "No messages yet",

          unread: chat.unread_count || 0,

          type: chat.type,
        })
      );

      setChats(formattedChats);

      if (formattedChats.length > 0) {
        setActiveChatId(
          formattedChats[0].id
        );
      }
            } catch (error) {
              console.error("Error fetching chats:", error);
            }
          };

          if (user) {
            fetchChats();
          }
        }, [user]);
  // -----------------------------
  // Fetch Messages
  // -----------------------------

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/api/accounts/messages/?chat=${activeChatId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          console.error(
            "Failed to fetch messages:",
            data
          );
          return;
        }

        console.log(
          "Messages from API:",
          data
        );

        const formattedMessages = [
          ...data.messages,
        ]
          .reverse()
          .map((msg) => ({
            id: msg.id,

            /*
             * پیام خود کاربر را "me" نگه می‌داریم
             * تا MessageBubble بتواند آن را
             * به عنوان پیام ارسالی تشخیص دهد.
             */
            sender:
              msg.sender === user?.username
                ? "me"
                : msg.sender,

            text: msg.content,

            attachments:
              msg.attachments || [],

            time: new Date(
              msg.created_at
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),

            status: "seen",

            /*
             * فعلاً ID پیام Reply شده را نگه می‌داریم.
             * MessageList با همین ID پیام اصلی
             * را از messages پیدا می‌کند.
             */
            replyTo: msg.reply_to
              ? msg.reply_to.id
              : null,
          }));

        setMessages((prev) => ({
          ...prev,
          [activeChatId]:
            formattedMessages,
        }));
      } catch (error) {
        console.error(
          "Error fetching messages:",
          error
        );
      }
    };

    if (
      activeChatId &&
      user?.username
    ) {
      fetchMessages();
    }
  }, [
    activeChatId,
    user?.username,
  ]);

  // -----------------------------
  // Active Chat
  // -----------------------------

  const activeChat = chats.find(
    (chat) =>
      chat.id === activeChatId
  );

  const activeMessages =
    messages[activeChatId] || [];

  const isTyping =
    typingUsers[activeChatId] ?? false;

  // -----------------------------
  // Select Chat
  // -----------------------------

  const handleSelectChat = (
    chatId
  ) => {
    setActiveChatId(chatId);
    setReplyingTo(null);
    setIsSidebarOpen(false);
  };

  // -----------------------------
  // Send Message
  // -----------------------------

  const handleSendMessage = async (
    messageData
  ) => {
    const text =
      messageData?.text?.trim() || "";

    if (!text) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/accounts/message/",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            content: text,
            chat: activeChatId,

            ...(replyingTo
              ? {
                  reply_to:
                    replyingTo.id,
                }
              : {}),
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          "Failed to send message:",
          data
        );
        return;
      }

      console.log(
        "Message sent:",
        data
      );

      const serverMessage =
        data.message;

      const formattedMessage = {
        id: serverMessage.id,

        /*
         * این پیام همین الان توسط
         * کاربر فعلی ارسال شده است.
         */
        sender: "me",

        text:
          serverMessage.content,

        attachments:
          serverMessage.attachments ||
          [],

        time: new Date(
          serverMessage.created_at
        ).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),

        status: "sent",

        replyTo:
          serverMessage.reply_to
            ? serverMessage.reply_to.id
            : null,
      };

      setMessages((prev) => ({
        ...prev,

        [activeChatId]: [
          ...(prev[activeChatId] ||
            []),
          formattedMessage,
        ],
      }));

      setMessage("");
      setReplyingTo(null);
    } catch (error) {
      console.error(
        "Error sending message:",
        error
      );
    }
  };

  // -----------------------------
  // Reply
  // -----------------------------

  const handleReplyMessage = (
    message
  ) => {
    setReplyingTo(message);
  };

  // -----------------------------
  // Delete Message
  // -----------------------------

  const handleDeleteMessage = async (message) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/accounts/messages/${message.id}/delete/`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to delete message:", data);
        return;
      }

      console.log("Message deleted:", data);

      // Remove message from MessageList
      setMessages((prev) => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).filter(
          (msg) => msg.id !== message.id
        ),
      }));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  // -----------------------------
  // Copy
  // -----------------------------

  const handleCopyMessage = (
    message
  ) => {
    console.log(
      "Message copied:",
      message.id
    );
  };

  // -----------------------------
  // Forward
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

  const handleReaction = (
    message
  ) => {
    console.log(
      "Reaction:",
      message
    );
  };

  // -----------------------------
  // Mock Typing
  // -----------------------------

  const simulateTyping = (
    chatId
  ) => {
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

      {/* ================================= */}
      {/* Desktop Sidebar + Mobile Drawer */}
      {/* ================================= */}

      <div
        className={`
          fixed
          inset-0
          z-[80]
          md:relative
          md:inset-auto
          md:z-auto

          ${
            isSidebarOpen
              ? "visible"
              : "invisible md:visible"
          }
        `}
      >
        {/* Mobile Overlay */}

        <div
          onClick={() =>
            setIsSidebarOpen(false)
          }
          className={`
            absolute
            inset-0
            bg-black/30
            backdrop-blur-[2px]
            transition-opacity
            duration-300
            ease-out
            md:hidden

            ${
              isSidebarOpen
                ? "opacity-100"
                : "opacity-0"
            }
          `}
        />

        {/* Sidebar */}

        <div
          className={`
            relative
            z-10
            h-full
            w-[min(85vw,300px)]
            shadow-2xl

            transform
            transition-transform
            duration-300
            ease-[cubic-bezier(0.22,1,0.36,1)]

            ${
              isSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full"
            }

            md:w-auto
            md:translate-x-0
            md:shadow-none
          `}
        >
          <ChatSidebar
            chats={chats}
            activeChatId={
              activeChatId
            }
            onSelectChat={
              handleSelectChat
            }
          />
        </div>
      </div>

      {/* ================================= */}
      {/* Chat Area */}
      {/* ================================= */}

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
            onMenuClick={() =>
              setIsSidebarOpen(true)
            }
          />
        </div>

        {/* Messages */}

        <div className="relative z-50 min-h-0 flex-1">
          <MessageList
            messages={activeMessages}
            onReply={
              handleReplyMessage
            }
            onCopy={
              handleCopyMessage
            }
            onForward={
              handleForwardMessage
            }
            onDelete={
              handleDeleteMessage
            }
            onReaction={
              handleReaction
            }
          />
        </div>

        {/* Input */}

        <div className="relative z-50 shrink-0">
          <MessageInput
            value={message}
            onChange={setMessage}
            onSend={
              handleSendMessage
            }
            onTyping={() => {}}
            replyingTo={
              replyingTo
            }
            onCancelReply={() =>
              setReplyingTo(null)
            }
          />
        </div>

        {/* Temporary Testing Button */}

        <button
          type="button"
          onClick={() =>
            simulateTyping(
              activeChatId
            )
          }
          className="
            absolute
            bottom-44
            left-5
            z-50
            hidden
            rounded-lg
            bg-indigo-600
            px-3
            py-2
            text-xs
            text-white
            shadow-md
            transition
            hover:bg-indigo-700
            md:block
          "
        >
          Simulate Typing
        </button>

      </main>
    </div>
  );
}
