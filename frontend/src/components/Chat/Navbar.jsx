import { MessagesSquare, Settings, Contact } from "lucide-react";

export default function Navbar({ active, setActive }) {
  const navItems = [
    {
      id: "chats",
      label: "Chats",
      icon: MessagesSquare,
    },
    {
      id: "contacts",
      label: "Contact",
      icon: Contact,
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
    },
    {
      id: "profile",
      label: "Profile",
      icon: null,
    },
  ];

  return (
    <nav className="absolute bottom-5 left-1/2 z-50 w-fit -translate-x-1/2">
      <div
        className="
          flex items-center
          rounded-[90px]
          border border-white/10
          bg-gray-900/[0.05]
          p-1.5
          shadow-2xl shadow-black/30
          backdrop-blur-2xl
          h-13
        "
      >
        {navItems.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(item.id)}
              className={`
                group flex min-w-[68px]
                flex-col items-center justify-center
                rounded-[38px]
                px-3 py-1
                cursor-pointer
                transition-all duration-300
                ${
                  isActive
                    ? "bg-violet-300/30 text-violet-400"
                    : "text-gray-400 hover:bg-violet-100/50 hover:text-violet-400"
                }
              `}
            >
              {item.id === "profile" ? (
                <img
                  src="/profile.jpg"
                  alt="Profile"
                  className={`
                    h-[19px] w-[19px]
                    rounded-full
                    object-cover
                    ring-1
                    transition-all duration-300
                    ${
                      isActive
                        ? "ring-violet-400"
                        : "ring-white/20 group-hover:ring-white/50"
                    }
                  `}
                />
              ) : (
                <Icon
                  size={18}
                  className="transition-transform duration-300"
                />
              )}

              <span className="text-[11px] font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}