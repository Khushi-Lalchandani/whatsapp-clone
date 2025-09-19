const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Trigger when a new message is added to any chat
exports.sendMessageNotification = functions.database.ref('/messages/{chatId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const { chatId, messageId } = context.params;
    const message = snapshot.val();
    
    console.log('New message in chat:', chatId, 'Message:', messageId);
    
    try {
      // Get sender info
      const senderSnapshot = await admin.database().ref(`users/${message.sender}`).once('value');
      const sender = senderSnapshot.val();
      
      // Get receiver info
      const receiverSnapshot = await admin.database().ref(`users/${message.receiver}`).once('value');
      const receiver = receiverSnapshot.val();
      
      // Get receiver's FCM token
      const tokenSnapshot = await admin.database().ref(`userTokens/${message.receiver}`).once('value');
      const tokenData = tokenSnapshot.val();
      
      if (!tokenData || !tokenData.token) {
        console.log('No FCM token found for receiver:', message.receiver);
        return null;
      }
      
      const senderName = sender.fullName || sender.email || 'Someone';
      
      // Create notification payload with actual message content
      const payload = {
        notification: {
          title: `${senderName}`,
          body: message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text,
          icon: '/firebase-logo.png',
        },
        data: {
          messageId: messageId,
          chatId: chatId,
          senderId: message.sender,
          senderName: senderName,
          message: message.text, // Include full message text
          isGroup: 'false',
          timestamp: Date.now().toString()
        }
      };
      
      // Send notification
      const response = await admin.messaging().sendToDevice(tokenData.token, payload);
      console.log('Notification sent successfully:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  });

// Trigger when a new group message is added
exports.sendGroupMessageNotification = functions.database.ref('/groupMessages/{groupId}/{messageId}')
  .onCreate(async (snapshot, context) => {
    const { groupId, messageId } = context.params;
    const message = snapshot.val();
    
    console.log('New group message in:', groupId, 'Message:', messageId);
    
    try {
      // Get group info
      const groupSnapshot = await admin.database().ref(`groups/${groupId}`).once('value');
      const group = groupSnapshot.val();
      
      if (!group || !group.members) {
        console.log('Group not found or no members:', groupId);
        return null;
      }
      
      // Get sender info
      const senderSnapshot = await admin.database().ref(`users/${message.sender}`).once('value');
      const sender = senderSnapshot.val();
      const senderName = sender.fullName || sender.email || 'Someone';
      
      // Get all member tokens (excluding sender)
      const memberTokenPromises = group.members
        .filter(memberId => memberId !== message.sender)
        .map(memberId => admin.database().ref(`userTokens/${memberId}`).once('value'));
      
      const memberTokenSnapshots = await Promise.all(memberTokenPromises);
      const tokens = memberTokenSnapshots
        .map(snapshot => snapshot.val()?.token)
        .filter(token => token); // Remove null/undefined tokens
      
      if (tokens.length === 0) {
        console.log('No FCM tokens found for group members');
        return null;
      }
      
      // Create notification payload with actual message content
      const payload = {
        notification: {
          title: group.name,
          body: `${senderName}: ${message.text.length > 100 ? message.text.substring(0, 100) + '...' : message.text}`,
          icon: '/firebase-logo.png',
        },
        data: {
          messageId: messageId,
          groupId: groupId,
          senderId: message.sender,
          senderName: senderName,
          groupName: group.name,
          message: message.text, // Include full message text
          isGroup: 'true',
          timestamp: Date.now().toString()
        }
      };
      
      // Send notification to all group members
      const response = await admin.messaging().sendToDevice(tokens, payload);
      console.log('Group notification sent successfully:', response);
      
      return response;
    } catch (error) {
      console.error('Error sending group notification:', error);
      return null;
    }
  });

// Clean up old tokens periodically
exports.cleanupOldTokens = functions.pubsub.schedule('every 24 hours').onRun(async (_context) => {
  const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  try {
    const tokensSnapshot = await admin.database().ref('userTokens').once('value');
    const tokens = tokensSnapshot.val();
    
    if (!tokens) return null;
    
    const updates = {};
    Object.keys(tokens).forEach(userId => {
      const tokenData = tokens[userId];
      if (tokenData.timestamp < oneWeekAgo) {
        updates[`userTokens/${userId}`] = null;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await admin.database().ref().update(updates);
      console.log(`Cleaned up ${Object.keys(updates).length} old tokens`);
    }
    
    return null;
  } catch (error) {
    console.error('Error cleaning up tokens:', error);
    return null;
  }
});
