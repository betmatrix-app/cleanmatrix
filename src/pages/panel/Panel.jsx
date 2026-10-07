import { useState, useEffect, useMemo } from 'react';
import { db, TENANT_ID } from '../../lib/firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { proxiarFoto, subirFoto } from '../../lib/cloudinary';

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

function useConfig() {
  const [config, setConfig] = useState({ interior: [], exterior: [], repuestos: [] });
  useEffect(() => {
    const cols = ['interior', 'exterior', 'repuestos'];
    const unsubs = cols.map(col =>
      onSnapshot(query(collection(db, `tenants/${TENANT_ID}/config_limpieza_${col}`), orderBy('nombre')), snap => {
        setConfig(prev => ({ ...prev, [col]: snap.docs.map(d => ({ id: d.id, ...d.data() })) }));
      })
    );
    return () => unsubs.forEach(u => u());
  }, []);
  return config;
}

function formatFecha(ts) {
  if (!ts) return '—';
  return (ts.toDate?.() || new Date(ts)).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function contarFallos(auditoria) {
  return (auditoria.checklist || []).filter(i => i.estado === 'Mal' || i.estado === 'Falta algún repuesto').length;
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
            <img src={proxiarFoto(f.url)} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6 }} />
            <button onClick={() => removeFoto(i)}
              style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: 99, background: '#f85149', border: 'none', color: '#fff', fontSize: 10, cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(248,81,73,0.08)', borderRadius: 6, cursor: 'pointer', fontSize: 12, color: '#f85149' }}>
        📷 {fotos.length === 0 ? 'Foto requerida' : '+ Añadir foto'}
        <input type="file" accept="image/*" capture="environment" onChange={handleFoto} style={{ display: 'none' }} />
      </label>
    </div>
  );
}

