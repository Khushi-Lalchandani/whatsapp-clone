import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { database, auth } from "../../firebase/firebase";
import { ref, onValue, push, set, update } from "firebase/database";
import { Plus, Settings, MoreVertical, LogOut, ArrowLeft } from "lucide-react";
import FileUploadModal from "../../components/FileUploadModal";
import FilePreview from "../../components/FilePreview";
import Profile from "../../components/Profile";
import { setupPresence, cleanupPresence } from "../../utils/presence";

function getMessageStatus(msg, totalMembers, onlineMembers = []) {
  if (!msg.seenBy) return "sent";
  const onlineMembersWhoSaw = msg.seenBy.filter(uid =>
    uid !== msg.sender && onlineMembers.includes(uid)
  ).length;
  const totalOnlineMembers = onlineMembers.filter(uid => uid !== msg.sender).length;

  if (totalOnlineMembers > 0 && onlineMembersWhoSaw === totalOnlineMembers) {
    return "seen";
  }

  if (totalOnlineMembers > 0 && onlineMembersWhoSaw >= Math.ceil(totalOnlineMembers / 2)) {
    return "delivered";
  }

  if (onlineMembersWhoSaw > 0) {
    return "delivered";
  }

  return "sent";
}

export default function GroupChatWindow() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const menuRef = useRef();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [menuOpenMsgId, setMenuOpenMsgId] = useState("");
  const [groupUsers, setGroupUsers] = useState({});
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    console.log('Logging out - setting user offline');
    await setupPresence(uid, false);
    cleanupPresence();
    await auth.signOut();
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    if (!groupId) return;
    const groupRef = ref(database, `groups/${groupId}`);
    const unsub = onValue(groupRef, (snap) => {
      setGroup(snap.val());
    });
    return () => unsub();
  }, [groupId]);

  useEffect(() => {
    if (!group || !group.members) return;
    const usersRef = ref(database, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const allUsers = snap.val();
        const filtered = {};
        const currentOnlineMembers = [];
        group.members.forEach((uid) => {
          if (allUsers[uid]) {
            filtered[uid] = allUsers[uid];
            if (allUsers[uid].status?.state === "online") {
              currentOnlineMembers.push(uid);
            }
          }
        });
        setGroupUsers(filtered);
        setOnlineMembers(currentOnlineMembers);
      }
    });
    return () => unsub();
  }, [group]);

  useEffect(() => {
    if (!groupId || !auth.currentUser) return;
    const currentUid = auth.currentUser.uid;
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    const unsub = onValue(messagesRef, (snap) => {
      if (snap.exists()) {
        const msgsObj = snap.val();
        const msgsArr = Object.values(msgsObj);
        setMessages(msgsArr);

        const currentUserRef = ref(database, `users/${currentUid}`);
        onValue(currentUserRef, (userSnap) => {
          const userData = userSnap.val();
          if (userData?.status?.state === "online") {
            Object.entries(msgsObj).forEach(([msgId, msg]) => {
              if (!msg.seenBy?.includes(currentUid) && msg.sender !== currentUid) {
                update(ref(database, `groups/${groupId}/messages/${msgId}`), {
                  seenBy: [...(msg.seenBy || []), currentUid],
                });
              }
            });
          }
        }, { onlyOnce: true });
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [groupId, auth.currentUser]);

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

  const handleDeleteForMe = async (msgId) => {
    const currentUid = auth.currentUser?.uid;
    const msgRef = ref(database, `groups/${groupId}/messages/${msgId}`);
    let prevDeletedForMe = [];
    const snap = await new Promise((resolve) => {
      onValue(msgRef, (s) => resolve(s), { onlyOnce: true });
    });
    if (snap.exists()) {
      prevDeletedForMe = snap.val().deleteForMe || [];
    }
    await update(msgRef, {
      deleteForMe: [...prevDeletedForMe, currentUid],
    });
    setMenuOpenMsgId("");
  };

  const handleDeleteForEveryone = async (msgId) => {
    const msgRef = ref(database, `groups/${groupId}/messages/${msgId}`);
    await update(msgRef, {
      text: "",
      fileData: null,
      deletedForEveryone: true,
    });
    setMenuOpenMsgId("");
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const currentUid = auth.currentUser?.uid;
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    const newMsgRef = push(messagesRef);
    await set(newMsgRef, {
      id: newMsgRef.key,
      sender: currentUid,
      text: input,
      time: Date.now(),
      seenBy: [currentUid],
    });
    setInput("");
  };

  const handleFileSend = async (fileData) => {
    const currentUid = auth.currentUser?.uid;
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    const newMsgRef = push(messagesRef);
    await set(newMsgRef, {
      id: newMsgRef.key,
      sender: currentUid,
      text: fileData.message || '',
      time: Date.now(),
      seenBy: [currentUid],
      fileData: {
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        fileType: fileData.fileType,
        fileContent: fileData.fileContent
      },
      messageType: 'file'
    });
  };

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading group...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Group Chat Header */}
      <div className="flex items-center gap-3 p-3 border-b border-yellow-600 bg-black">

        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black text-xl border border-yellow-500">
          {group.groupImage ? (
            <img
              src={group.groupImage}
              alt=""
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            group.name[0] || "G"
          )}
        </div>

        <div className="flex flex-col flex-1">
          <h2 className="text-lg font-semibold text-yellow-400">
            {group.name}
          </h2>
          <span className="text-sm text-gray-400">
            {group.members.length} members
          </span>
        </div>

        {/* Settings and More options, visible only on mobile */}
        <div className="relative md:hidden">
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
            title="More options"
          >
            <MoreVertical size={20} />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-10 z-10 bg-black border border-yellow-600 rounded-lg shadow-lg min-w-[160px]">
              <button
                onClick={() => handleBack()}
                className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-gray-800 transition rounded-t-lg"
              >
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                onClick={() => { handleLogout(); setDropdownOpen(false); }}
                className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-gray-800 transition rounded-b-lg"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 bg-gradient-to-br from-black to-gray-900">
        {messages.map((msg) => {
          if (msg.deleteForMe?.includes(auth.currentUser?.uid)) return null;
          const isDeletedForEveryone = msg.deletedForEveryone;

          return (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === auth.currentUser?.uid
                ? "items-end"
                : "items-start"
                }`}
            >
              {msg.sender !== auth.currentUser?.uid && (
                <span className="text-xs font-semibold text-yellow-400 mb-1 ml-2">
                  {groupUsers[msg.sender]?.fullName ||
                    groupUsers[msg.sender]?.email ||
                    "Unknown"}
                </span>
              )}
              <div
                className={`relative rounded-2xl px-4 py-2 max-w-xs shadow-md ${msg.sender === auth.currentUser?.uid
                  ? "bg-yellow-500 text-black"
                  : "bg-gray-800 text-white border border-yellow-600"
                  }`}
              >
                <div className="flex items-center justify-between">
                  {msg.messageType === 'file' ? (
                    <div className="flex flex-col gap-2">
                      {!isDeletedForEveryone ? (
                        <FilePreview
                          fileData={msg.fileData}
                          isOwn={msg.sender === auth.currentUser?.uid}
                        />
                      ) : (
                        <span className="italic text-gray-400">this file has been deleted</span>
                      )}
                      {msg.text && (
                        <p className="mt-2">
                          {isDeletedForEveryone ? (
                            <span className="italic text-gray-400">
                              this message has been deleted
                            </span>
                          ) : (
                            msg.text
                          )}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>
                      {isDeletedForEveryone ? (
                        <span className="italic text-gray-400">
                          this message has been deleted
                        </span>
                      ) : (
                        msg.text
                      )}
                    </p>
                  )}
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
                        onClick={() => handleDeleteForMe(msg.id)}
                        className="text-white block px-4 py-2 text-left w-full hover:bg-gray-800 text-nowrap"
                      >
                        Delete For Me
                      </button>
                      {msg.sender === auth.currentUser?.uid &&
                        !isDeletedForEveryone && (
                          <button
                            onClick={() => handleDeleteForEveryone(msg.id)}
                            className="text-nowrap block px-4 py-2 text-left w-full hover:bg-gray-800 text-red-400"
                          >
                            Delete For Everyone
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
                      {getMessageStatus(msg, group.members.length, onlineMembers) === "sent" &&
                        "✓"}
                      {getMessageStatus(msg, group.members.length, onlineMembers) ===
                        "delivered" && "✓✓"}
                      {getMessageStatus(msg, group.members.length, onlineMembers) === "seen" && (
                        <span className="text-blue-400">✓✓</span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>;

      {/* Input */}
      <div className="p-3 border-t border-yellow-600 bg-black flex gap-2">
        <button
          onClick={() => setIsFileModalOpen(true)}
          className="hover:text-yellow-50 p-2 hover:bg-gray-800 rounded-lg transition"
          title="Share File"
        >
          <Plus size={24} />
        </button>
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 rounded-xl px-4 py-2 bg-gray-900 text-white focus:outline-none border border-yellow-600"
        />
        <button
          onClick={handleSend}
          className="bg-yellow-500 text-black rounded-xl px-6 flex items-center justify-center hover:bg-yellow-400 transition"
        >
          Send
        </button>
      </div>;

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSend={handleFileSend}
      />;
      {/* Profile Modal */}
      <Profile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div >
  );
}
