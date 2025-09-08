import React, { useState } from "react";
import { auth, database } from "../../firebase/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { set, ref } from "firebase/database";
import { useNavigate } from "react-router-dom";
import LoadingSpinner from "../../components/LoadingSpinner";
import { setupPresence } from "../../utils/presence";

export default function AuthForm() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showLoadingSpinner, setShowLoadingSpinner] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowLoadingSpinner(true);

    try {
      if (!isLogin && password === confirmPassword) {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await set(ref(database, "users/" + user.uid), {
          fullName,
          email,
          createdAt: new Date().toISOString(),
          id: user.uid,
          profileImage: "",
          status: {
            state: "offline",
            last_changed: Date.now(),
          },
        });

        localStorage.setItem("user", JSON.stringify(user.email));

      } else if (isLogin) {
        // Login
        const data = await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("user", JSON.stringify(data.user.email));
      }

      // Show spinner briefly
      setTimeout(() => {
        navigate("/chat");
      }, 1000);

    } catch (err) {
      setShowLoadingSpinner(false);
      if (err.code === "auth/email-already-in-use") {
        alert("Email already in use");
      } else if (err.code === "auth/invalid-email") {
        alert("Invalid email");
      } else if (err.code === "auth/weak-password") {
        alert("Weak password");
      } else if (err.code === "auth/invalid-credential") {
        alert("Password is incorrect");
      } else {
        alert("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div
      className="flex items-center justify-center h-screen bg-cover bg-center"
      style={{ backgroundImage: `url('/chat-bg.png')` }}
    >
      {showLoadingSpinner && <LoadingSpinner />}
      <div className="bg-black/70 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-yellow-500 mb-6">
          {isLogin ? "Login" : "Sign Up"}
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              onChange={(e) => setFullName(e.target.value)}
              className="p-3 rounded-lg bg-black/40 border border-yellow-400 text-white"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-yellow-400 text-white"
          />
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg bg-black/40 border border-yellow-400 text-white"
          />
          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="p-3 rounded-lg bg-black/40 border border-yellow-400 text-white"
            />
          )}
          <button
            type="submit"
            className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black font-bold py-3 rounded-lg shadow-md hover:opacity-90"
          >
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <p className="text-center text-gray-300 mt-4">
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setEmail("");
              setPassword("");
              setFullName("");
              setConfirmPassword("");
              setIsLogin(!isLogin);
            }}
            className="text-yellow-400 hover:underline"
          >
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}
