import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { setupPresence } from "../../utils/presence";
import { Settings, MoreVertical, Users } from "lucide-react";
import Profile from "../../components/Profile";
import CreateGroupModal from "../../components/CreateGroupModal";

export default function Sidebar() {
  const [users, setUsers] = useState([]);
  const [chatMeta, setChatMeta] = useState({});
  const [groups, setGroups] = useState([]);
  const [groupMeta, setGroupMeta] = useState({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const navigate = useNavigate();


  useEffect(() => {
    const usersRef = ref(database, "users");
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
        const currentUid = auth.currentUser?.uid;
        const userList = Object.entries(allUsers)
          .filter(([uid]) => uid !== currentUid)
          .map(([uid, user]) => ({
            uid,
            ...user,
          }));
        setUsers(userList);
      } else {
        setUsers([]);
      }
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || users.length === 0) return;

    const unsubscribers = [];

    users.forEach((user) => {
      const chatKey =
        currentUid < user.uid
          ? `${currentUid}_${user.uid}`
          : `${user.uid}_${currentUid}`;
      const messagesRef = ref(database, `chats/${chatKey}/messages`);
      const unsub = onValue(messagesRef, (snap) => {
        let lastMsgTime = 0;
        let unreadCount = 0;
        let lastSender = "";
        if (snap.exists()) {
          const msgs = Object.values(snap.val());
          msgs.forEach((msg) => {
            if (msg.time > lastMsgTime) {
              lastMsgTime = msg.time;
              lastSender = msg.sender;
            }
            if (
              msg.receiver === currentUid &&
              msg.status !== "seen"
            ) {
              unreadCount++;
            }
          });
        }
        setChatMeta((prev) => ({
          ...prev,
          [user.uid]: { lastMsgTime, unreadCount, lastSender },
        }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [users, auth.currentUser]);


  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return;
    const groupsRef = ref(database, "groups");
    const unsub = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const allGroups = snapshot.val();
        const groupList = Object.values(allGroups).filter(
          (group) => group.members && group.members.includes(currentUid)
        );
        setGroups(groupList);
      } else {
        setGroups([]);
      }
    });
    return () => unsub();
  }, [auth.currentUser]);


  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || groups.length === 0) return;

    const unsubscribers = [];

    groups.forEach((group) => {
      const messagesRef = ref(database, `groups/${group.id}/messages`);
      const unsub = onValue(messagesRef, (snap) => {
        let lastMsgTime = 0;
        let unreadCount = 0;
        let lastSender = "";
        if (snap.exists()) {
          const msgs = Object.values(snap.val());
          msgs.forEach((msg) => {
            if (msg.time > lastMsgTime) {
              lastMsgTime = msg.time;
              lastSender = msg.sender;
            }

            if (msg.sender !== currentUid && (!msg.seenBy || !msg.seenBy.includes(currentUid))) {
              unreadCount++;
            }
          });
        }
        setGroupMeta((prev) => ({
          ...prev,
          [group.id]: { lastMsgTime, unreadCount, lastSender },
        }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [groups, auth.currentUser]);


  const chatList = [
    ...users.map((user) => ({
      type: "user",
      id: user.uid,
      name: user.fullName || user.email,
      avatar: user.profileImage || "https:
      lastMsgTime: chatMeta[user.uid]?.lastMsgTime || 0,
      unreadCount: chatMeta[user.uid]?.unreadCount || 0,
      members: [],
      email: user.email,
    })),
    ...groups.map((group) => ({
      type: "group",
      id: group.id,
      name: group.name,

      avatar: group.groupImage || null,
      lastMsgTime: groupMeta[group.id]?.lastMsgTime || 0,
      unreadCount: groupMeta[group.id]?.unreadCount || 0,
      members: group.members,
      createdAt: group.createdAt || 0,
    })),
  ];


  const sortedChats = chatList.sort((a, b) => {
    const aTime = a.lastMsgTime || a.createdAt || 0;
    const bTime = b.lastMsgTime || b.createdAt || 0;
    return bTime - aTime;
  });

  const handleLogout = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    await setupPresence(uid, false);
    await auth.signOut();
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleCreateGroup = () => {
    setIsGroupModalOpen(true);
    setDropdownOpen(false);
  };

  return (
    <div className="hidden md:flex flex-col w-1/3 border-r border-yellow-600 bg-black">
      <div className="flex items-center justify-between p-4 text-xl font-semibold text-yellow-400 border-b border-yellow-600 relative">
        <span>Chats</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProfileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
            title="Profile Settings"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
            title="More"
          >
            <MoreVertical size={20} />
          </button>
          {dropdownOpen && (
            <div className="absolute right-4 top-14 z-10 bg-black border border-yellow-600 rounded-lg shadow-lg min-w-[160px]">
              <button
                onClick={handleCreateGroup}
                className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-gray-800 transition rounded-t-lg"
              >
                <Users size={16} />
                Create Group
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-yellow-400 hover:bg-gray-800 transition rounded-b-lg"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {sortedChats.map((chat) =>
          chat.type === "group" ? (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/group/${chat.id}`)}
              className="flex items-center gap-3 p-4 border-b border-yellow-600 hover:bg-gray-800 cursor-pointer transition relative"
            >
              {/* <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black text-xl border border-yellow-500"> */}
              <img src={chat.avatar} className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-black text-xl border border-yellow-500" alt="" />
              {/* </div> */}
              <div className="flex-1">
                <img src={chat.groupImage} alt="" />
                <p className="font-semibold text-yellow-400">{chat.name}</p>
                <p className="text-gray-400 text-sm">
                  {chat.members.length} members
                </p>
              </div>
              {chat.unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-black rounded-full">
                  {chat.unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div
              key={chat.id}
              onClick={() => navigate(`/chat/${chat.id}`)}
              className="flex items-center gap-3 p-4 border-b border-yellow-600 hover:bg-gray-800 cursor-pointer transition relative"
            >
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover border border-yellow-500"
              />
              <div className="flex-1">
                <p className="font-semibold text-yellow-400 flex items-center gap-2">
                  {chat.name}
                  {chat.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-black rounded-full">
                      {chat.unreadCount}
                    </span>
                  )}
                </p>
                <p className="text-gray-400 text-sm">{chat.email}</p>
              </div>
            </div>
          )
        )}
      </div>

      {/* Create Group Modal */}
      {isGroupModalOpen && (
        <CreateGroupModal
          isOpen={isGroupModalOpen}
          onClose={() => setIsGroupModalOpen(false)}
        />
      )}

      {/* Profile Modal */}
      <Profile
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
