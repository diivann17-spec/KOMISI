import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

// Helper: Role Mapping
const ROLE_LABELS = {
  admin: 'Admin Sistem',
  pimpinan: 'Pimpinan DPRD',
  petugas: 'Petugas Komisi',
  anggota: 'Anggota DPRD'
};

export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch additional user data from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        uid: user.uid,
        email: user.email,
        ...userData,
        roleLabel: ROLE_LABELS[userData.role] || userData.role
      };
    } else {
      throw new Error('User data not found in Firestore');
    }
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw error;
  }
};

// Temporary function to seed users
export const registerUser = async (email, password, displayName, role) => {
  try {
    let user;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      user = userCredential.user;
    } catch (createErr) {
      if (createErr.code === 'auth/email-already-in-use') {
        // Jika sudah terdaftar di Firebase Auth, coba login lalu perbarui Firestore
        const credential = await signInWithEmailAndPassword(auth, email, password);
        user = credential.user;
      } else {
        throw createErr;
      }
    }
    
    // Save/Update in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      displayName,
      email,
      role,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    return user;
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
};

// Listen to auth state changes
export const subscribeToAuth = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        callback({
          uid: user.uid,
          email: user.email,
          ...userData,
          roleLabel: ROLE_LABELS[userData.role] || userData.role
        });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};