function ModalDetalle({ auditoria, onClose, isManager, config }) {
  const [fotoAmp,         setFotoAmp]         = useState(null);
  const [mostrando,       setMostrando]       = useState('auditoria');
  const [contraChecklist, setContraChecklist] = useState({});
  const [loadingContra,   setLoadingContra]   = useState(false);
  const [errorContra,     setErrorContra]     = useState('');
  const [doneContra,      setDoneContra]      = useState(false);
  const { profile } = useAuth();

  if (!auditoria) return null;

  const interior  = auditoria.checklist?.filter(i => i.zona === 'interior')  || [];
  const exterior  = auditoria.checklist?.filter(i => i.zona === 'exterior')  || [];
  const repuestos = auditoria.checklist?.filter(i => i.zona === 'repuestos') || [];
  const fallos    = contarFallos(auditoria);

  const setContraItem = (zona, nombre, val) =>
    setContraChecklist(prev => ({ ...prev, [`${zona}__${nombre}`]: { zona, nombre, ...val } }));
  const getContraItem = (zona, nombre) => contraChecklist[`${zona}__${nombre}`] || {};

  const handleGuardarContra = async () => {
    const items = Object.values(contraChecklist);
    const sinFoto = items.filter(i => (i.estado === 'Mal' || i.estado === 'Falta algún repuesto') && (!i.fotos || i.fotos.length === 0));
    if (sinFoto.length > 0) { setErrorContra(`Faltan fotos en: ${sinFoto.map(i => i.nombre).join(', ')}`); return; }
    setLoadingContra(true); setErrorContra('');
    try {
      await addDoc(collection(db, `tenants/${TENANT_ID}/contraauditorias`), {
        auditoriaId: auditoria.id,
        matricula:   auditoria.matricula,
        checklist:   items,
        auditor:     profile?.nombre || '',
        creadoEn:    serverTimestamp(),
      });
      setDoneContra(true);
    } catch (err) { setErrorContra('Error: ' + err.message); }
    finally { setLoadingContra(false); }
  };

  const ItemRow = ({ item }) => {
    const esMalo = item.estado === 'Mal' || item.estado === 'Falta algún repuesto';
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
        {item.queFalta && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>Faltan: {item.queFalta}</div>}
        {item.reportado && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>Reportado: {item.reportado}</div>}
        {item.fotos?.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {item.fotos.map((f, i) => (
              <img key={i} src={proxiarFoto(f.url)} alt="" onClick={() => setFotoAmp(f.url)}
                style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 6, cursor: 'pointer' }} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ContraCheckItem = ({ nombre, zona, tipo }) => {
    const val = getContraItem(zona, nombre);
    const opA = tipo === 'repuesto' ? 'Están' : 'Bien';
    const opB = tipo === 'repuesto' ? 'Falta algún repuesto' : 'Mal';
    const esMalo = val?.estado === opB;
    return (
      <div style={{ borderBottom: '0.5px solid #21262d', paddingBottom: 10, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ flex: 1, fontSize: 13, color: '#e6edf3' }}>{nombre}</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[opA, opB].map(op => (
              <button key={op} onClick={() => setContraItem(zona, nombre, { estado: op, fotos: [], reportado: '', queFalta: '' })}
                style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid', whiteSpace: 'nowrap',
                  background: val?.estado === op ? (op === opA ? 'rgba(63,185,80,0.15)' : 'rgba(248,81,73,0.15)') : 'transparent',
                  color: val?.estado === op ? (op === opA ? '#3fb950' : '#f85149') : '#8b949e',
                  borderColor: val?.estado === op ? (op === opA ? '#3fb950' : '#f85149') : '#21262d' }}>
                {op}
              </button>
            ))}
          </div>
        </div>
        {esMalo && (
          <>
            <FotosUpload fotos={val?.fotos || []} onChange={fotos => setContraItem(zona, nombre, { ...val, fotos })} />
            {tipo === 'repuesto' && (
              <input type="text" value={val?.queFalta || ''} onChange={e => setContraItem(zona, nombre, { ...val, queFalta: e.target.value })}
                placeholder="¿Qué repuestos faltan?"
                style={{ marginTop: 8, width: '100%', background: '#0d1117', border: '0.5px solid #21262d', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#e6edf3', boxSizing: 'border-box' }} />
            )}
            {(zona === 'exterior' || tipo === 'repuesto') && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 6 }}>¿Se ha reportado a responsable?</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['Sí', 'No'].map(op => (
                    <button key={op} onClick={() => setContraItem(zona, nombre, { ...val, reportado: op })}
                      style={{ padding: '3px 14px', borderRadius: 99, fontSize: 11, cursor: 'pointer', border: '0.5px solid',
                        background: val?.reportado === op ? 'rgba(88,166,255,0.15)' : 'transparent',
                        color: val?.reportado === op ? '#58a6ff' : '#8b949e',
                        borderColor: val?.reportado === op ? '#58a6ff' : '#21262d' }}>
                      {op}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 16px' }}>
        <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 16, width: '100%', maxWidth: 640, marginBottom: 20 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 0' }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 600, color: '#e6edf3' }}>{auditoria.matricula}</div>
              <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                {auditoria.turno} · {auditoria.operario} · {auditoria.cargador}
              </div>
              <div style={{ fontSize: 12, color: '#484f58', marginTop: 2 }}>
                Auditado por: {auditoria.auditor} · {formatFecha(auditoria.creadoEn)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {fallos > 0 && <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: 'rgba(248,81,73,0.15)', color: '#f85149' }}>{fallos} fallos</span>}
              <button onClick={onClose} style={{ padding: '5px 10px', borderRadius: 8, border: '0.5px solid #21262d', background: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>

          {isManager && (
            <div style={{ display: 'flex', gap: 0, margin: '16px 24px 0', borderBottom: '0.5px solid #21262d' }}>
              {['auditoria', 'contrauditoria'].map(t => (
                <button key={t} onClick={() => setMostrando(t)}
                  style={{ padding: '8px 16px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none',
                    color: mostrando === t ? '#58a6ff' : '#8b949e',
                    borderBottom: `2px solid ${mostrando === t ? '#58a6ff' : 'transparent'}`,
                    marginBottom: -1 }}>
                  {t === 'auditoria' ? 'Auditoría' : 'Contrauditoría'}
                </button>
              ))}
            </div>
          )}

          <div style={{ padding: '16px 24px 24px' }}>
            {mostrando === 'auditoria' ? (
              <>
                {interior.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 6px' }}>Interior</div>
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
              </>
            ) : (
              doneContra ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 48 }}>✅</div>
                  <div style={{ fontSize: 16, color: '#e6edf3', marginTop: 12 }}>Contrauditoría guardada</div>
                </div>
              ) : (
                <>
                  {config.interior.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '8px 0 10px' }}>Interior</div>
                      {config.interior.map(item => <ContraCheckItem key={item.id} nombre={item.nombre} zona="interior" tipo="interior" />)}
                    </>
                  )}
                  {config.exterior.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 10px' }}>Exterior</div>
                      {config.exterior.map(item => <ContraCheckItem key={item.id} nombre={item.nombre} zona="exterior" tipo="exterior" />)}
                    </>
                  )}
                  {config.repuestos.length > 0 && (
                    <>
                      <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, margin: '12px 0 10px' }}>Repuestos</div>
                      {config.repuestos.map(item => <ContraCheckItem key={item.id} nombre={item.nombre} zona="repuestos" tipo="repuesto" />)}
                    </>
                  )}
                  {errorContra && <div style={{ background: 'rgba(248,81,73,0.1)', border: '0.5px solid rgba(248,81,73,0.3)', color: '#f85149', fontSize: 12, padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{errorContra}</div>}
                  <button onClick={handleGuardarContra} disabled={loadingContra}
                    style={{ width: '100%', marginTop: 16, background: loadingContra ? '#21262d' : '#58a6ff', color: loadingContra ? '#8b949e' : '#fff', fontWeight: 600, fontSize: 14, padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer' }}>
                    {loadingContra ? 'Guardando...' : 'Guardar contrauditoría'}
                  </button>
                </>
              )
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

export default function Panel() {
  const { auditorias, loading } = useAuditorias();
  const config                  = useConfig();
  const { profile }             = useAuth();
  const [tab,          setTab]          = useState('dashboard');
  const [seleccionada, setSeleccionada] = useState(null);
  const [busMatricula, setBusMatricula] = useState('');
  const [filtroTurno,  setFiltroTurno]  = useState('');
  const [filtroOp,     setFiltroOp]     = useState('');
  const [filtroAud,    setFiltroAud]    = useState('');
  const [filtroFecha,  setFiltroFecha]  = useState('');

  const isManager = profile?.rol === 'Manager';

  const hace30dias = useMemo(() => new Date(Date.now() - 30 * 24 * 3600 * 1000), []);

  const misFiltradas = useMemo(() => {
    let lista = isManager ? auditorias : auditorias.filter(a => a.auditorId === profile?.uid);
    if (busMatricula) lista = lista.filter(a => a.matricula.includes(busMatricula.toUpperCase()));
    if (filtroTurno)  lista = lista.filter(a => a.turno === filtroTurno);
    if (filtroOp)     lista = lista.filter(a => a.operario === filtroOp);
    if (filtroAud)    lista = lista.filter(a => a.auditor === filtroAud);
    if (filtroFecha)  lista = lista.filter(a => {
      const f = (a.creadoEn?.toDate?.() || new Date(a.creadoEn))?.toISOString().slice(0, 10);
      return f === filtroFecha;
    });
    return lista;
  }, [auditorias, isManager, profile, busMatricula, filtroTurno, filtroOp, filtroAud, filtroFecha]);

  const operarios = [...new Set(auditorias.map(a => a.operario).filter(Boolean))].sort();
  const auditores = [...new Set(auditorias.map(a => a.auditor).filter(Boolean))].sort();

  const auditoriasMes = useMemo(() => auditorias.filter(a => {
    const f = a.creadoEn?.toDate?.() || new Date(a.creadoEn);
    return f > hace30dias;
  }), [auditorias, hace30dias]);

  const porTurno = useMemo(() => ['Mañana', 'Tarde', 'Noche'].map(t => ({
    turno: t,
    total: auditoriasMes.filter(a => a.turno === t).length,
  })), [auditoriasMes]);

  const alertasOperarios = useMemo(() => {
    const conteo = {};
    auditoriasMes.forEach(a => {
      if (contarFallos(a) >= 2) conteo[a.operario] = (conteo[a.operario] || 0) + 1;
    });
    return Object.entries(conteo).filter(([, c]) => c >= 3).map(([op, c]) => ({ operario: op, count: c })).sort((a, b) => b.count - a.count);
  }, [auditoriasMes]);

  const rankingPartes = useMemo(() => {
    const conteo = {};
    auditoriasMes.forEach(a => {
      (a.checklist || []).forEach(item => {
        if (item.estado === 'Mal' || item.estado === 'Falta algún repuesto')
          conteo[item.nombre] = (conteo[item.nombre] || 0) + 1;
      });
    });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([nombre, count]) => ({ nombre, count }));
  }, [auditoriasMes]);

  const hayFiltros = busMatricula || filtroTurno || filtroOp || filtroAud || filtroFecha;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ fontSize: 20, fontWeight: 500, color: '#e6edf3', marginBottom: 16 }}>Panel</div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid #21262d', marginBottom: 20 }}>
        {['dashboard', 'auditorias'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 20px', fontSize: 13, cursor: 'pointer', border: 'none', background: 'none',
              color: tab === t ? '#58a6ff' : '#8b949e',
              borderBottom: `2px solid ${tab === t ? '#58a6ff' : 'transparent'}`,
              marginBottom: -1 }}>
            {t === 'dashboard' ? 'Dashboard' : 'Auditorías'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {porTurno.map(({ turno, total }) => (
              <div key={turno} style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 11, color: '#8b949e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Turno {turno}</div>
                <div style={{ fontSize: 26, fontWeight: 500, color: '#e6edf3' }}>{total}</div>
                <div style={{ fontSize: 11, color: '#484f58', marginTop: 2 }}>auditorías último mes</div>
              </div>
            ))}
          </div>

          {isManager && alertasOperarios.length > 0 && (
            <div style={{ background: '#161b22', border: '0.5px solid rgba(248,81,73,0.3)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#f85149', marginBottom: 12 }}>⚠️ Alertas — operarios con fallos</div>
              {alertasOperarios.map(({ operario, count }) => (
                <div key={operario} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid #21262d' }}>
                  <span style={{ fontSize: 13, color: '#e6edf3' }}>{operario}</span>
                  <span style={{ fontSize: 12, padding: '2px 10px', borderRadius: 99, background: 'rgba(248,81,73,0.15)', color: '#f85149' }}>
                    {count} auditorías con 2+ fallos
                  </span>
                </div>
              ))}
            </div>
          )}

          {rankingPartes.length > 0 && (
            <div style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#e6edf3', marginBottom: 12 }}>Partes con más fallos (último mes)</div>
              {rankingPartes.map(({ nombre, count }, i) => (
                <div key={nombre} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '0.5px solid #21262d' }}>
                  <span style={{ fontSize: 12, color: '#484f58', minWidth: 20 }}>#{i + 1}</span>
                  <span style={{ fontSize: 13, color: '#e6edf3', flex: 1 }}>{nombre}</span>
                  <div style={{ flex: 2, height: 4, background: '#21262d', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#f85149', borderRadius: 99, width: `${Math.min((count / rankingPartes[0].count) * 100, 100)}%` }} />
                  </div>
                  <span style={{ fontSize: 12, color: '#f85149', minWidth: 24, textAlign: 'right' }}>{count}</span>
                </div>
              ))}
            </div>
          )}

          {rankingPartes.length === 0 && alertasOperarios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 13, color: '#8b949e' }}>Sin datos suficientes aún</div>
          )}
        </div>
      )}

      {tab === 'auditorias' && (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            <input type="text" value={busMatricula} onChange={e => setBusMatricula(e.target.value.toUpperCase())}
              placeholder="Matrícula..."
              style={{ width: 120, background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }} />
            <select value={filtroTurno} onChange={e => setFiltroTurno(e.target.value)}
              style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
              <option value="">Turno</option>
              {['Mañana', 'Tarde', 'Noche'].map(t => <option key={t}>{t}</option>)}
            </select>
            <select value={filtroOp} onChange={e => setFiltroOp(e.target.value)}
              style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
              <option value="">Operario</option>
              {operarios.map(o => <option key={o}>{o}</option>)}
            </select>
            {isManager && (
              <select value={filtroAud} onChange={e => setFiltroAud(e.target.value)}
                style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }}>
                <option value="">Auditor</option>
                {auditores.map(a => <option key={a}>{a}</option>)}
              </select>
            )}
            <input type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)}
              style={{ background: '#161b22', border: '0.5px solid #21262d', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: '#e6edf3' }} />
            {hayFiltros && (
              <button onClick={() => { setBusMatricula(''); setFiltroTurno(''); setFiltroOp(''); setFiltroAud(''); setFiltroFecha(''); }}
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
            ) : misFiltradas.map(a => {
              const fallos = contarFallos(a);
              return (
                <div key={a.id} onClick={() => setSeleccionada(a)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '0.5px solid #21262d', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#21262d'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{a.matricula}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: '#21262d', color: '#8b949e' }}>{a.turno}</span>
                      {fallos > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 99, background: 'rgba(248,81,73,0.1)', color: '#f85149' }}>{fallos} fallos</span>}
                    </div>
                    <div style={{ fontSize: 12, color: '#8b949e', marginTop: 2 }}>
                      {a.operario} · {a.auditor} · {formatFecha(a.creadoEn)}
                    </div>
                  </div>
                  <button style={{ padding: '5px 12px', borderRadius: 8, border: '0.5px solid #21262d', background: 'none', color: '#8b949e', fontSize: 12, cursor: 'pointer' }}>Ver</button>
                </div>
              );
            })}
          </div>
        </>
      )}

      <ModalDetalle auditoria={seleccionada} onClose={() => setSeleccionada(null)} isManager={isManager} config={config} />
    </div>
  );
}