import { useState, useEffect, useMemo } from 'react';
import { db, TENANT_ID } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { proxiarFoto } from '../../lib/cloudinary';

function useAuditorias() {
  const [auditorias, setAuditorias] = useState([]);
  const [loading,    setLoading]    = useState(true);
  useEffect(() => {
    const q = query(collection(db, `tenants/${TENANT_ID}/auditorias_limpieza`), orderBy('creadoEn', 'desc'));
    return onSnapshot(q, snap => {
      setAuditorias(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
  }, []);
  return { auditorias, loading };
}

function formatFecha(ts) {
  if (!ts) return '—';
  return (ts.toDate?.() || new Date(ts)).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function ModalDetalle({ auditoria, onClose, isManager }) {
  const [fotoAmp, setFotoAmp] = useState(null);
  if (!auditoria) return null;

  const interior  = auditoria.checklist?.filter(i => i.zona === 'interior')  || [];
  const exterior  = auditoria.checklist?.filter(i => i.zona === 'exterior')  || [];
  const repuestos = auditoria.checklist?.filter(i => i.zona === 'repuestos') || [];

  const handleEliminar = async () => {
    if (!window.confirm('Eliminar esta auditoría?')) return;
    await deleteDoc(doc(db, `tenants/${TENANT_ID}/auditorias_limpieza`, auditoria.id));
    onClose();
  };

  const ItemRow = ({ item }) => {
    const esMalo = item.estado === 'Mal' || item.estado === 'Faltan';
    return (
      <div style={{ padding: '8px 0', borderBottom: '0.5px solid #21262d' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#e6edf3' }}>{item.nombre}</span>
          <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99,
            background: esMalo ? 'rgba(248,81,73,0.15)' : 'rgba(63,185,80,0.1)',
            color: esMalo ? '#f85149' : '#3fb950' }}>
            {item.estado}
          </span>
        </div>
        {item.nota && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>{item.nota}</div>}
        {item.foto && (
          <img src={proxiarFoto(item.foto.url)} alt="" onClick={() => setFotoAmp(item.foto.url)}
            style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, marginTop: 6, cursor: 'pointer' }} />
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 16, width: '100%', maxWidth: 600, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#e6edf3' }}>{auditoria.matricula}</div>
              <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                {auditoria.operario} · {auditoria.cargador} · {formatFecha(auditoria.creadoEn)}
              </div>
              <div style={{ fontSize: 12, color: '#484f58', marginTop: 2 }}>Auditado por: {auditoria.auditor}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99,
                background: auditoria.estadoGlobal === 'Aprobada' ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)',
                color: auditoria.estadoGlobal === 'Aprobada' ? '#3fb950' : '#f85149' }}>
                {auditoria.estadoGlobal}
              </span>
              {isManager && (
                <button onClick={handleEliminar} style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid rgba(248,81,73,0.3)', background: 'rgba(248,81,73,0.1)', color: '#f85149', fontSize: 12, cursor: 'pointer' }}>Eliminar</button>
              )}
              <button onClick={onClose} style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid #21262d', background: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>

          <div style={{ padding: '16px 24px 24px' }}>
            {interior.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 6px' }}>Interior</div>
                {interior.map((item, i) => <ItemRow key={i} item={item} />)}
              </>
            )}
            {exterior.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 6px' }}>Exterior</div>
                {exterior.map((item, i) => <ItemRow key={i} item={item} />)}
              </>
            )}
            {repuestos.length > 0 && (
              <>
                <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 6px' }}>Repuestos</div>
                {repuestos.map((item, i) => <ItemRow key={i} item={item} />)}
              </>
            )}
            {auditoria.notaGlobal && (
              <div style={{ marginTop: 16, background: '#0d1117', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#8b949e' }}>
                {auditoria.notaGlobal}
              </div>
            )}
          </div>
        </div>
      </div>
      {fotoAmp && (
        <div onClick={() => setFotoAmp(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 20, right: 20, color: '#fff', fontSize: 28, cursor: 'pointer' }}>✕</div>
          <img src={proxiarFoto(fotoAmp)} alt="" style={{ maxWidth: '90%', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}
    </>
  );
}

export default function Historial() {
  const { auditorias, loading } = useAuditorias();
  const { profile }             = useAuth();
  const [seleccionada, setSeleccionada] = useState(null);
  const [busMatricula, setBusMatricula] = useState('');
  const [filtroOperario,  setFiltroOperario]  = useState('');
  const [filtroCargador,  setFiltroCargador]  = useState('');
  const [filtroEstado,    setFiltroEstado]     = useState('');
  const [filtroAuditor,   setFiltroAuditor]    = useState('');
  const [filtroFecha,     setFiltroFecha]      = useState('');

  const isManager = profile?.rol === 'Manager';

  const misFiltradas = useMemo(() => {
    let lista = isManager ? auditorias : auditorias.filter(a => a.auditorId === profile?.uid);
    if (busMatricula)    lista = lista.filter(a => a.matricula.includes(busMatricula.toUpperCase()));
    if (filtroOperario)  lista = lista.filter(a => a.operario === filtroOperario);
    if (filtroCargador)  lista = lista.filter(a => a.cargador === filtroCargador);
    if (filtroEstado)    lista = lista.filter(a => a.estadoGlobal === filtroEstado);
    if (filtroAuditor)   lista = lista.filter(a => a.auditor === filtroAuditor);
    if (filtroFecha) {
      lista = lista.filter(a => {
        const fecha = (a.creadoEn?.toDate?.() || new Date(a.creadoEn))?.toISOString().slice(0, 10);
        return fecha === filtroFecha;
      });
    }
    return lista;
  }, [auditorias, isManager, profile, busMatricula, filtroOperario, filtroCargador, filtroEstado, filtroAuditor, filtroFecha]);

  const operarios  = [...new Set(auditorias.map(a => a.operario).filter(Boolean))].sort();
  const cargadores = [...new Set(auditorias.map(a => a.cargador).filter(Boolean))].sort();
  const auditores  = [...new Set(auditorias.map(a => a.auditor).filter(Boolean))].sort();

  const aprobadas    = misFiltradas.filter(a => a.estadoGlobal === 'Aprobada').length;
  const noAprobadas  = misFiltradas.filter(a => a.estadoGlobal === 'No aprobada').length;

  const hayFiltros = busMatricula || filtroOperario || filtroCargador || filtroEstado || filtroAuditor || filtroFecha;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#e6edf3', marginBottom: 16 }}>
        {isManager ? 'Historial completo' : 'Mis auditorías'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total', value: misFiltradas.length, color: '#e6edf3' },
          { label: 'Aprobadas', value: aprobadas, color: '#3fb950' },
          { label: 'No aprobadas', value: noAprobadas, color: '#f85149' },
        ].map(s => (
          <div key={s.label} style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 10, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <input type="text" value={busMatricula} onChange={e => setBusMatricula(e.target.value.toUpperCase())}
          placeholder="Matrícula..." style={{ width: 120, background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }} />
        <select value={filtroOperario} onChange={e => setFiltroOperario(e.target.value)}
          style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
          <option value="">Operario</option>
          {operarios.map(o => <option key={o}>{o}</option>)}
        </select>
        <select value={filtroCargador} onChange={e => setFiltroCargador(e.target.value)}
          style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
          <option value="">Cargador</option>
          {cargadores.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
          style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
          <option value="">Estado</option>
          <option>Aprobada</option>
          <option>No aprobada</option>
        </select>
        {isManager && (
          <select value={filtroAuditor} onChange={e => setFiltroAuditor(e.target.value)}
            style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
            <option value="">Auditor</option>
            {auditores.map(a => <option key={a}>{a}</option>)}
          </select>
        )}
        <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
          style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }} />
        {hayFiltros && (
          <button onClick={() => { setBusMatricula(''); setFiltroOperario(''); setFiltroCargador(''); setFiltroEstado(''); setFiltroAuditor(''); setFiltroFecha(''); }}
            style={{ padding: '7px 12px', borderRadius: 8, border: '0.5px solid #21262d', background: '#161b22', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>
            Limpiar
          </button>
        )}
      </div>

      <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: '#8b949e' }}>Cargando...</div>
        ) : misFiltradas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, fontSize: 13, color: '#8b949e' }}>No hay auditorías</div>
        ) : (
          misFiltradas.map(a => (
            <div key={a.id} onClick={() => setSeleccionada(a)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid #21262d', cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{a.matricula}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99,
                    background: a.estadoGlobal === 'Aprobada' ? 'rgba(63,185,80,0.1)' : 'rgba(248,81,73,0.1)',
                    color: a.estadoGlobal === 'Aprobada' ? '#3fb950' : '#f85149' }}>
                    {a.estadoGlobal}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                  {a.operario} · {a.cargador} · {a.auditor} · {formatFecha(a.creadoEn)}
                </div>
              </div>
              <button style={{ padding: '5px 12px', borderRadius: 8, border: '0.5px solid #21262d', background: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>Ver</button>
            </div>
          ))
        )}
      </div>

      <ModalDetalle auditoria={seleccionada} onClose={() => setSeleccionada(null)} isManager={isManager} />
    </div>
  );
}