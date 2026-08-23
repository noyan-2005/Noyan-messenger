import MessageStatus from "./MessageStatus";

export default function MessageBubble({
  message,
  repliedMessage,
  onReplyClick,
  highlighted
}) {
  const isSent = message.sender === "me";

  return (
    <div
      className={`flex w-full ${
        isSent ? "justify-end" : "justify-start"
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

        {/* Reply */}
        {repliedMessage && (
          <div
            onClick={()=> onReplyClick(repliedMessage.id)}
            className={`
              mb-2
              overflow-hidden
              rounded-lg
              border-l-4
              px-2.5
              py-1.5
              text-xs
              cursor-pointer

              ${
                isSent
                  ? "border-indigo-500 bg-black/5"
                  : "border-indigo-500 bg-gray-100/80"
              }
            `}
          >
            {/* Sender */}
            <p className="font-semibold text-indigo-600">
              {repliedMessage.sender === "me"
                ? "You"
                : "User"}
            </p>

            {/* Original message */}
            <p className="mt-0.5 truncate text-gray-500">
              {repliedMessage.text}
            </p>
          </div>
        )}

        {/* Message */}
        <p className="whitespace-pre-wrap break-words pr-16">
          {message.text}
        </p>

        {/* Meta */}
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
          <span>{message.time}</span>

          {/* Status */}
          {isSent && (
            <MessageStatus
              status={message.status}
            />
          )}
        </div>
      </div>
    </div>
  );
}