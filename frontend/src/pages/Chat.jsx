import { useState } from "react";

import ChatLayout from "../components/Chat/ChatLayout";
import ProfileModal from "../components/modals/ProfileModal";
import SettingModal from "../components/modals/SettingModal";

export default function Chat() {
  const [active, setActive] = useState("chats");

  return (
    <>
      <ChatLayout
        active={active}
        setActive={setActive}
      />

      {active === "profile" && (
        <ProfileModal
          onClose={() => setActive("chats")}
        />
      )}

      {active === "settings" && (
        <SettingModal
          onClose={() => setActive("chats")}
        />
      )}
    </>
  );
}