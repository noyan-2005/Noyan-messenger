import {
  Paperclip,
  Smile,
  Send,
} from "lucide-react";

import ReplyPreview from "./ReplyPreview";

export default function MessageInput({
  value,
  onChange,
  onSend,
  onTyping,
  placeholder = "Write a message...",
  replyingTo,
  onCancelReply,
}) {
  // Handle typing
  const handleChange = (event) => {
    const newValue = event.target.value;

    // Update message value
    onChange(newValue);

    // Tell parent that user is typing
    onTyping?.(newValue);
  };

  // Handle Enter key
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (value.trim()) {
        onSend();
      }
    }
  };

  // Handle form submit
  const handleSubmit = (event) => {
    event.preventDefault();

    if (!value.trim()) return;

    onSend();
  };

  return (
    <div className="shrink-0 px-5 pt-1 pb-4 backdrop-blur-3xl" >

      {/* Reply Preview */}
      <div className="overflow-hidden rounded-t-3xl">
        <ReplyPreview
          message={replyingTo}
          onCancel={onCancelReply}
        />
      </div>  

      <form
        onSubmit={handleSubmit}
        className="
          flex
          items-end
          gap-2
          rounded-4xl
          border
          border-gray-200
          bg-gray-50
          p-1.5
          shadow-sm
          transition-all
          duration-200
          focus-within:border-indigo-300
          focus-within:bg-white
          focus-within:shadow-[0_8px_30px_rgba(99,102,241,0.08)]
        "
      >
        {/* Attachment */}
        <button
          type="button"
          aria-label="Attach file"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-3xl
            text-gray-500
            transition
            hover:bg-gray-100
            hover:text-gray-700
            hover:shadow-[0_5px_10px_rgba(99,102,241,0.48)]
          "
        >
          <Paperclip
            size={19}
            strokeWidth={1.8}
          />
        </button>

        {/* Input */}
        <textarea
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="
            max-h-32
            min-h-10
            flex-1
            resize-none
            bg-transparent
            px-1
            py-2.5
            text-sm
            leading-5
            text-gray-900
            outline-none
            placeholder:text-gray-400
          "
        />

        {/* Emoji */}
        <button
          type="button"
          aria-label="Add emoji"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            text-gray-400
            transition
            hover:text-gray-500
          "
        >
          <Smile
            size={27}
            strokeWidth={1.8}
          />
        </button>

        {/* Send */}
        <button
          type="submit"
          disabled={!value.trim()}
          aria-label="Send message"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-3xl
            bg-indigo-600
            pt-0.5
            pr-0.5
            text-white
            shadow-sm
            transition-all
            duration-200
            hover:bg-indigo-700
            hover:shadow-md
            active:scale-95
            disabled:cursor-not-allowed
            disabled:bg-gray-200
            disabled:text-gray-400
            disabled:shadow-none
          "
        >
          <Send
            size={18}
            strokeWidth={2}
          />
        </button>
      </form>
    </div>
  );
}