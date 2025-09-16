import { Route, Routes, BrowserRouter } from 'react-router-dom';
import './App.css';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/firebase';
import { setupPresence } from './utils/presence';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login/Login';
import ChatWindow from './pages/chat/ChatWindow';
import ProtectedRoutes from './auth/auth.guard';
function App() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log(user);
      setIsAuthenticated(!!user);
      setLoading(false);
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
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  if (loading) {
    return <div>Loading...</div>;
  }
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<ProtectedRoutes isAuthenticated={isAuthenticated} />}>
          <Route path="/chat" element={<ChatWindow />} />
          <Route path="/chat/:chatId" element={<ChatWindow />} />
          <Route path="/chat/group/:groupId" element={<ChatWindow />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: '#1F1F1F',
          color: '#FBBF24',
          border: '1px solid #EAB308'
        }}
      />
    </BrowserRouter>
  );
}
export default App;
