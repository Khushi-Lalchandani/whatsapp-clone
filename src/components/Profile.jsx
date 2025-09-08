import React, { useState, useEffect } from "react";
import { auth, database } from "../firebase/firebase";
import { ref, update, onValue } from "firebase/database";
import { X, Camera, User } from "lucide-react";

const Profile = ({ isOpen, onClose }) => {
  const [userProfile, setUserProfile] = useState({
    fullName: "",
    email: "",
    profileImage: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [tempProfile, setTempProfile] = useState({});

  useEffect(() => {
    if (!auth.currentUser) return;

    const userRef = ref(database, `users/${auth.currentUser.uid}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        setUserProfile({
          fullName: userData.fullName || "",
          email: userData.email || "",
          profileImage: userData.profileImage || "",
        });
        setTempProfile({
          fullName: userData.fullName || "",
          email: userData.email || "",
          profileImage: userData.profileImage || "",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTempProfile(prev => ({
          ...prev,
          profileImage: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      const userRef = ref(database, `users/${auth.currentUser.uid}`);
      await update(userRef, {
        fullName: tempProfile.fullName,
        profileImage: tempProfile.profileImage,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleCancel = () => {
    setTempProfile({
      fullName: userProfile.fullName,
      email: userProfile.email,
      profileImage: userProfile.profileImage,
    });
    setIsEditing(false);
  };

  const removeProfileImage = () => {
    setTempProfile(prev => ({
      ...prev,
      profileImage: ""
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-yellow-600">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-yellow-400">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Profile Image Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={
                tempProfile.profileImage ||
                "https://via.placeholder.com/100/FFD700/000000?text=U"
              }
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-2 border-yellow-500"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                <label htmlFor="profile-upload" className="cursor-pointer">
                  <Camera className="text-white" size={24} />
                </label>
                <input
                  id="profile-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
          {isEditing && tempProfile.profileImage && (
            <button
              onClick={removeProfileImage}
              className="mt-2 text-red-400 text-sm hover:text-red-300 transition"
            >
              Remove Photo
            </button>
          )}
        </div>

        {/* Profile Information */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={tempProfile.fullName}
                onChange={(e) =>
                  setTempProfile(prev => ({ ...prev, fullName: e.target.value }))
                }
                className="w-full p-3 rounded-lg bg-black/40 border border-yellow-400 text-white focus:outline-none focus:border-yellow-300"
              />
            ) : (
              <p className="p-3 rounded-lg bg-gray-800 text-white">
                {userProfile.fullName || "Not set"}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <p className="p-3 rounded-lg bg-gray-800 text-gray-400">
              {userProfile.email}
            </p>
            <small className="text-gray-500">Email cannot be changed</small>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {isEditing ? (
            <>
              <button
                onClick={handleCancel}
                className="flex-1 py-2 px-4 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2 px-4 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition"
              >
                Save Changes
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2 px-4 rounded-lg bg-yellow-500 text-black font-medium hover:bg-yellow-400 transition"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;