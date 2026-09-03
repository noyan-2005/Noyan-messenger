import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCirclePlus,
  MessageCircle,
  Users,
  Radio,
} from "lucide-react";

export default function CreateChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative w-full h-16"
    >
      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{
              opacity: 0,
              y: 8,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 8,
              scale: 0.95,
            }}
            transition={{
              duration: 0.18,
              ease: "easeOut",
            }}
            className="
              absolute
              bottom-full
              right-4
              mb-18
              w-45
              p-1
              rounded-2xl
              bg-white/95
              backdrop-blur-xl
              border
              border-white/50
              shadow-xl
              z-50
              origin-bottom-right
            "
          >
            {/* New Chat */}
            <button
              type="button"
              className="
                w-full
                flex
                items-center
                gap-3
                px-3
                py-2.5
                rounded-xl
                text-sm
                text-gray-700
                hover:bg-gray-100
                transition
              "
            >
              <MessageCircle size={18} />
              <span>New Chat</span>
            </button>

            {/* New Group */}
            <button
              type="button"
              className="
                w-full
                flex
                items-center
                gap-3
                px-3
                py-2.5
                rounded-xl
                text-sm
                text-gray-700
                hover:bg-gray-100
                transition
              "
            >
              <Users size={18} />
              <span>New Group</span>
            </button>

            {/* New Channel */}
            <button
              type="button"
              className="
                w-full
                flex
                items-center
                gap-3
                px-3
                py-2.5
                rounded-xl
                text-sm
                text-gray-700
                hover:bg-gray-100
                transition
              "
            >
              <Radio size={18} />
              <span>New Channel</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          absolute
          bottom-20
          right-4
          z-40
          w-12
          h-12
          rounded-full
          flex
          items-center
          justify-center
          bg-white
          text-violet-600
          border
          border-violet-100
          shadow-lg
          cursor-pointer
          hover:bg-violet-50
          transition-colors
        "
      >
        <MessageCirclePlus size={20} />
      </button>
    </div>
  );
}