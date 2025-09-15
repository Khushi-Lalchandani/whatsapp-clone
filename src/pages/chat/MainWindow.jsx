import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { auth, database } from "../../firebase/firebase";
import { onValue, ref, push, set, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { encryptMessage, decryptMessage } from "../../utils/encryptUtils";
import { Settings } from "lucide-react";
import Profile from "../../components/Profile";

function getLastSeenText(lastOnline) {
  if (!lastOnline) return "Offline";
  const now = Date.now();
  const diffMs = now - lastOnline;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "Last seen just now";
  if (diffSec < 3600) return `Last seen ${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400)
    return `Last seen ${Math.floor(diffSec / 3600)} hour${Math.floor(diffSec / 3600) > 1 ? "s" : ""} ago`;
  return `Last seen ${Math.floor(diffSec / 86400)} day${Math.floor(diffSec / 86400) > 1 ? "s" : ""} ago`;
}

export default function MainWindow() {
  const menuRef = useRef();
  const { chatId } = useParams();
  const [messages, setMessages] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [input, setInput] = useState("");
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [menuOpenMsgId, setMenuOpenMsgId] = useState(null);

  const generateChatId = (uid1, uid2) => {
    return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
  };

  // Mark messages as delivered if recipient is online
  useEffect(() => {
    if (!chatId || !auth.currentUser) return;
    const userRef = ref(database, `users/${chatId}`);
    const chatKey = generateChatId(auth.currentUser.uid, chatId);
    const messagesRef = ref(database, `chats/${chatKey}/messages`);

    const unsub = onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData?.status?.state === "online") {
        onValue(messagesRef, (msgSnap) => {
          if (msgSnap.exists()) {
            const msgs = msgSnap.val();
            Object.entries(msgs).forEach(([msgId, msg]) => {
              if (
                msg.receiver === chatId &&
                msg.status === "sent"
              ) {
                update(ref(database, `chats/${chatKey}/messages/${msgId}`), {
                  status: "delivered",
                });
              }
            });
          }
        });
      }
    });

    return () => unsub();
  }, [chatId, auth.currentUser]);

  // Fetch messages and handle "seen" status
  useEffect(() => {
    let unsubscribe;
    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user && chatId) {
        const chatKey = generateChatId(user.uid, chatId);
        const messagesRef = ref(database, `chats/${chatKey}/messages`);
        unsubscribe = onValue(messagesRef, (snapshot) => {
          if (snapshot.exists()) {
            const msgs = Object.values(snapshot.val());
            // Filter out messages deleted for me
            const filteredMsgs = msgs.filter(
              (msg) => !(msg.deletedForMe?.includes(user.uid))
            );
            setMessages(filteredMsgs);

            // Mark "delivered" → "seen" (if viewing this chat)
            filteredMsgs.forEach((msg) => {
              if (
                msg.receiver === user.uid &&
                msg.status === "delivered"
              ) {
                update(ref(database, `chats/${chatKey}/messages/${msg.id}`), {
                  status: "seen",
                });
              }
            });
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

  // Listen for recipient info
  useEffect(() => {
    if (!chatId) return;
    const userRef = ref(database, `users/${chatId}`);
    const unsub = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setRecipient(snapshot.val());
      }
    });
    return () => unsub();
  }, [chatId]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenMsgId(null);
      }
    }
    if (menuOpenMsgId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpenMsgId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentUserId = auth.currentUser?.uid;
    const chatKey = generateChatId(currentUserId, chatId);
    const messageRef = ref(database, `chats/${chatKey}/messages`);
    const newMessageRef = push(messageRef);

    const encryptedMessage = encryptMessage(input);

    const messageObj = {
      id: newMessageRef.key,
      sender: currentUserId,
      receiver: chatId,
      text: encryptedMessage,
      time: Date.now(),
      status: "sent",
    };

    await set(newMessageRef, messageObj);
    setInput("");
  };

  // Delete for me: add current user to deletedForMe array
  const handleDeleteForMe = async (msgId) => {
    const currentUserId = auth.currentUser?.uid;
    const chatKey = generateChatId(currentUserId, chatId);
    const msgRef = ref(database, `chats/${chatKey}/messages/${msgId}`);
    let prevDeletedForMe = [];
    const msgSnap = await new Promise((resolve) => {
      onValue(msgRef, (snap) => resolve(snap), { onlyOnce: true });
    });
    if (msgSnap.exists()) {
      prevDeletedForMe = msgSnap.val().deletedForMe || [];
    }
    console.log(prevDeletedForMe);
    await update(msgRef, {
      deletedForMe: [...prevDeletedForMe, currentUserId],

    });
    setMenuOpenMsgId(null);
  };

  // Delete for everyone: set deletedForEveryone and clear text
  const handleDeleteForEveryone = async (msgId) => {
    const currentUserId = auth.currentUser?.uid;
    const chatKey = generateChatId(currentUserId, chatId);
    const msgRef = ref(database, `chats/${chatKey}/messages/${msgId}`);
    await update(msgRef, {
      text: "",
      deletedForEveryone: true,
    });
    setMenuOpenMsgId(null);
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
            <h2 className="text-2xl text-gray-400 mb-4">
              Select a chat to start messaging
            </h2>
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
              {recipient.status?.state === "online"
                ? "Online"
                : getLastSeenText(recipient.status?.last_changed)}
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
        {messages.map((msg) => {
          // Only render messages NOT deleted for me
          if (msg.deletedForMe?.includes(auth.currentUser?.uid)) return null;

          const isDeletedForEveryone = msg.deletedForEveryone;
          return (
            <div
              key={msg.id}
              className={`flex ${msg.sender === auth.currentUser?.uid
                ? "justify-end"
                : "justify-start"
                }`}
            >
              <div
                className={`relative rounded-2xl px-4 py-2 max-w-xs shadow-md ${msg.sender === auth.currentUser?.uid
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-white border border-yellow-600"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <p>
                    {isDeletedForEveryone
                      ? <span className="italic text-gray-400">this message has been deleted</span>
                      : decryptMessage(msg.text)}
                  </p>
                  {/* Three dots menu */}
                  <button
                    className="ml-2 text-gray-400 hover:text-yellow-500"
                    onClick={() => setMenuOpenMsgId(msg.id)}
                    title="More"
                  >
                    &#x22EE;
                  </button>
                  {menuOpenMsgId === msg.id && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 bg-black border border-yellow-600 rounded shadow-lg z-10"
                    >
                      <button
                        className="block px-4 py-2 text-left w-full hover:bg-gray-800 text-white"
                        onClick={() => handleDeleteForMe(msg.id)}
                      >
                        Delete for me
                      </button>
                      {msg.sender === auth.currentUser?.uid && !isDeletedForEveryone && (
                        <button
                          className="block px-4 py-2 text-left w-full hover:bg-gray-800 text-red-400"
                          onClick={() => handleDeleteForEveryone(msg.id)}
                        >
                          Delete for everyone
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-gray-300">
                    {msg.time
                      ? new Date(msg.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "sending..."}
                  </span>
                  {msg.sender === auth.currentUser?.uid && (
                    <span className="text-xs ml-2">
                      {msg.status === "sent" && "✓"}
                      {msg.status === "delivered" && "✓✓"}
                      {msg.status === "seen" && (
                        <span className="text-blue-400">✓✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
