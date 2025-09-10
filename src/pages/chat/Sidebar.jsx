import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { setupPresence } from "../../utils/presence";
import { Settings } from "lucide-react";
import Profile from "../../components/Profile";

export default function Sidebar() {
  const [users, setUsers] = useState([]);
  const [chatMeta, setChatMeta] = useState({});
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch users
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

  // Fetch chat meta (last message time & unread count)
  useEffect(() => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid || users.length === 0) return;

    const meta = {};
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
        if (snap.exists()) {
          const msgs = Object.values(snap.val());
          msgs.forEach((msg) => {
            if (msg.time > lastMsgTime) lastMsgTime = msg.time;
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
          [user.uid]: { lastMsgTime, unreadCount },
        }));
      });
      unsubscribers.push(unsub);
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub && unsub());
    };
  }, [users, auth.currentUser]);

  // Sort users by last message time (descending)
  const sortedUsers = [...users].sort((a, b) => {
    const aTime = chatMeta[a.uid]?.lastMsgTime || 0;
    const bTime = chatMeta[b.uid]?.lastMsgTime || 0;
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

  return (
    <div className="hidden md:flex flex-col w-1/3 border-r border-yellow-600 bg-black">
      <div className="flex items-center justify-between p-4 text-xl font-semibold text-yellow-400 border-b border-yellow-600">
        <span>Users</span>
        <button
          onClick={() => setIsProfileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-800 transition text-yellow-400"
          title="Profile Settings"
        >
          <Settings size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        {sortedUsers.map((user) => (
          <div
            key={user.uid}
            onClick={() => navigate(`/chat/${user.uid}`)}
            className="flex items-center gap-3 p-4 border-b border-yellow-600 hover:bg-gray-800 cursor-pointer transition relative"
          >
            <img
              src={
                user.profileImage ||
                "https://via.placeholder.com/40/FFD700/000000?text=U"
              }
              alt={user.fullName || "User"}
              className="w-12 h-12 rounded-full object-cover border border-yellow-500"
            />
            <div className="flex-1">
              <p className="font-semibold text-yellow-400 flex items-center gap-2">
                {user.fullName || "Unknown"}
                {chatMeta[user.uid]?.unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-yellow-500 text-black rounded-full">
                    {chatMeta[user.uid].unreadCount}
                  </span>
                )}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t border-yellow-600">
        <button
          onClick={handleLogout}
          className="w-full bg-yellow-500 text-black font-bold py-2 rounded-lg hover:bg-yellow-400 transition"
        >
          Logout
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
