import { useRef, useEffect, useState } from "react";
import MessageBubble from "./MessageBubble/MessageBubble";
import MessageContextMenu from "./MessageContextMenu/MessageContextMenu";

export default function MessageList({
  messages = [],
  onReply,
}) {
  const containerRef = useRef(null);
  const bottomRef = useRef(null);
  const messageRefs = useRef({});

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);

  const [contextMenu, setContextMenu] = useState(null);

  const [highlightedMessageId, setHighlightedMessageId] =
  useState(null);

  // -----------------------------
  // Scroll
  // -----------------------------

  const handleScroll = () => {
    const container = containerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight;

    const nearBottom = distanceFromBottom < 100;

    setIsNearBottom(nearBottom);

    if (nearBottom) {
      setNewMessageCount(0);
    }
  };

  // -----------------------------
  // New Messages
  // -----------------------------

  useEffect(() => {
    if (messages.length === 0) return;

    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    } else {
      setNewMessageCount((count) => count + 1);
    }
  }, [messages]);


  const handleReplyClick = (messageId) => {
    const messageElement = messageRefs.current[messageId];

    if (!messageElement) return;

    messageElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setHighlightedMessageId(messageId);

    setTimeout(() => {
      setHighlightedMessageId(null);
    }, 2200);
  };


  // -----------------------------
  // Context Menu
  // -----------------------------

  const handleContextMenu = (event, message) => {
    event.preventDefault();

    const menuWidth = 208;
    const menuHeight = 260;

    const x = Math.min(
      event.clientX,
      window.innerWidth - menuWidth - 10
    );

    const y = Math.min(
      event.clientY,
      window.innerHeight - menuHeight - 10
    );

    setContextMenu({
      message,
      x: Math.max(10, x),
      y: Math.max(10, y),
    });
  };

  // -----------------------------
  // Close Context Menu
  // -----------------------------

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  // Close with Escape
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeContextMenu();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClick = () => {
      closeContextMenu();
    };

    if (contextMenu) {
      window.addEventListener(
        "click",
        handleClick
      );
    }

    return () => {
      window.removeEventListener(
        "click",
        handleClick
      );
    };
  }, [contextMenu]);

  // -----------------------------
  // Scroll To Bottom
  // -----------------------------

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

    setNewMessageCount(0);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="
        glass-scrollbar
        relative
        flex
        h-full
        flex-col
        overflow-y-auto
        px-5
        py-3
      "
    >
      {/* Messages */}

      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <div
            ref={(element) => {
              messageRefs.current[message.id] = element;
            }}
            key={message.id}
            onContextMenu={(event) =>
              handleContextMenu(event, message)
            }
            onDoubleClick={() =>
              onReply?.(message)
            }
            className={`
              relative
              rounded-3xl
              transition-all
              duration-700
              ${
                highlightedMessageId === message.id
                  ? `
                    bg-gray-600/20
                    shadow-[0_0_40px_rgba(99,102,241,0.18)]
                  `
                  : ""
              }
            `}
          >
            <MessageBubble
              message={message}
              repliedMessage = {
                message.replyTo 
                  ? messages.find(
                      (msg) => msg.id === message.replyTo
                    ) 
                  : null
              }
              onReplyClick = {handleReplyClick}
              highlighted={
                highlightedMessageId === message.id
              }
            />
          </div>
        ))}
      </div>

      {/* Bottom Anchor */}

      <div ref={bottomRef} />

      {/* New Messages */}

      {newMessageCount > 0 && (
        <button
          type="button"
          onClick={scrollToBottom}
          className="
            sticky
            bottom-4
            z-10
            mx-auto
            flex
            items-center
            gap-2
            rounded-full
            border
            border-white/70
            bg-white/80
            px-4
            py-2
            text-xs
            font-medium
            text-gray-700
            shadow-lg
            backdrop-blur-md
            transition-all
            duration-200
            hover:bg-white
            hover:shadow-xl
            active:scale-95
          "
        >
          <span className="text-indigo-500">
            ↓
          </span>

          {newMessageCount} new message
          {newMessageCount > 1 ? "s" : ""}
        </button>
      )}

      {/* Context Menu */}

      {contextMenu && (
        <MessageContextMenu
          message={contextMenu.message}
          x={contextMenu.x}
          y={contextMenu.y}
          onReply={onReply}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}