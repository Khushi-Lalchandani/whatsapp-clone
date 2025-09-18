import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MainWindow from "./MainWindow";
import GroupChatWindow from "./GroupChatWindow";
import { useParams, useLocation } from "react-router-dom";
import { generateToken, messaging } from "../../firebase/firebase";
import { onMessage } from "firebase/messaging";
import { onMessageListener } from "../../firebase/firebase";

const ChatWindow = () => {
  const { chatId, groupId } = useParams();
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);


  useEffect(() => {

    generateToken();
    onMessageListener().then((payload) => {
      new Notification(payload.notification.title, {
        body: payload.notification.body,
        icon: "/firebase-logo.png",
      });
    });

  }, []);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  let MainComponent = null;
  if (location.pathname.startsWith("/chat/group/") && groupId) {
    MainComponent = <GroupChatWindow />;
  } else if (chatId) {
    MainComponent = <MainWindow />;
  }

  return (
    <div className="flex h-screen bg-black text-white">
      {!isMobile && (
        <>
          <Sidebar />
          <div className="flex-1 flex flex-col">
            {MainComponent}
          </div>
        </>
      )}

      {isMobile && (
        <>
          {(!chatId && !groupId) && <Sidebar isMobile={isMobile} />}
          {(chatId || groupId) && (
            <div className="flex-1 flex flex-col">
              {MainComponent}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatWindow;
