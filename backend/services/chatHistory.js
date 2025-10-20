/**
 * Chat history management service
 * Handles storing, retrieving, and managing chat history in Firestore
 */

import { db } from '../config/firebase.js';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

/**
 * Create a new chat session
 */
const createChatSession = async (userId, title, firstMessage, firstResponse) => {
  try {
    if (!db) {
      console.log('⚠️  Firestore not available, cannot create chat session');
      return null;
    }
    
    const chatRef = doc(collection(db, `users/${userId}/chats`));
    const chatId = chatRef.id;
    
    const chatData = {
      id: chatId,
      title: title || 'New Chat',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      messageCount: 2, // user + bot messages
      lastMessage: firstResponse ? firstResponse.substring(0, 100) + (firstResponse.length > 100 ? '...' : '') : '',
      edited: false
    };
    
    await setDoc(chatRef, chatData);
    
    // Add initial messages
    await addMessageToChat(userId, chatId, firstMessage, 'user');
    await addMessageToChat(userId, chatId, firstResponse, 'bot');
    
    return chatId;
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
};

/**
 * Add a message to an existing chat
 */
const addMessageToChat = async (userId, chatId, content, role, isEdited = false) => {
  try {
    const messageRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    
    const messageData = {
      content: content,
      role: role, // 'user' or 'bot'
      createdAt: serverTimestamp(),
      edited: isEdited,
      editedAt: isEdited ? serverTimestamp() : null
    };
    
    const docRef = await addDoc(messageRef, messageData);
    
    // Update chat metadata
    await updateChatMetadata(userId, chatId, content, role === 'bot');
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding message to chat:', error);
    throw error;
  }
};

/**
 * Update chat metadata (last message, updated time, message count)
 */
const updateChatMetadata = async (userId, chatId, lastMessage, isBotMessage = false) => {
  try {
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    
    const updateData = {
      updatedAt: serverTimestamp(),
      lastMessage: lastMessage.substring(0, 100) + (lastMessage.length > 100 ? '...' : '')
    };
    
    // Get current message count and increment
    const chatDoc = await getDoc(chatRef);
    if (chatDoc.exists()) {
      const currentCount = chatDoc.data().messageCount || 0;
      updateData.messageCount = currentCount + 1;
    }
    
    await updateDoc(chatRef, updateData);
  } catch (error) {
    console.error('Error updating chat metadata:', error);
    throw error;
  }
};

/**
 * Get user's chat history
 */
const getUserChatHistory = async (userId) => {
  try {
    console.log(`📚 Getting chat history for user: ${userId}`);
    
    if (!userId) {
      throw new Error('User ID is required');
    }
    
    if (!db) {
      console.log('⚠️  Firestore not available, returning empty chat history');
      return [];
    }
    
    const chatsRef = collection(db, `users/${userId}/chats`);
    const q = query(chatsRef, orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    
    console.log(`📚 Found ${snapshot.size} chat documents`);
    
    const chats = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      chats.push({
        id: doc.id,
        ...data
      });
    });
    
    console.log(`📚 Returning ${chats.length} chats`);
    return chats;
  } catch (error) {
    console.error('❌ Error getting user chat history:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error code:', error.code);
    
    // Return empty array instead of throwing error to prevent 500 response
    console.log('⚠️  Returning empty chat history due to error');
    return [];
  }
};

/**
 * Get messages for a specific chat
 */
const getChatMessages = async (userId, chatId) => {
  try {
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const q = query(messagesRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    const messages = [];
    snapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting chat messages:', error);
    throw error;
  }
};

/**
 * Edit a message and mark as edited
 */
const editMessage = async (userId, chatId, messageId, newContent) => {
  try {
    const messageRef = doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`);
    
    await updateDoc(messageRef, {
      content: newContent,
      edited: true,
      editedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
};

/**
 * Delete a chat and all its messages
 */
const deleteChat = async (userId, chatId) => {
  try {
    // Delete all messages first
    const messagesRef = collection(db, `users/${userId}/chats/${chatId}/messages`);
    const messagesSnapshot = await getDocs(messagesRef);
    
    const batch = writeBatch(db);
    
    // Delete all messages
    messagesSnapshot.forEach(messageDoc => {
      batch.delete(messageDoc.ref);
    });
    
    // Delete the chat document
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    batch.delete(chatRef);
    
    await batch.commit();
    
    return true;
  } catch (error) {
    console.error('Error deleting chat:', error);
    throw error;
  }
};

/**
 * Delete a specific message
 */
const deleteMessage = async (userId, chatId, messageId) => {
  try {
    const messageRef = doc(db, `users/${userId}/chats/${chatId}/messages/${messageId}`);
    await deleteDoc(messageRef);
    
    // Update chat metadata
    await updateChatMetadata(userId, chatId, '', false);
    
    return true;
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

/**
 * Update chat title
 */
const updateChatTitle = async (userId, chatId, newTitle) => {
  try {
    const chatRef = doc(db, `users/${userId}/chats/${chatId}`);
    
    await updateDoc(chatRef, {
      title: newTitle,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating chat title:', error);
    throw error;
  }
};

/**
 * Get chat statistics
 */
const getChatStatistics = async (userId) => {
  try {
    const chatsRef = collection(db, `users/${userId}/chats`);
    const snapshot = await getDocs(chatsRef);
    
    let totalChats = 0;
    let totalMessages = 0;
    let editedMessages = 0;
    
    snapshot.forEach(doc => {
      const chatData = doc.data();
      totalChats++;
      totalMessages += chatData.messageCount || 0;
    });
    
    // Count edited messages across all chats
    for (const chatDoc of snapshot.docs) {
      const messagesRef = collection(db, `users/${userId}/chats/${chatDoc.id}/messages`);
      const messagesSnapshot = await getDocs(messagesRef);
      
      messagesSnapshot.forEach(messageDoc => {
        if (messageDoc.data().edited) {
          editedMessages++;
        }
      });
    }
    
    return {
      totalChats,
      totalMessages,
      editedMessages,
      averageMessagesPerChat: totalChats > 0 ? Math.round(totalMessages / totalChats) : 0
    };
  } catch (error) {
    console.error('Error getting chat statistics:', error);
    throw error;
  }
};

export {
  createChatSession,
  addMessageToChat,
  updateChatMetadata,
  getUserChatHistory,
  getChatMessages,
  editMessage,
  deleteChat,
  deleteMessage,
  updateChatTitle,
  getChatStatistics
};
