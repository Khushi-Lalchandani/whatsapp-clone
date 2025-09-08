import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database, auth } from "../../firebase/firebase";
import { useNavigate } from "react-router-dom";
import { setupPresence } from "../../utils/presence";
import { Settings } from "lucide-react";
import Profile from "../../components/Profile";

export default function Sidebar() {
  const [users, setUsers] = useState([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        {users.map((user) => (
          <div
            key={user.uid}
            onClick={() => navigate(`/chat/${user.uid}`)}
            className="flex items-center gap-3 p-4 border-b border-yellow-600 hover:bg-gray-800 cursor-pointer transition"
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
              <p className="font-semibold text-yellow-400">
                {user.fullName || "Unknown"}
              </p>
              <p className="text-gray-400 text-sm">{user.email}</p>
              {user.status && (
                <span
                  className={`text-xs ${user.status.state === "online"
                      ? "text-green-400"
                      : "text-gray-500"
                    }`}
                >
                  {user.status.state}
                </span>
              )}
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
