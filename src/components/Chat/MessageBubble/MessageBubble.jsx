import MessageStatus from "./MessageStatus";

export default function MessageBubble({ message }) {
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