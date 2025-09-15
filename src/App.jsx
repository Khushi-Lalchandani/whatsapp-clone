import { Route, Routes, BrowserRouter } from 'react-router-dom';
import './App.css';
import Login from './pages/Login/Login';
import ChatWindow from './pages/chat/ChatWindow';
// import ProtectedRoutes from './auth/auth.guard.js';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { setupPresence } from './utils/presence';
import CreateGroupModal from './components/CreateGroupModal';
import MainWindow from './pages/chat/MainWindow';

function App() {

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(user);
      setIsAuthenticated(!!user);

      if (user) {
        setupPresence(user.uid, true);
      }
    });

    const handleBeforeUnload = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        setupPresence(currentUser.uid, false);
      }
    };


    //problem is protecting routes. might need upgrading of version.
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  return (
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<ChatWindow />} />
        <Route path="/chat/:chatId" element={<ChatWindow />} />
        <Route path="/chat/group/:groupId" element={<ChatWindow />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
