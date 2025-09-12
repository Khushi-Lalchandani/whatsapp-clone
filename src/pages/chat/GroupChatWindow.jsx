import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { database, auth } from "../../firebase/firebase";
import { ref, onValue, push, set, update } from "firebase/database";

function getMessageStatus(msg, totalMembers) {
  if (!msg.seenBy) return "sent";
  const seenCount = msg.seenBy.length;
  if (seenCount === totalMembers) return "seen";
  if (seenCount >= Math.ceil(totalMembers / 2)) return "delivered";
  return "sent";
}

export default function GroupChatWindow() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [groupUsers, setGroupUsers] = useState({});

  // Fetch group info
  useEffect(() => {
    if (!groupId) return;
    const groupRef = ref(database, `groups/${groupId}`);
    const unsub = onValue(groupRef, (snap) => {
      setGroup(snap.val());
    });
    return () => unsub();
  }, [groupId]);

  // Fetch group users info
  useEffect(() => {
    if (!group || !group.members) return;
    const usersRef = ref(database, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (snap.exists()) {
        const allUsers = snap.val();
        const filtered = {};
        group.members.forEach(uid => {
          if (allUsers[uid]) filtered[uid] = allUsers[uid];
        });
        setGroupUsers(filtered);
      }
    });
    return () => unsub();
  }, [group]);

  // Fetch messages and mark as seen
  useEffect(() => {
    if (!groupId || !auth.currentUser) return;
    const currentUid = auth.currentUser.uid;
    const messagesRef = ref(database, `groups/${groupId}/messages`);
    const unsub = onValue(messagesRef, (snap) => {
      if (snap.exists()) {
        const msgsObj = snap.val();
        const msgsArr = Object.values(msgsObj);
        setMessages(msgsArr);

        Object.entries(msgsObj).forEach(([msgId, msg]) => {
          if (!msg.seenBy?.includes(currentUid)) {
            update(ref(database, `groups/${groupId}/messages/${msgId}`), {
              seenBy: [...(msg.seenBy || []), currentUid],
            });
          }
        });
      } else {
        setMessages([]);
      }
    });
    return () => unsub();
  }, [groupId, auth.currentUser]);

  // Send message with seenBy = [sender]
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

  if (!group) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading group...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Group Header */}
      <div className="flex items-center gap-3 p-3 border-b border-yellow-600 bg-black">
        <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center font-bold text-black text-xl border border-yellow-500">
          {group.groupImage ?
            (<img src={group.groupImage} alt="" className="w-10 h-10 rounded-full object-cover" />) : (group.name[0] || 'G')}
        </div>
        <div className="flex flex-col flex-1">
          <h2 className="text-lg font-semibold text-yellow-400">{group.name}</h2>
          <span className="text-sm text-gray-400">{group.members.length} members</span>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-4 bg-gradient-to-br from-black to-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === auth.currentUser?.uid ? "items-end" : "items-start"}`}
          >
            {msg.sender !== auth.currentUser?.uid && (
              <span className="text-xs font-semibold text-yellow-400 mb-1 ml-2">
                {groupUsers[msg.sender]?.fullName || groupUsers[msg.sender]?.email || "Unknown"}
              </span>
            )}
            <div
              className={`rounded-2xl px-4 py-2 max-w-xs shadow-md ${msg.sender === auth.currentUser?.uid
                ? "bg-yellow-500 text-black"
                : "bg-gray-800 text-white border border-yellow-600"
                }`}
            >
              <p>{msg.text}</p>
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
                    {getMessageStatus(msg, group.members.length) === "sent" && "✓"}
                    {getMessageStatus(msg, group.members.length) === "delivered" && "✓✓"}
                    {getMessageStatus(msg, group.members.length) === "seen" && (
                      <span className="text-blue-400">✓✓</span>
                    )}
                  </span>
                )}
              </div>
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
    </div>
  );
}
