// ─── Modelos y acabados de la flota ──────────────────────────────────────────

const MODELO_PRINCIPAL = 'FIAT 500 Icon 3+1 320km 85kW (118CV)';
const SUFIJOS_RESTYLING = ['MYF', 'MKR', 'MYV'];

export const detectarAcabado = (matricula, marca, modelo) => {
  if (!matricula || !modelo) return '';

  const mat = matricula.toString().trim().toUpperCase();

  // Solo aplica al modelo principal
  if (modelo.toString().trim().toUpperCase().includes('FIAT 500')) {
    const sufijo = mat.slice(-3);
    return SUFIJOS_RESTYLING.includes(sufijo) ? 'Restyling' : 'Estandar';
  }

  return '';
};

export const getCompatibilidadLabel = (marca, modelo, acabado) => {
  if (!modelo) return '';
  if (modelo.toString().includes('FIAT 500')) {
    return acabado ? `${modelo} · ${acabado}` : modelo;
  }
  return `${marca} ${modelo}`.trim();
};

export { MODELO_PRINCIPAL, SUFIJOS_RESTYLING };