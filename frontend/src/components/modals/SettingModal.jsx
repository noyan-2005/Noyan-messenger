import {
  X,
  Search,
  MoreVertical,
  QrCode,
  UserRound,
  Bell,
  Lock,
  MessageCircle,
  Folder,
  SlidersHorizontal,
  MonitorSpeaker,
  BatteryCharging,
  Languages,
  HelpCircle,
  Lightbulb,
  MessageCircleQuestion,
  Eye,
} from "lucide-react";

export default function SettingsModal({ onClose }) {
  const settingsItems = [
    { icon: UserRound, label: "My Account" },
    { icon: Bell, label: "Notifications and Sounds" },
    { icon: Lock, label: "Privacy and Security" },
    { icon: MessageCircle, label: "Chat Settings" },
    { icon: Folder, label: "Folders" },
    { icon: SlidersHorizontal, label: "Advanced" },
    { icon: MonitorSpeaker, label: "Speakers and Camera" },
    { icon: BatteryCharging, label: "Battery and Animations" },
    {
      icon: Languages,
      label: "Language",
      value: "English",
    },
  ];

  const helpItems = [
    { icon: HelpCircle, label: "Telegram FAQ" },
    { icon: Lightbulb, label: "Telegram Features" },
    { icon: MessageCircleQuestion, label: "Ask a Question" },
  ];

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/20
        p-4
        backdrop-blur-sm
      "
      onClick={onClose}
    >
      <div
        className="
          flex h-[85vh] w-full max-w-[480px]
          flex-col overflow-hidden
          rounded-3xl
          border border-white/50
          bg-white/70
          shadow-2xl shadow-black/20
          backdrop-blur-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="
            flex items-center justify-between
            border-b border-gray-200/60
            px-7 py-5
          "
        >
          <h2 className="text-xl font-semibold text-gray-800">
            Settings
          </h2>

          <div className="flex items-center gap-4 text-gray-400">
            <button
              type="button"
              className="
                rounded-full p-2
                transition-all duration-200
                hover:bg-violet-100
                hover:text-violet-500
              "
            >
              <Search size={20} />
            </button>

            <button
              type="button"
              className="
                rounded-full p-2
                transition-all duration-200
                hover:bg-violet-100
                hover:text-violet-500
              "
            >
              <MoreVertical size={20} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="
                rounded-full p-2
                transition-all duration-200
                hover:bg-red-50
                hover:text-red-500
              "
            >
              <X size={21} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="glass-scrollbar flex-1 overflow-y-auto">
          {/* Profile Header */}
          <div className="flex items-center gap-5 px-7 py-6">
            <img
              src="/profile.jpg"
              alt="Profile"
              className="
                h-20 w-20
                rounded-full
                object-cover
                ring-2 ring-violet-200
              "
            />

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">
                Mahdi Alizadeh
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                +98 933 006 1849
              </p>

              <p className="mt-1 text-sm text-violet-500">
                @noyan
              </p>
            </div>

            <button
              type="button"
              className="
                rounded-xl p-2
                text-violet-500
                transition-all
                hover:bg-violet-100
              "
            >
              <QrCode size={22} />
            </button>
          </div>

          {/* Settings */}
          <SectionDivider />

          <div className="py-2">
            {settingsItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="
                    flex w-full items-center gap-5
                    px-7 py-3.5
                    text-left
                    transition-all duration-200
                    hover:bg-violet-50/70
                  "
                >
                  <Icon
                    size={21}
                    className="shrink-0 text-gray-400"
                  />

                  <span className="flex-1 text-[16px] text-gray-700">
                    {item.label}
                  </span>

                  {item.value && (
                    <span className="text-sm text-violet-500">
                      {item.value}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <SectionDivider />

          {/* Interface Scale */}
          <div className="px-7 py-5">
            <div className="flex items-center gap-5">
              <Eye
                size={21}
                className="text-gray-400"
              />

              <span className="flex-1 text-[16px] text-gray-700">
                Default interface scale
              </span>

              <button
                type="button"
                className="
                  relative h-6 w-11
                  rounded-full
                  bg-violet-200
                  p-1
                  transition-all
                "
              >
                <span
                  className="
                    block h-4 w-4
                    translate-x-5
                    rounded-full
                    bg-violet-500
                    shadow-sm
                  "
                />
              </button>
            </div>

            <div className="mt-6 flex items-center gap-4 pl-10">
              <div className="relative h-1 flex-1 rounded-full bg-gray-200">
                <div className="h-full w-[35%] rounded-full bg-violet-400" />

                <div
                  className="
                    absolute left-[35%] top-1/2
                    h-5 w-5
                    -translate-x-1/2 -translate-y-1/2
                    rounded-full
                    bg-violet-500
                    shadow-md
                  "
                />
              </div>

              <span className="text-sm text-violet-500">
                125%
              </span>
            </div>
          </div>

          <SectionDivider />

          {/* Help */}
          <div className="py-2 pb-6">
            {helpItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  className="
                    flex w-full items-center gap-5
                    px-7 py-3.5
                    text-left
                    transition-all duration-200
                    hover:bg-violet-50/70
                  "
                >
                  <Icon
                    size={21}
                    className="shrink-0 text-gray-400"
                  />

                  <span className="text-[16px] text-gray-700">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="h-2 border-y border-gray-200/40 bg-gray-100/50" />
  );
}