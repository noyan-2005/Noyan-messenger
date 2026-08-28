export default function TypingIndicator() {
  return (
    <div className="flex h-4 items-center gap-1">
      <span className="text-xs leading-4 text-indigo-500">
        typing
      </span>

      <span className="flex items-center gap-0.5">
        <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-indigo-500" />
      </span>
    </div>
  );
}