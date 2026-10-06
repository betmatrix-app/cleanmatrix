import { useState, useEffect } from 'react';
import { db, TENANT_ID } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const SECCIONES = [
  { key: 'interior',   label: 'Partes de interior' },
  { key: 'exterior',   label: 'Partes de exterior' },
  { key: 'repuestos',  label: 'Repuestos' },
  { key: 'operarios',  label: 'Operarios de limpieza' },
  { key: 'cargadores', label: 'Cargadores' },
];

function SeccionConfig({ seccion }) {
  const [items,   setItems]   = useState([]);
  const [nuevo,   setNuevo]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const q = query(collection(db, `tenants/${TENANT_ID}/config_limpieza_${seccion.key}`), orderBy('nombre'));
    return onSnapshot(q, snap => setItems(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [seccion.key]);

  const handleAnadir = async () => {
    if (!nuevo.trim()) { setError('Escribe un nombre.'); return; }
    setLoading(true); setError('');
    try {
      await addDoc(collection(db, `tenants/${TENANT_ID}/config_limpieza_${seccion.key}`), {
        nombre: nuevo.trim(), creadoEn: serverTimestamp(),
      });
      setNuevo('');
    } catch (err) { setError('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const handleEliminar = async (id) => {
    if (window.confirm('Eliminar este elemento?'))
      await deleteDoc(doc(db, `tenants/${TENANT_ID}/config_limpieza_${seccion.key}`, id));
  };

  return (
    <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', marginBottom: 12 }}>{seccion.label}</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input type="text" value={nuevo} onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAnadir()}
          placeholder="Nuevo elemento..."
          style={{ flex: 1, background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#e6edf3' }} />
        <button onClick={handleAnadir} disabled={loading}
          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#58a6ff', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
          + Añadir
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#f85149', marginBottom: 8 }}>{error}</div>}
      <div>
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #21262d' }}>
            <span style={{ fontSize: 13, color: '#e6edf3' }}>{item.nombre}</span>
            <button onClick={() => handleEliminar(item.id)}
              style={{ padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(248,81,73,0.3)', background: 'rgba(248,81,73,0.1)', color: '#f85149', fontSize: 11, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12, color: '#484f58', paddingTop: 4 }}>Sin elementos configurados</div>}
      </div>
    </div>
  );
}

export default function Configuracion() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#e6edf3', marginBottom: 20 }}>Configuración</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {SECCIONES.map(s => <SeccionConfig key={s.key} seccion={s} />)}
      </div>
    </div>
  );
}