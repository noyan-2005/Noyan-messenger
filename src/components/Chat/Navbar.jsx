import { MessagesSquare, Settings, Contact } from "lucide-react";

export default function Navbar() {
  return (
    <nav className=" flex relative bottom-4 z-50 items-center justify-center rounded-[90px] bg-white/10 backdrop-blur-2xl ">
      <div
        className="
          flex items-center gap-1
          rounded-[90px]
          border border-white/10
          bg-gray-900/[0.10]
          p-1.5
          shadow-2xl shadow-black/30
          backdrop-blur-2xl
          h-15
        "
      >
        {/* Chats */}
        <a
          href="#"
          className="
            group flex min-w-[68px] flex-col items-center justify-center
            gap-1 rounded-[38px] px-3 py-1
            text-gray-400
            transition-all duration-300
            hover:bg-blue-300/30  hover:text-blue-400
          "
        >
          <MessagesSquare
            size={18}
            className="transition-transform duration-300 "
          />

          <span className="text-[11px] font-medium">
            Chats
          </span>
        </a>

        {/* Contacts */}
        <a
          href="#"
          className="
            group flex min-w-[68px] flex-col items-center justify-center
            gap-1 rounded-[38px] px-3 py-1
            text-gray-400
            transition-all duration-300
            hover:bg-blue-300/30 hover:text-blue-400
          "
        >
          <Contact
            size={18}
            className="transition-transform duration-300 "
          />

          <span className="text-[11px] font-medium">
            Contact
          </span>
        </a>

        {/* Settings */}
        <a
          href="#"
          className="
            group flex min-w-[68px] flex-col items-center justify-center
            gap-1 rounded-[38px] px-3 py-1
            text-gray-400
            transition-all duration-300
            hover:bg-blue-300/30  hover:text-blue-400
          "
        >
          <Settings
            size={18}
            className="transition-all duration-500"
          />

          <span className="text-[11px] font-medium">
            Settings
          </span>
        </a>

        {/* Profile */}
        <a
          href="#"
          className="
            group flex min-w-[68px] flex-col items-center justify-center
            gap-1 rounded-[38px] px-3 py-1
            text-gray-400
            transition-all duration-300
            hover:bg-blue-300/30  hover:text-blue-400
          "
        >
          <img
            src="/profile.jpg"
            alt="Profile"
            className="
              h-[19px] w-[19px]
              rounded-full
              object-cover
              ring-1 ring-white/20
              transition-all duration-300
              group-hover:ring-white/50
            "
          />

          <span className="text-[11px] font-medium  hover:text-blue-400">
            Profile
          </span>
        </a>
      </div>
    </nav>
  );
}