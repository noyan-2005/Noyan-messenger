import { useState } from "react";

import ChatLayout from "../components/Chat/ChatLayout";
import Navbar from "../components/Chat/Navbar";
import ProfileModal from "../components/modals/ProfileModal";

export default function Chat() {
    const [active, setActive] = useState("chats");
    return (

        <>

        <ChatLayout />
        <Navbar
            active={active}
            setActive={setActive}
        />

      {active === "profile" && (
        <ProfileModal
            onClose={() => setActive("chats")}
            />
        )}
    
        </>
    )
    
}