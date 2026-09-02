import { X, Pencil, UserRound, AtSign, Circle } from "lucide-react";

export default function ProfileModal({ onClose }) {
  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/20
        backdrop-blur-sm
        flex items-center justify-center
      "
      onClick={onClose}
    >
      <div
        className="
          relative
          w-[380px]
          overflow-hidden
          rounded-3xl
          border border-white/20
          bg-white/80
          shadow-2xl
          backdrop-blur-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex h-32 items-center justify-center bg-gradient-to-br from-blue-400/20 to-purple-400/20">
          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="
              absolute right-4 top-4
              flex h-8 w-8 items-center justify-center
              rounded-full
              bg-white/30
              text-gray-500
              transition-all duration-200
              hover:bg-white/60
              hover:text-gray-800
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* Profile Image */}
        <div className="-mt-14 flex justify-center">
          <div className="relative">
            <img
              src="/profile.jpg"
              alt="Profile"
              className="
                h-28 w-28
                rounded-full
                border-4 border-white/80
                object-cover
                shadow-xl
              "
            />

            {/* Online Status */}
            <span
              className="
                absolute bottom-2 right-2
                h-4 w-4
                rounded-full
                border-2 border-white
                bg-green-400
              "
            />
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 pb-6 pt-4">
          {/* Name */}
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              Mahdi Alizadeh
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              online
            </p>
          </div>

          {/* Edit Button */}
          <button
            type="button"
            className="
              mt-5 flex w-full items-center justify-center gap-2
              rounded-xl
              bg-blue-500
              px-4 py-3
              text-sm font-medium text-white
              shadow-lg shadow-blue-500/20
              transition-all duration-200
              hover:bg-blue-600
              active:scale-[0.98]
            "
          >
            <Pencil size={16} />
            Edit Profile
          </button>

          {/* Information */}
          <div className="mt-5 space-y-2">
            {/* Username */}
            <div
              className="
                flex items-center gap-3
                rounded-2xl
                bg-gray-100/60
                px-4 py-3
              "
            >
              <AtSign
                size={18}
                className="text-gray-400"
              />

              <div>
                <p className="text-[11px] text-gray-400">
                  Username
                </p>

                <p className="text-sm font-medium text-gray-700">
                  noyan
                </p>
              </div>
            </div>

            {/* Account */}
            <div
              className="
                flex items-center gap-3
                rounded-2xl
                bg-gray-100/60
                px-4 py-3
              "
            >
              <UserRound
                size={18}
                className="text-gray-400"
              />

              <div>
                <p className="text-[11px] text-gray-400">
                  Account
                </p>

                <p className="text-sm font-medium text-gray-700">
                  Active
                </p>
              </div>
            </div>

            {/* Status */}
            <div
              className="
                flex items-center gap-3
                rounded-2xl
                bg-gray-100/60
                px-4 py-3
              "
            >
              <Circle
                size={13}
                fill="currentColor"
                className="text-green-400"
              />

              <div>
                <p className="text-[11px] text-gray-400">
                  Status
                </p>

                <p className="text-sm font-medium text-gray-700">
                  Online
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
