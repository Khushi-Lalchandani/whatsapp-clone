import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { auth, database } from "../../firebase/firebase";
import { ref, onValue } from "firebase/database";

const UserPreview = ({ isOpen, onClose, user }) => {
  const [commonGroups, setCommonGroups] = useState([]);

  useEffect(() => {
    if (!isOpen || !user || !auth.currentUser) return;

    const currentUserId = auth.currentUser.uid;
    const groupsRef = ref(database, "groups");

    const unsub = onValue(groupsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setCommonGroups([]);
        return;
      }

      const groups = snapshot.val();
      const shared = [];

      Object.entries(groups).forEach(([groupId, group]) => {
        const members = group.members || {};

        // Case 1: members as object { uid: true }
        const isMemberObj =
          typeof members === "object" &&
          !Array.isArray(members) &&
          members[currentUserId] &&
          members[user.uid];

        // Case 2: members as array [uid1, uid2]
        const isMemberArr =
          Array.isArray(members) &&
          members.includes(currentUserId) &&
          members.includes(user.uid);

        if (isMemberObj || isMemberArr) {
          shared.push({ id: groupId, ...group });
        }
      });

      setCommonGroups(shared);
    });

    return () => unsub();
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose} // click outside closes
    >
      <div
        className="bg-gray-900 rounded-2xl shadow-lg max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()} // prevent close on inside click
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
        >
          <X size={24} />
        </button>

        {/* User Profile */}
        <div className="flex flex-col items-center text-center">
          <img
            src={user.profileImage || "https://via.placeholder.com/100"}
            alt="profile"
            className="w-24 h-24 rounded-full border-2 border-yellow-500 mb-3"
          />
          <h2 className="text-xl font-semibold text-white">
            {user.fullName || user.email}
          </h2>
        </div>

        {/* Common Groups */}
        <div className="mt-6">
          <h3 className="text-lg font-medium text-yellow-400 mb-2">
            Common Groups
          </h3>
          {commonGroups.length > 0 ? (
            <ul className="space-y-2">
              {commonGroups.map((group) => (
                <li
                  key={group.id}
                  className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-white"
                >
                  {group.name || "Unnamed Group"}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 text-sm">No common groups found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserPreview;
