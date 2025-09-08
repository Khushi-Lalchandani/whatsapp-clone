import React from "react";
import Sidebar from "./Sidebar";
import MainWindow from "./MainWindow";

const ChatWindow = () => {
  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col">
        <MainWindow />
      </div>
    </div>
  );
};

export default ChatWindow;
