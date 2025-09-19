import { Route, Routes, BrowserRouter } from 'react-router-dom';
import './App.css';
import Login from './pages/Login/Login';
import ChatWindow from './pages/chat/ChatWindow';
// import ProtectedRoutes from './auth/auth.guard.js';
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, generateToken, listenForegroundMessages } from './firebase/firebase';
import { setupPresence, cleanupPresence } from './utils/presence';
import CreateGroupModal from './components/CreateGroupModal';
import MainWindow from './pages/chat/MainWindow';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showBrowserNotification, isAppInForeground } from './utils/notifications';
import NotificationComponent from './components/NotificationComponent';

function App() {
  const [_isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [authInitialized, setAuthInitialized] = React.useState(false);

  useEffect(() => {
    // Initialize FCM and notifications
    const initializeNotifications = async () => {
      try {
        await generateToken();

        // Listen for foreground messages
        const unsubscribeForeground = listenForegroundMessages((payload) => {
          console.log('Foreground FCM message received:', payload);

          if (!isAppInForeground()) {
            // Show browser notification if app is not in foreground
            showBrowserNotification(
              payload.notification?.title || 'New Message',
              payload.notification?.body || 'You have a new message',
              payload.notification?.icon || '/firebase-logo.png',
              payload.data || {}
            );
          }
          // Note: Toast notifications are handled by the database listeners
          // to avoid duplicate notifications
        });

        return unsubscribeForeground;
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    let unsubscribeForeground;
    initializeNotifications().then(unsub => {
      unsubscribeForeground = unsub;
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User: ${user.uid}` : 'No user');

      if (user) {
        // User is authenticated
        setIsAuthenticated(true);
        console.log('Setting up presence for authenticated user');
        setupPresence(user.uid, true);
      } else {
        // User is not authenticated
        setIsAuthenticated(false);
        console.log('Cleaning up presence - user not authenticated');
        cleanupPresence();
      }

      // Mark auth as initialized after first callback
      if (!authInitialized) {
        setAuthInitialized(true);
      }
    });

    const handleBeforeUnload = () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('Page unloading - setting user offline');
        setupPresence(currentUser.uid, false);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      cleanupPresence();
    };
  }, [authInitialized]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/chat" element={<ChatWindow />} />
        <Route path="/chat/:chatId" element={<ChatWindow />} />
        <Route path="/chat/group/:groupId" element={<ChatWindow />} />
      </Routes>
      <NotificationComponent />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: '#1f1f1f',
          color: '#fbbf24',
          border: '1px solid #eab308',
          fontWeight: 'bold'
        }}
        style={{
          zIndex: 9999
        }}
      />
    </BrowserRouter>
  );
}

export default App;
