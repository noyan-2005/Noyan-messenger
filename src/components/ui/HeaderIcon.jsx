export default function HeaderIcon() {
  return (
    <div className="group flex items-center gap-3">
      {/* Logo */}
      <div
        className="
          relative
          flex h-11 w-11
          items-center justify-center
          overflow-hidden
          rounded-xl
          border border-white/10
          bg-white/5
          shadow-[0_8px_30px_rgba(0,0,0,0.12)]
          backdrop-blur-md
          transition-all
          duration-300
          group-hover:scale-105
          group-hover:border-white/20
          group-hover:shadow-[0_8px_35px_rgba(99,102,241,0.25)]
        "
      >
        <img
          src="/icon.png"
          alt="Noyan"
          className="
            h-8 w-8
            object-contain
            transition-transform
            duration-300
            group-hover:scale-110
          "
        />

        {/* Glow */}
        <span
          className="
            pointer-events-none
            absolute inset-0
            rounded-xl
            bg-indigo-500/10
            opacity-0
            blur-xl
            transition-opacity
            duration-300
            group-hover:opacity-100
          "
        />
      </div>

      {/* Brand */}
      <div className="flex flex-col">
        <h3
          className="
            bg-gradient-to-r
            from-gray-900
            via-gray-700
            to-indigo-600
            bg-clip-text
            text-lg
            font-bold
            tracking-tight
            text-transparent
          "
        >
          Noyan
        </h3>

        <span
          className="
            text-[10px]
            font-medium
            uppercase
            tracking-[0.2em]
            text-gray-400
          "
        >
          Messenger
        </span>
      </div>
    </div>
  );
}