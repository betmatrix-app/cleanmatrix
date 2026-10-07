import { useState, useEffect } from 'react';
import { db, TENANT_ID } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { subirFoto } from '../../lib/cloudinary';

const TURNOS = ['Mañana', 'Tarde', 'Noche'];

function useVehiculos() {
  const [vehiculos, setVehiculos] = useState([]);
  useEffect(() => {
    const q = query(collection(db, `tenants/${TENANT_ID}/vehiculos`), orderBy('matricula'));
    return onSnapshot(q, snap => setVehiculos(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);
  return vehiculos;
}

function useConfig() {
  const [config, setConfig] = useState({ interior: [], exterior: [], repuestos: [], operarios: [], cargadores: [] });
  useEffect(() => {
    const cols = ['interior', 'exterior', 'repuestos', 'operarios', 'cargadores'];
    const unsubs = cols.map(col =>
      onSnapshot(query(collection(db, `tenants/${TENANT_ID}/config_limpieza_${col}`), orderBy('nombre')), snap => {
        setConfig(prev => ({ ...prev, [col]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);
  return config;
}

function FotosUpload({ fotos, onChange }) {
  const handleFoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const foto = await subirFoto(file);
      onChange([...fotos, foto]);
    } catch { }
  };

  const removeFoto = (i) => onChange(fotos.filter((_, j) => j !== i));

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
        {fotos.map((f, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <img src={f.url} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }} />
            <button onClick={() => removeFoto(i)}
              style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 99, background: '#f85149', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(248,81,73,0.08)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#f85149' }}>
        📷 {fotos.length === 0 ? 'Foto requerida — toca para subir' : '+ Añadir otra foto'}
        <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
      </label>
    </div>
  );
}

function CheckInterior({ nombre, value, onChange }) {
  const esMalo = value?.estado === 'Mal';
  return (
    <div style={{ borderBottom: '0.5px solid #21262d', paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: '#e6edf3' }}>{nombre}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Bien', 'Mal'].map(op => (
            <button key={op} onClick={() => onChange({ estado: op, fotos: [] })}
              style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid',
                background: value?.estado === op ? (op === 'Bien' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)') : 'transparent',
                color: value?.estado === op ? (op === 'Bien' ? '#3fb950' : '#f85149') : '#8b949e',
                borderColor: value?.estado === op ? (op === 'Bien' ? '#3fb950' : '#f85149') : '#21262d' }}>
              {op}
            </button>
          ))}
        </div>
      </div>
      {esMalo && (
        <FotosUpload fotos={value?.fotos || []} onChange={fotos => onChange({ ...value, fotos })} />
      )}
    </div>
  );
}

function CheckExterior({ nombre, value, onChange }) {
  const esMalo = value?.estado === 'Mal';
  return (
    <div style={{ borderBottom: '0.5px solid #21262d', paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: '#e6edf3' }}>{nombre}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Bien', 'Mal'].map(op => (
            <button key={op} onClick={() => onChange({ estado: op, fotos: [], reportado: '' })}
              style={{ padding: '3px 12px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid',
                background: value?.estado === op ? (op === 'Bien' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)') : 'transparent',
                color: value?.estado === op ? (op === 'Bien' ? '#3fb950' : '#f85149') : '#8b949e',
                borderColor: value?.estado === op ? (op === 'Bien' ? '#3fb950' : '#f85149') : '#21262d' }}>
              {op}
            </button>
          ))}
        </div>
      </div>
      {esMalo && (
        <>
          <FotosUpload fotos={value?.fotos || []} onChange={fotos => onChange({ ...value, fotos })} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>¿Se ha reportado a responsable?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Sí', 'No'].map(op => (
                <button key={op} onClick={() => onChange({ ...value, reportado: op })}
                  style={{ padding: '3px 14px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid',
                    background: value?.reportado === op ? 'rgba(88,166,255,0.15)' : 'transparent',
                    color: value?.reportado === op ? '#58a6ff' : '#8b949e',
                    borderColor: value?.reportado === op ? '#58a6ff' : '#21262d' }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CheckRepuesto({ nombre, value, onChange }) {
  const falta = value?.estado === 'Falta algún repuesto';
  return (
    <div style={{ borderBottom: '0.5px solid #21262d', paddingBottom: 10, marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ flex: 1, fontSize: 13, color: '#e6edf3' }}>{nombre}</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Están', 'Falta algún repuesto'].map(op => (
            <button key={op} onClick={() => onChange({ estado: op, fotos: [], queFalta: '', reportado: '' })}
              style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid', whiteSpace: 'nowrap',
                background: value?.estado === op ? (op === 'Están' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)') : 'transparent',
                color: value?.estado === op ? (op === 'Están' ? '#3fb950' : '#f85149') : '#8b949e',
                borderColor: value?.estado === op ? (op === 'Están' ? '#3fb950' : '#f85149') : '#21262d' }}>
              {op}
            </button>
          ))}
        </div>
      </div>
      {falta && (
        <>
          <FotosUpload fotos={value?.fotos || []} onChange={fotos => onChange({ ...value, fotos })} />
          <input type="text" value={value?.queFalta || ''} onChange={e => onChange({ ...value, queFalta: e.target.value })}
            placeholder="¿Qué repuestos faltan?"
            style={{ marginTop: 8, width: '100%', background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e6edf3', boxSizing: 'border-box' }} />
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>¿Se ha reportado a responsable?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['Sí', 'No'].map(op => (
                <button key={op} onClick={() => onChange({ ...value, reportado: op })}
                  style={{ padding: '3px 14px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid',
                    background: value?.reportado === op ? 'rgba(88,166,255,0.15)' : 'transparent',
                    color: value?.reportado === op ? '#58a6ff' : '#8b949e',
                    borderColor: value?.reportado === op ? '#58a6ff' : '#21262d' }}>
                  {op}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function NuevaAuditoria() {
  const { profile } = useAuth();
  const vehiculos   = useVehiculos();
  const config      = useConfig();

  const [busqueda,  setBusqueda]  = useState('');
  const [matricula, setMatricula] = useState('');
  const [turno,     setTurno]     = useState('');
  const [operario,  setOperario]  = useState('');
  const [cargador,  setCargador]  = useState('');
  const [checklist, setChecklist] = useState({});
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');
  const [done,      setDone]      = useState(false);

  const vehiculosFiltrados = busqueda.length >= 2
    ? vehiculos.filter(v => v.matricula.includes(busqueda.toUpperCase())).slice(0, 8)
    : [];

  const operariosFiltrados = turno
    ? config.operarios.filter(o => o.turno === turno)
    : [];

  const setItem = (zona, nombre, val) =>
    setChecklist(prev => ({ ...prev, [`${zona}__${nombre}`]: { zona, nombre, ...val } }));
  const getItem = (zona, nombre) => checklist[`${zona}__${nombre}`] || {};

  const handleSubmit = async () => {
    if (!matricula) { setError('Selecciona una matrícula.'); return; }
    if (!turno)     { setError('Selecciona un turno.'); return; }
    if (!operario)  { setError('Selecciona un operario.'); return; }
    if (!cargador)  { setError('Selecciona un cargador.'); return; }

    const items = Object.values(checklist);
    const sinFoto = items.filter(i => (i.estado === 'Mal' || i.estado === 'Falta algún repuesto') && (!i.fotos || i.fotos.length === 0));
    if (sinFoto.length > 0) { setError(`Faltan fotos en: ${sinFoto.map(i => i.nombre).join(', ')}`); return; }

    setLoading(true); setError('');
    try {
      await addDoc(collection(db, `tenants/${TENANT_ID}/auditorias_limpieza`), {
        matricula,
        turno,
        operario,
        cargador,
        auditor:   profile?.nombre || '',
        auditorId: profile?.uid || '',
        checklist: items,
        creadoEn:  serverTimestamp(),
      });
      setDone(true);
      setTimeout(() => {
        setMatricula(''); setBusqueda(''); setTurno(''); setOperario('');
        setCargador(''); setChecklist({}); setDone(false);
      }, 3000);
    } catch (err) { setError('Error al guardar: ' + err.message); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#e6edf3' }}>Auditoría guardada</div>
      <div style={{ fontSize: 13, color: '#8b949e' }}>{matricula} · {turno} · {operario}</div>
    </div>
  );

  return (
    <div style={{ padding: '24px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#e6edf3', marginBottom: 20 }}>Nueva auditoría</div>

      <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Matrícula</div>
        <input type="text" value={busqueda} onChange={e => { setBusqueda(e.target.value.toUpperCase()); setMatricula(''); }}
          placeholder="Escribe la matrícula..."
          style={{ width: '100%', background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 8, padding: '10px 12px', fontSize: 14, color: '#e6edf3', boxSizing: 'border-box' }} />
        {vehiculosFiltrados.length > 0 && !matricula && (
          <div style={{ background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 8, marginTop: 4, overflow: 'hidden' }}>
            {vehiculosFiltrados.map(v => (
              <button key={v.id} onClick={() => { setMatricula(v.matricula); setBusqueda(v.matricula); }}
                style={{ width: '100%', textAlign: 'left', padding: '10px 12px', fontSize: 13, color: '#e6edf3', background: 'none', border: 'none', borderBottom: '0.5px solid #21262d', cursor: 'pointer' }}>
                <span style={{ fontFamily: 'monospace' }}>{v.matricula}</span>
                <span style={{ color: '#8b949e', marginLeft: 8, fontSize: 12 }}>{v.marca} {v.modelo}</span>
              </button>
            ))}
          </div>
        )}
        {matricula && <div style={{ marginTop: 6, fontSize: 12, color: '#3fb950' }}>✓ {matricula} seleccionada</div>}
      </div>

      <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Turno</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {TURNOS.map(t => (
            <button key={t} onClick={() => { setTurno(t); setOperario(''); }}
              style={{ flex: 1, padding: '10px', borderRadius: 8, fontSize: 13, cursor: 'pointer', border: '0.5px solid',
                background: turno === t ? 'rgba(88,166,255,0.15)' : 'transparent',
                color: turno === t ? '#58a6ff' : '#8b949e',
                borderColor: turno === t ? '#58a6ff' : '#21262d' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Operario de limpieza</div>
          <select value={operario} onChange={e => setOperario(e.target.value)} disabled={!turno}
            style={{ width: '100%', background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: operario ? '#e6edf3' : '#8b949e', opacity: turno ? 1 : 0.5 }}>
            <option value="">{turno ? 'Seleccionar...' : 'Selecciona turno primero'}</option>
            {operariosFiltrados.map(o => <option key={o.id} value={o.nombre}>{o.nombre}</option>)}
          </select>
        </div>
        <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Cargador</div>
          <select value={cargador} onChange={e => setCargador(e.target.value)}
            style={{ width: '100%', background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: cargador ? '#e6edf3' : '#8b949e' }}>
            <option value="">Seleccionar...</option>
            {config.cargadores.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        {config.interior.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Interior</div>
            {config.interior.map(item => (
              <CheckInterior key={item.id} nombre={item.nombre}
                value={getItem('interior', item.nombre)}
                onChange={val => setItem('interior', item.nombre, val)} />
            ))}
          </>
        )}
        {config.exterior.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0' }}>Exterior</div>
            {config.exterior.map(item => (
              <CheckExterior key={item.id} nombre={item.nombre}
                value={getItem('exterior', item.nombre)}
                onChange={val => setItem('exterior', item.nombre, val)} />
            ))}
          </>
        )}
        {config.repuestos.length > 0 && (
          <>
            <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0' }}>Repuestos</div>
            {config.repuestos.map(item => (
              <CheckRepuesto key={item.id} nombre={item.nombre}
                value={getItem('repuestos', item.nombre)}
                onChange={val => setItem('repuestos', item.nombre, val)} />
            ))}
          </>
        )}
        {config.interior.length === 0 && config.exterior.length === 0 && config.repuestos.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#8b949e' }}>
            Configura el checklist en Configuración antes de auditar
          </div>
        )}
      </div>

      {error && <div style={{ background: 'rgba(248,81,73,0.1)', border: '0.5px solid rgba(248,81,73,0.3)', color: '#f85149', fontSize: 12, padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}

      <button onClick={handleSubmit} disabled={loading}
        style={{ width: '100%', background: loading ? '#21262d' : '#58a6ff', color: loading ? '#8b949e' : '#fff', fontWeight: 600, fontSize: 15, padding: '14px 0', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Guardando...' : 'Guardar auditoría'}
      </button>
    </div>
  );
}