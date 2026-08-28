import {
  Reply,
  Smile,
  Copy,
  Forward,
  Trash2,
} from "lucide-react";

export default function MessageContextMenu({
  x,
  y,
  message,
  onReply,
  onReaction,
  onCopy,
  onForward,
  onDelete,
  onClose,
}) {
  if (!message) return null;

  const handleCopy = async () => {
    try {
      if (message.text) {
        await navigator.clipboard.writeText(
          message.text
        );
      }

      onCopy?.(message);
    } catch (error) {
      console.error(
        "Failed to copy message:",
        error
      );
    }

    onClose();
  };

  return (
    <div
      className="
        fixed
        z-[100]
        w-52
        overflow-hidden
        rounded-2xl
        border
        border-white/70
        bg-white/90
        p-1.5
        shadow-[0_12px_40px_rgba(0,0,0,0.15)]
        backdrop-blur-xl
        context-menu-enter
      "
      style={{
        left: x,
        top: y,
      }}
      onClick={(event) =>
        event.stopPropagation()
      }
    >
      {/* Reply */}
      <button
        type="button"
        onClick={() => {
          onReply?.(message);
          onClose();
        }}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          text-sm
          text-gray-700
          transition
          hover:bg-gray-100
        "
      >
        <Reply size={17} />
        <span>Reply</span>
      </button>

      {/* Reaction */}
      <button
        type="button"
        onClick={() => {
          onReaction?.(message);
          onClose();
        }}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          text-sm
          text-gray-700
          transition
          hover:bg-gray-100
        "
      >
        <Smile size={17} />
        <span>Add Reaction</span>
      </button>

      {/* Copy */}
      <button
        type="button"
        onClick={handleCopy}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          text-sm
          text-gray-700
          transition
          hover:bg-gray-100
        "
      >
        <Copy size={17} />
        <span>Copy</span>
      </button>

      {/* Forward */}
      <button
        type="button"
        onClick={() => {
          onForward?.(message);
          onClose();
        }}
        className="
          flex
          w-full
          items-center
          gap-3
          rounded-xl
          px-3
          py-2.5
          text-sm
          text-gray-700
          transition
          hover:bg-gray-100
        "
      >
        <Forward size={17} />
        <span>Forward</span>
      </button>

      {/* Delete */}
      {message.sender === "me" && (
        <>
          <div className="my-1 border-t border-gray-100" />

          <button
            type="button"
            onClick={() => {
              onDelete?.(message);
              onClose();
            }}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-2.5
              text-sm
              text-red-500
              transition
              hover:bg-red-50
            "
          >
            <Trash2 size={17} />
            <span>Delete</span>
          </button>
        </>
      )}
    </div>
  );
}