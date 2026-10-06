import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db, TENANT_ID } from '../../lib/firebase';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const redirigirPorRol = (rol) => {
    if (rol === 'Operario de campo')  { window.location.href = '/operario-campo'; return; }
    if (rol === 'Operario de taller') { window.location.href = '/operario-taller'; return; }
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(errorMessage(err.code));
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      const auth     = getAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const user   = result.user;

      const ref  = doc(db, `tenants/${TENANT_ID}/usuarios`, user.uid);
      let snap = await getDoc(ref);

      if (!snap.exists()) {
        const busqueda = query(collection(db, `tenants/${TENANT_ID}/usuarios`), where('email', '==', user.email));
        const results = await getDocs(busqueda);
        if (results.empty) {
          await auth.signOut();
          setError('Acceso denegado. Contacta con el manager para obtener acceso.');
          return;
        }
        const existingDoc = results.docs[0];
        await setDoc(ref, { ...existingDoc.data(), uid: user.uid }, { merge: true });
        snap = await getDoc(ref);
      }

      const rol = snap.data()?.rol || '';
      redirigirPorRol(rol);

    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Error al iniciar sesion con Google.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="font-mono text-[28px] font-semibold text-accent tracking-tight">FloMatrix</div>
          <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest">Fleet Operations Platform</div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-8">
          <h1 className="text-[16px] font-semibold mb-6">Iniciar sesion</h1>
          <button onClick={handleGoogle} disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-medium text-[13px] py-2.5 rounded-lg transition-colors mb-4 disabled:opacity-50">
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
            </svg>
            Entrar con Google
          </button>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-[11px] text-slate-500">o con email</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 uppercase tracking-[0.5px] font-medium">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@empresa.es" required
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 outline-none focus:border-accent transition-colors" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-slate-500 uppercase tracking-[0.5px] font-medium">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                className="bg-surface2 border border-border rounded-lg px-3 py-2 text-[13px] text-slate-200 placeholder-slate-600 outline-none focus:border-accent transition-colors" />
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-[12px] px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-accent hover:bg-accent2 disabled:opacity-50 text-white font-medium text-[13px] py-2.5 rounded-lg transition-colors">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function errorMessage(code) {
  const messages = {
    'auth/invalid-credential':     'Email o password incorrectos.',
    'auth/user-not-found':         'No existe una cuenta con este email.',
    'auth/wrong-password':         'Password incorrecta.',
    'auth/too-many-requests':      'Demasiados intentos.',
    'auth/network-request-failed': 'Error de conexion.',
  };
  return messages[code] || 'Error al iniciar sesion.';
}