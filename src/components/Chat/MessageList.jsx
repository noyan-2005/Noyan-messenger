import MessageBubble from "./MessageBubble";

export default function MessageList({ messages = [] }) {
  return (
    <div
      className="
        flex
        flex-1
        flex-col
        gap-3
        overflow-y-auto
        bg-gray-50
        px-5
        py-6
      "
    >
      {messages.length > 0 ? (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
          />
        ))
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-gray-400">
            No messages yet
          </p>
        </div>
      )}
    </div>
  );
}