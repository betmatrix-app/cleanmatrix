import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, TENANT_ID } from '../lib/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const ref  = doc(db, `tenants/${TENANT_ID}/usuarios`, firebaseUser.uid);
        const snap = await getDoc(ref);
        setUser(firebaseUser);
        const profileData = snap.exists() ? snap.data() : null;
        setProfile(profileData);
        const rol = profileData?.rol || '';
        const currentPath = window.location.pathname;
        if (rol === 'Operario de campo' && !currentPath.startsWith('/operario-campo')) {
          window.location.href = '/operario-campo';
        } else if (rol === 'Operario de taller' && !currentPath.startsWith('/operario-taller')) {
          window.location.href = '/operario-taller';
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const login  = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const can    = (permiso) => profile?.permisos?.[permiso] === true;

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);