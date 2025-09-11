import React from "react";
import Sidebar from "./Sidebar";
import MainWindow from "./MainWindow";
import GroupChatWindow from "./GroupChatWindow";
import { useParams, useLocation } from "react-router-dom";

const ChatWindow = () => {
  const { chatId, groupId } = useParams();
  const location = useLocation();

  let MainComponent = <MainWindow />;
  if (location.pathname.startsWith("/chat/group/") && groupId) {
    MainComponent = <GroupChatWindow />;
  } else if (chatId) {
    MainComponent = <MainWindow />;
  }

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {MainComponent}
      </div>
    </div>
  );
};

export default ChatWindow;
