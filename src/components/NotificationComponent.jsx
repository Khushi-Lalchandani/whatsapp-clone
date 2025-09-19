import React, { useEffect, useState } from 'react';
import { showMessageNotification, testNotification, isAppInForeground } from '../utils/notifications';
import { toast } from 'react-toastify';

const NotificationTester = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [testMessages] = useState([
    {
      id: 'test-1',
      sender: 'John Doe',
      message: 'Hey there! How are you doing today?',
      isGroup: false,
      chatId: 'user123'
    },
    {
      id: 'test-2',
      sender: 'Alice Smith',
      message: 'This is a really long message that should be truncated in the notification preview to test how the system handles longer text content that exceeds the normal display limits.',
      isGroup: false,
      chatId: 'user456'
    },
    {
      id: 'test-3',
      sender: 'Team Chat',
      message: 'Meeting starts in 10 minutes!',
      isGroup: true,
      groupId: 'group789',
      groupName: 'Work Team'
    },
    {
      id: 'test-4',
      sender: 'Bob Wilson',
      message: '📁 Sent a file',
      isGroup: true,
      groupId: 'group456',
      groupName: 'Project Alpha'
    },
    {
      id: 'test-5',
      sender: 'Sarah Johnson',
      message: '🖼️ Sent an image',
      isGroup: false,
      chatId: 'user789'
    }
  ]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+T to toggle notification tester
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        setIsVisible(prev => !prev);
        console.log('Notification tester toggled:', !isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  const triggerTestNotification = (testMsg) => {
    console.log('Testing notification:', testMsg);

    // Create encrypted message (simplified for testing)
    const encryptedMessage = testMsg.message;

    showMessageNotification(
      testMsg.sender,
      encryptedMessage,
      testMsg.id + '-' + Date.now(),
      testMsg.isGroup,
      testMsg.chatId,
      testMsg.groupId,
      testMsg.groupName
    );
  };

  const testAppState = () => {
    const inForeground = isAppInForeground();
    toast.info(`App State: ${inForeground ? 'Foreground' : 'Background'}\nVisibility: ${document.visibilityState}\nHidden: ${document.hidden}`, {
      position: 'top-center',
      autoClose: 3000,
      style: { whiteSpace: 'pre-line' }
    });
  };

  const testToastSystem = () => {
    testNotification();
  };

  const clearAllNotifications = () => {
    // Clear all toasts
    toast.dismiss();

    // Request to close all browser notifications (limited by browser security)
    if ('Notification' in window) {
      console.log('Attempting to clear browser notifications (may be limited by browser)');
    }

    toast.success('Cleared all notifications', {
      position: 'top-center',
      autoClose: 2000
    });
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-50 hover:opacity-100 transition-opacity">
          Press Ctrl+Shift+T to open notification tester
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Notification Tester</h2>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-b pb-4">
            <h3 className="font-semibold text-gray-700 mb-2">System Tests</h3>
            <div className="flex gap-2">
              <button
                onClick={testAppState}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                Check App State
              </button>
              <button
                onClick={testToastSystem}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
              >
                Test Toast System
              </button>
              <button
                onClick={clearAllNotifications}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
              >
                Clear All
              </button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Message Notifications</h3>
            <div className="space-y-2">
              {testMessages.map((msg) => (
                <div key={msg.id} className="border rounded p-3">
                  <div className="text-sm text-gray-600 mb-1">
                    <strong>{msg.sender}</strong>
                    {msg.isGroup && <span className="text-blue-600"> (Group: {msg.groupName})</span>}
                  </div>
                  <div className="text-sm text-gray-800 mb-2 font-mono bg-gray-50 p-1 rounded">
                    {msg.message.length > 50 ? msg.message.substring(0, 50) + '...' : msg.message}
                  </div>
                  <button
                    onClick={() => triggerTestNotification(msg)}
                    className="px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                  >
                    Test Notification
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-gray-500 mt-4">
            <p><strong>Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1">
              <li>Switch to another tab to test background notifications</li>
              <li>Check browser console for detailed logs</li>
              <li>Ensure notification permission is granted</li>
              <li>Test both foreground (toasts) and background (browser) modes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const NotificationComponent = () => {
  return (
    <>
      <NotificationTester />
    </>
  );
};

export default NotificationComponent;
