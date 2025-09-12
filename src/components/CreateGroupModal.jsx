import React, { useState, useEffect } from "react";
import { ref, set, push, onValue } from "firebase/database";
import { database, auth } from "../firebase/firebase";


export default function CreateGroupModal({ isOpen, onClose }) {
  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [groupImage, setGroupImage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    const usersRef = ref(database, "users");
    const currentUid = auth.currentUser?.uid;
    const unsub = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const allUsers = snapshot.val();
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
    return () => unsub();
  }, [isOpen]);

  const handleUserSelect = (uid) => {
    setSelectedUsers((prev) =>
      prev.includes(uid)
        ? prev.filter((id) => id !== uid)
        : [...prev, uid]
    );
  };
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupImage(reader.result);
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    setLoading(true);
    const currentUid = auth.currentUser?.uid;
    const groupRef = push(ref(database, "groups"));
    const groupId = groupRef.key;
    const members = [currentUid, ...selectedUsers];
    const now = Date.now();

    await set(groupRef, {
      id: groupId,
      name: groupName,
      members,
      groupImage: groupImage || '',
      createdBy: currentUid,
      createdAt: now,
      lastMsgTime: now,
      messages: {},
    });
    setLoading(false);
    setGroupName("");
    setGroupImage('');
    setSelectedUsers([]);
    onClose();
  };
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black bg-opacity-60">
      <div className="bg-gray-900 border border-yellow-600 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-yellow-400 mb-4">Create Group</h2>
        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-yellow-600 bg-black text-yellow-400"
        />

        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full mb-4 px-3 py-2 rounded-lg border border-yellow-600 bg-black text-yellow-400"
        />
        <div className="mb-4">
          <p className="text-yellow-400 font-semibold mb-2">Select Members:</p>
          <div className="max-h-40 overflow-y-auto">
            {users.map((user) => (
              <label key={user.uid} className="flex items-center gap-2 mb-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.uid)}
                  onChange={() => handleUserSelect(user.uid)}
                  className="accent-yellow-500"
                />
                <span className="text-gray-300">{user.fullName || user.email}</span>
              </label>
            ))}
          </div>
        </div>
        <button
          onClick={handleCreateGroup}
          disabled={loading || !groupName.trim() || selectedUsers.length === 0}
          className="bg-yellow-500 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-400 transition w-full mb-2 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
        <button
          onClick={onClose}
          className="bg-gray-700 text-yellow-400 font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
