import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { userStorage } from './storage';

/**
 * Logs an activity to the Firestore 'audit_logs' collection.
 * @param {string} action - The action performed (e.g., 'LOGIN', 'CREATE_MEETING', 'APPROVE_LEAVE')
 * @param {string} details - Human-readable description of the action
 * @param {object} metadata - Additional context or data associated with the action
 */
export const logActivity = async (action, details, metadata = {}) => {
  try {
    const user = userStorage.getCurrentUser(); // fallback to local storage for now
    const uid = user ? user.uid : 'SYSTEM';
    const displayName = user ? user.displayName : 'System';

    await addDoc(collection(db, 'audit_logs'), {
      action,
      details,
      metadata,
      uid,
      displayName,
      timestamp: serverTimestamp()
    });
    
    console.log(`[Audit Trail] ${action}: ${details}`);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};
