import {
  FileText,
  Music,
  Download,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

import MessageStatus from "./MessageStatus";

export default function MessageBubble({
  message,
  repliedMessage,
  onReplyClick,
  highlighted,
}) {
  const { user } = useAuth();

  /*
   * تشخیص پیام ارسالی
   *
   * حالت‌های قابل پشتیبانی:
   * 1. sender === "me"
   * 2. sender === username کاربر فعلی
   */
  const isSent =
    message.sender === "me" ||
    message.sender === user?.username;

  const attachments = message.attachments || [];

  const formatFileSize = (bytes) => {
    if (!bytes) return "";

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    if (bytes < 1024 * 1024 * 1024) {
      return `${(
        bytes /
        (1024 * 1024)
      ).toFixed(1)} MB`;
    }

    return `${(
      bytes /
      (1024 * 1024 * 1024)
    ).toFixed(1)} GB`;
  };

  return (
    <div
      className={`flex w-full ${
        isSent
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`
          relative
          max-w-[75%]
          px-3
          py-2
          text-sm
          leading-5
          shadow-sm
          transition-all
          duration-700

          ${
            highlighted
              ? "brightness-90 shadow-md"
              : ""
          }

          ${
            isSent
              ? `
                rounded-2xl
                rounded-br-md
                bg-[#E7FFDB]
                text-gray-900
              `
              : `
                rounded-2xl
                rounded-bl-md
                bg-white
                text-gray-900
              `
          }
        `}
      >

        {/* ========================= */}
        {/* Reply */}
        {/* ========================= */}

        {repliedMessage && (
          <div
            onClick={() =>
              onReplyClick(
                repliedMessage.id
              )
            }
            className={`
              mb-2
              cursor-pointer
              overflow-hidden
              rounded-lg
              border-l-4
              px-2.5
              py-1.5
              text-xs

              ${
                isSent
                  ? "border-indigo-500 bg-black/5"
                  : "border-indigo-500 bg-gray-100/80"
              }
            `}
          >
            {/* Sender */}

            <p className="font-semibold text-indigo-600">
              {repliedMessage.sender ===
                "me" ||
              repliedMessage.sender ===
                user?.username
                ? "You"
                : repliedMessage.sender ||
                  "User"}
            </p>

            {/* Original message */}

            <p className="mt-0.5 truncate text-gray-500">
              {repliedMessage.text ||
                "Attachment"}
            </p>
          </div>
        )}

        {/* ========================= */}
        {/* Attachments */}
        {/* ========================= */}

        {attachments.length > 0 && (
          <div
            className={`
              flex
              flex-col
              gap-2
              ${
                message.text
                  ? "mb-2"
                  : ""
              }
            `}
          >
            {attachments.map(
              (attachment) => {
                const file =
                  attachment.file;

                if (!file) return null;

                const isImage =
                  file.type?.startsWith(
                    "image/"
                  );

                const isVideo =
                  file.type?.startsWith(
                    "video/"
                  );

                const isAudio =
                  file.type?.startsWith(
                    "audio/"
                  );

                {/* ========================= */}
                {/* Image */}
                {/* ========================= */}

                if (
                  isImage &&
                  attachment.preview
                ) {
                  return (
                    <div
                      key={
                        attachment.id
                      }
                      className="
                        relative
                        overflow-hidden
                        rounded-xl
                      "
                    >
                      <img
                        src={
                          attachment.preview
                        }
                        alt={
                          file.name
                        }
                        className="
                          block
                          max-h-[400px]
                          max-w-full
                          rounded-xl
                          object-cover
                        "
                      />
                    </div>
                  );
                }

                {/* ========================= */}
                {/* Video */}
                {/* ========================= */}

                if (
                  isVideo &&
                  attachment.preview
                ) {
                  return (
                    <div
                      key={
                        attachment.id
                      }
                      className="
                        relative
                        overflow-hidden
                        rounded-xl
                        bg-black
                      "
                    >
                      <video
                        src={
                          attachment.preview
                        }
                        controls
                        playsInline
                        className="
                          block
                          max-h-[400px]
                          max-w-full
                          rounded-xl
                        "
                      />
                    </div>
                  );
                }

                {/* ========================= */}
                {/* Audio */}
                {/* ========================= */}

                if (isAudio) {
                  return (
                    <div
                      key={
                        attachment.id
                      }
                      className="
                        flex
                        min-w-64
                        max-w-full
                        items-center
                        gap-3
                        rounded-xl
                        bg-black/5
                        px-3
                        py-2.5
                      "
                    >
                      {/* Audio Icon */}

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-full
                          bg-indigo-100
                          text-indigo-600
                        "
                      >
                        <Music
                          size={18}
                          strokeWidth={1.8}
                        />
                      </div>

                      {/* Audio Info */}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">
                          {file.name}
                        </p>

                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {formatFileSize(
                            file.size
                          )}
                        </p>

                        <audio
                          src={
                            attachment.preview
                          }
                          controls
                          className="
                            mt-1
                            h-7
                            w-full
                          "
                        />
                      </div>
                    </div>
                  );
                }

                {/* ========================= */}
                {/* Other File */}
                {/* ========================= */}

                return (
                  <div
                    key={
                      attachment.id
                    }
                    className="
                      flex
                      min-w-64
                      max-w-full
                      items-center
                      gap-3
                      rounded-xl
                      bg-black/5
                      px-3
                      py-2.5
                    "
                  >
                    {/* File Icon */}

                    <div
                      className="
                        flex
                        h-10
                        w-10
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        bg-white
                        text-gray-500
                        shadow-sm
                      "
                    >
                      <FileText
                        size={20}
                        strokeWidth={1.8}
                      />
                    </div>

                    {/* File Info */}

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-800">
                        {file.name}
                      </p>

                      <p className="mt-0.5 text-[10px] text-gray-500">
                        {formatFileSize(
                          file.size
                        )}
                      </p>
                    </div>

                    {/* Download */}

                    <button
                      type="button"
                      aria-label={`Download ${file.name}`}
                      onClick={() => {
                        const url =
                          URL.createObjectURL(
                            file
                          );

                        const link =
                          document.createElement(
                            "a"
                          );

                        link.href =
                          url;

                        link.download =
                          file.name;

                        document.body.appendChild(
                          link
                        );

                        link.click();

                        link.remove();

                        URL.revokeObjectURL(
                          url
                        );
                      }}
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-gray-500
                        transition
                        hover:bg-white
                        hover:text-gray-800
                      "
                    >
                      <Download
                        size={17}
                        strokeWidth={1.8}
                      />
                    </button>
                  </div>
                );
              }
            )}
          </div>
        )}

        {/* ========================= */}
        {/* Message Text */}
        {/* ========================= */}

        {message.text && (
          <p
            className="
              font-emoji
              whitespace-pre-wrap
              break-words
              pr-16
            "
          >
            {message.text}
          </p>
        )}

        {/* ========================= */}
        {/* Meta */}
        {/* ========================= */}

        <div
          className={`
            absolute
            bottom-1
            right-2
            flex
            items-center
            gap-1
            text-[10px]

            ${
              isSent
                ? "text-gray-500"
                : "text-gray-400"
            }
          `}
        >
          {/* Time */}

          <span>
            {message.time}
          </span>

          {/* Status */}

          {isSent && (
            <MessageStatus
              status={
                message.status
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
