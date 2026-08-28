import {
  Paperclip,
  Smile,
  Send,
  Image,
  FileText,
  MapPin,
  BarChart3,
  UserRound,
  Music,
  Camera,
  X,
} from "lucide-react";

import { useRef, useEffect, useState } from "react";

import ReplyPreview from "./ReplyPreview";
import ChatEmojiPicker from "./EmojiPicker";

export default function MessageInput({
  value,
  onChange,
  onSend,
  onTyping,
  placeholder = "Write a message...",
  replyingTo,
  onCancelReply,
}) {
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Attachments
  const [attachmentType, setAttachmentType] = useState(null);
  const [attachments, setAttachments] = useState([]);

  // Emoji Picker
  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (replyingTo) {
      inputRef.current?.focus();
    }
  }, [replyingTo]);

  // Handle typing
  const handleChange = (event) => {
    const newValue = event.target.value;

    onChange(newValue);
    onTyping?.(newValue);
  };

  // Handle Enter key
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      if (value.trim() || attachments.length > 0) {
        handleSend();
      }
    }
  };

  // Open file picker
  const openFilePicker = (type) => {
    setAttachmentType(type);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Handle selected files
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);

    if (!files.length) return;

    const newAttachments = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      file,
      type: attachmentType,
      preview:
        file.type.startsWith("image/") ||
        file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : null,
    }));

    setAttachments((prev) => [
      ...prev,
      ...newAttachments,
    ]);

    event.target.value = "";
    setAttachmentType(null);
  };

  // Remove attachment
  const removeAttachment = (id) => {
    setAttachments((prev) => {
      const attachment = prev.find(
        (item) => item.id === id
      );

      if (attachment?.preview) {
        URL.revokeObjectURL(attachment.preview);
      }

      return prev.filter(
        (item) => item.id !== id
      );
    });
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  // Get accepted file types
  const getAcceptedFiles = () => {
    switch (attachmentType) {
      case "media":
        return "image/*,video/*";

      case "audio":
        return "audio/*";

      case "file":
        return "*/*";

      default:
        return "*/*";
    }
  };

  // Send message + attachments
  const handleSend = () => {
    const trimmedValue = value.trim();

    if (!trimmedValue && attachments.length === 0) {
      return;
    }

    const messageData = {
      text: trimmedValue,
      attachments: attachments.map((attachment) => ({
        id: attachment.id,
        file: attachment.file,
        type: attachment.type,
        preview: attachment.preview,
      })),
    };

    // Send to parent
    onSend(messageData);
    
    // Clear attachments
    setAttachments([]);

    // Clear input
    onChange("");

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Attachment options
  const attachmentOptions = [
    {
      label: "Photos & Videos",
      icon: Image,
      action: () => openFilePicker("media"),
    },
    {
      label: "File",
      icon: FileText,
      action: () => openFilePicker("file"),
    },
    {
      label: "Location",
      icon: MapPin,
    },
    {
      label: "Poll",
      icon: BarChart3,
    },
    {
      label: "Contact",
      icon: UserRound,
    },
    {
      label: "Audio",
      icon: Music,
      action: () => openFilePicker("audio"),
    },
    {
      label: "Camera",
      icon: Camera,
    },
  ];

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(
          ".emoji-picker-container"
        ) &&
        !event.target.closest(".emoji-trigger")
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showEmojiPicker]);

  return (
    <div className="relative shrink-0 px-5 pt-1 pb-4 backdrop-blur-3xl">

      {/* Reply Preview */}
      <div className="overflow-hidden rounded-t-3xl">
        <ReplyPreview
          message={replyingTo}
          onCancel={onCancelReply}
        />
      </div>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div
          className="
            emoji-picker-container
            absolute
            bottom-full
            right-5
            z-100
            mb-3
            overflow-hidden
            rounded-3xl
            border
            border-white/60
            bg-white/70
            shadow-[0_20px_60px_rgba(0,0,0,0.15)]
            backdrop-blur-2xl
            transition-all
            duration-200
            ease-out
            origin-bottom-right
            animate-emoji-picker
          "
        >
          <ChatEmojiPicker
            onEmojiClick={(emojiData) => {
              onChange(value + emojiData.emoji);
            }}
          />
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedFiles()}
        multiple={attachmentType !== "audio"}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Attachment Preview */}
      {attachments.length > 0 && (
        <div
          className="
            mb-2
            overflow-hidden
            rounded-3xl
            border
            border-gray-200
            bg-gray-50/30
            p-1.5
            shadow-sm
            backdrop-blur-xl
          "
        >
          <div className="flex items-center gap-2 overflow-x-auto">

            {attachments.map((attachment) => {
              const { file, preview } = attachment;

              const isImage =
                file.type.startsWith("image/");

              const isVideo =
                file.type.startsWith("video/");

              const isAudio =
                file.type.startsWith("audio/");

              return (
                <div
                  key={attachment.id}
                  className="
                    group
                    relative
                    h-24
                    w-24
                    shrink-0
                    overflow-hidden
                    rounded-2xl
                    border
                    border-gray-200
                    bg-white
                  "
                >
                  {/* Image */}
                  {isImage && preview && (
                    <img
                      src={preview}
                      alt={file.name}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />
                  )}

                  {/* Video */}
                  {isVideo && preview && (
                    <video
                      src={preview}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                      muted
                      playsInline
                    />
                  )}

                  {/* File / Audio */}
                  {!isImage && !isVideo && (
                    <div
                      className="
                        flex
                        h-full
                        w-full
                        flex-col
                        items-center
                        justify-center
                        gap-1
                        px-2
                        text-center
                      "
                    >
                      {isAudio ? (
                        <Music
                          size={25}
                          strokeWidth={1.7}
                          className="text-indigo-500"
                        />
                      ) : (
                        <FileText
                          size={25}
                          strokeWidth={1.7}
                          className="text-gray-500"
                        />
                      )}

                      <span
                        className="
                          max-w-full
                          truncate
                          text-[10px]
                          text-gray-600
                        "
                      >
                        {file.name}
                      </span>
                    </div>
                  )}

                  {/* Video indicator */}
                  {isVideo && (
                    <div
                      className="
                        pointer-events-none
                        absolute
                        bottom-1.5
                        left-1.5
                        flex
                        h-6
                        w-6
                        items-center
                        justify-center
                        rounded-full
                        bg-black/50
                        text-xs
                        text-white
                        backdrop-blur-sm
                      "
                    >
                      ▶
                    </div>
                  )}

                  {/* File size */}
                  {!isImage && (
                    <div
                      className="
                        absolute
                        bottom-1
                        right-1
                        rounded-md
                        bg-black/50
                        px-1
                        py-0.5
                        text-[9px]
                        text-white
                        backdrop-blur-sm
                      "
                    >
                      {formatFileSize(file.size)}
                    </div>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() =>
                      removeAttachment(
                        attachment.id
                      )
                    }
                    aria-label={`Remove ${file.name}`}
                    className="
                      absolute
                      right-1.5
                      top-1.5
                      flex
                      h-6
                      w-6
                      cursor-pointer
                      items-center
                      justify-center
                      rounded-full
                      bg-black/55
                      text-xs
                      text-white
                      opacity-0
                      backdrop-blur-sm
                      transition
                      group-hover:opacity-100
                      hover:bg-red-500
                    "
                  >
                    <X size={17} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleSend();
        }}
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
        <div className="attachment-container group relative shrink-0">

          {/* Attachment Menu */}
          <div
            className="
              absolute
              bottom-full
              left-0
              z-50
              mb-3
              w-52
              origin-bottom-left
              rounded-2xl
              border
              border-white/60
              bg-white/60
              p-1
              shadow-[0_20px_60px_rgba(0,0,0,0.15)]
              backdrop-blur-2xl

              invisible
              translate-y-2
              scale-95
              opacity-0

              transition-all
              duration-200
              ease-out

              group-hover:visible
              group-hover:translate-y-0
              group-hover:scale-100
              group-hover:opacity-100
            "
          >
            {attachmentOptions.map((option) => {
              const Icon = option.icon;

              return (
                <button
                  key={option.label}
                  type="button"
                  onClick={option.action}
                  className="
                    flex
                    w-full
                    cursor-pointer
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    text-gray-600
                    transition-all
                    duration-150
                    hover:bg-gray-100
                    hover:text-gray-900
                  "
                >
                  <span
                    className="
                      flex
                      h-7
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gray-100
                      text-gray-500
                    "
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                    />
                  </span>

                  <span>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Paperclip */}
          <button
            type="button"
            aria-label="Attach file"
            className="
              flex
              h-10
              w-10
              shrink-0
              cursor-pointer
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
        </div>

        {/* Input */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          className="
            font-emoji
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
          onClick={() =>
            setShowEmojiPicker((prev) => !prev)
          }
          className="
            cursor-pointer
            emoji-trigger
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
          disabled={
            !value.trim() &&
            attachments.length === 0
          }
          aria-label="Send message"
          className="
            cursor-pointer
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