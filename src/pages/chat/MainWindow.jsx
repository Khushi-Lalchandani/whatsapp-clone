import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, database } from "../../firebase/firebase";
import { onValue, ref, push, set } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { encryptMessage, decryptMessage } from "../../utils/encryptUtils";
import { setupPresence } from "../../utils/presence";
import { Settings } from "lucide-react";
import Profile from "../../components/Profile";

export default function MainWindow() {
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [input, setInput] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const generateChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Removed redundant presence setup - now handled globally in App.jsx
  useEffect(() => {
    let unsubscribe;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user && chatId) {
        const chatKey = generateChatId(user.uid, chatId);

        const messagesRef = ref(database, `chats/${chatKey}/messages`);
        unsubscribe = onValue(messagesRef, (snapshot) => {
          if (snapshot.exists()) {
            setMessages(Object.values(snapshot.val()));
          } else {
            setMessages([]);
          }
        });
      }
    });

    return () => {
      authUnsub();
      if (unsubscribe) unsubscribe();
    };
  }, [chatId]);



  useEffect(() => {
    if (!chatId) return;

    // Fetch recipient details
    const userRef = ref(database, `users/${chatId}`);
    onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setRecipient(snapshot.val());
        const currentEmail = localStorage.getItem("user");
        for (let key in snapshot.val()) {
          if (snapshot.val()[key].userEmail !== currentEmail) {
            setCurrentUser(snapshot.val());
          }
        }
      }
    });
  }, [chatId]);



  const handleSend = async () => {
    if (!input.trim()) return;

    const currentUserId = auth.currentUser?.uid;
    console.log(currentUserId);
    const chatKey = generateChatId(currentUserId, chatId);
    const messageRef = ref(database, `chats/${chatKey}/messages`);
    const newMessageRef = push(messageRef);


    const encryptedMessage = encryptMessage(input);
    console.log(encryptedMessage);

    const messageObj = {
      id: newMessageRef.key,
      sender: currentUserId,
      receiver: chatId,
      text: encryptedMessage,
      time: Date.now(),
    };

    await set(newMessageRef, messageObj);
    setInput("");
  };



  if (!chatId) {
    return (
      <div className="flex flex-col h-full">
        {/* Header for no chat selected */}
        <div className="flex items-center justify-between p-3 border-b border-yellow-600 bg-black md:hidden">
          <h2 className="text-lg font-semibold text-yellow-400">Chat</h2>
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
            title="Profile Settings"
          >
            <Settings size={20} />
          </button>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-black to-gray-900">
          <div className="text-center">
            <h2 className="text-2xl text-gray-400 mb-4">Select a chat to start messaging</h2>
            <button
              onClick={() => setIsProfileOpen(true)}
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-400 transition"
            >
              <Settings size={16} />
              Profile Settings
            </button>
          </div>
        </div>

        {/* Profile Modal */}
        <Profile 
          isOpen={isProfileOpen} 
          onClose={() => setIsProfileOpen(false)} 
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      {recipient && (
        <div className="flex items-center gap-3 p-3 border-b border-yellow-600 bg-black">
          <img
            src={recipient.profileImage || "https://via.placeholder.com/40"}
            alt="profile"
            className="w-10 h-10 rounded-full border border-yellow-500"
          />
          <div className="flex flex-col flex-1">
            <h2 className="text-lg font-semibold text-white">
              {recipient.fullName || recipient.email}
            </h2>
            <span
              className={`text-sm font-medium ${recipient.status?.state === "online"
                ? "text-green-400"
                : "text-gray-400"
                }`}
            >
              {recipient.status?.state === "online" ? "Online" : "Offline"}
            </span>
          </div>
          {/* Mobile Settings Button */}
          <button
            onClick={() => setIsProfileOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
            title="Profile Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      )}


      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 bg-gradient-to-br from-black to-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === auth.currentUser?.uid ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`rounded-2xl px-4 py-2 max-w-xs shadow-md ${msg.sender === auth.currentUser?.uid
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-white border border-yellow-600"
                }`}
            >

              <p>{decryptMessage(msg.text)}</p>
              <span className="block text-xs text-gray-300 mt-1">
                {msg.time
                  ? new Date(msg.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "sending..."}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-yellow-600 bg-black flex gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-xl px-4 py-2 bg-gray-900 text-white focus:outline-none border border-yellow-600"
        />
        <button
          onClick={handleSend}
          className="bg-yellow-500 text-black rounded-xl px-6 flex items-center justify-center hover:bg-yellow-400 transition"
        >
          Send
        </button>
      </div>

      {/* Profile Modal */}
      <Profile 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
}
