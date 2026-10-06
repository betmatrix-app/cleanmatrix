const CLAUDE_API_KEY = process.env.REACT_APP_CLAUDE_API_KEY;

const PROMPT = `Eres un sistema experto en analisis de danos en vehiculos de flota de carsharing.

Analiza esta foto y devuelve UNICAMENTE un JSON con este formato exacto, sin texto adicional ni markdown:

{
  "zona": "paragolpes_delantero | paragolpes_trasero | puerta_delantera_izquierda | puerta_delantera_derecha | puerta_trasera_izquierda | puerta_trasera_derecha | lateral_izquierdo | lateral_derecho | techo | luna_delantera | luna_trasera | interior | rueda_delantera_izquierda | rueda_delantera_derecha | rueda_trasera_izquierda | rueda_trasera_derecha | otro",
  "tipo": "golpe_abolladura | rayada_superficial | rayada_profunda | rotura_pieza | cristal_roto | interior_danado | neumatico | otro",
  "posicion_en_zona": "descripcion breve de donde exactamente en la zona",
  "dimensiones_estimadas": "estimacion del tamano del dano",
  "perdida_pintura": true,
  "deformacion_chapa": true,
  "severidad": "leve | moderado | grave",
  "accion_recomendada": "documentar | reparacion_estetica | reparacion_chapa | paralizar",
  "descripcion_para_embedding": "descripcion detallada y estandarizada del dano en 2-3 frases usando siempre los mismos terminos tecnicos",
  "confianza": "alta | media | baja",
  "motivo_baja_confianza": "solo si confianza es baja"
}

Criterios de severidad:
- Leve: rayadas superficiales sin perdida de pintura, golpes menores sin deformacion
- Moderado: rayadas con perdida de pintura, golpes con deformacion leve
- Grave: deformacion importante, rotura de piezas, cristales

Criterios de accion:
- Documentar: dano estetico menor, vehiculo operativo
- Reparacion_estetica: requiere pulido o pintura, vehiculo operativo
- Reparacion_chapa: requiere taller de chapa, vehiculo operativo
- Paralizar: vehiculo no debe circular

Si la imagen no muestra claramente un dano en un vehiculo devuelve confianza baja.`;

export async function analizarFoto(fotoUrl) {
  if (!CLAUDE_API_KEY) throw new Error('API key de Claude no configurada');

  const response = await fetch('/api/proxy-claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'url', url: fotoUrl } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })
  });

  if (!response.ok) throw new Error('Error al llamar a Claude API');

  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}

export function generarEmbedding(texto) {
  const palabras = [
    'paragolpes_delantero', 'paragolpes_trasero',
    'puerta_delantera_izquierda', 'puerta_delantera_derecha',
    'puerta_trasera_izquierda', 'puerta_trasera_derecha',
    'lateral_izquierdo', 'lateral_derecho',
    'techo', 'luna_delantera', 'luna_trasera', 'interior',
    'golpe_abolladura', 'rayada_superficial', 'rayada_profunda',
    'rotura_pieza', 'cristal_roto', 'perdida_pintura',
    'deformacion', 'abolladura', 'esquina', 'centro',
    'superior', 'inferior', 'derecha', 'izquierda',
    'grave', 'moderado', 'leve', 'estructural',
  ];
  const textoLower = texto.toLowerCase();
  return palabras.map(p => textoLower.includes(p.replace(/_/g, ' ')) || textoLower.includes(p) ? 1 : 0);
}

export function calcularSimilitud(embedding1, embedding2) {
  if (!embedding1 || !embedding2) return 0;
  const dotProduct = embedding1.reduce((sum, a, i) => sum + a * embedding2[i], 0);
  const mag1 = Math.sqrt(embedding1.reduce((sum, a) => sum + a * a, 0));
  const mag2 = Math.sqrt(embedding2.reduce((sum, a) => sum + a * a, 0));
  return dotProduct / (mag1 * mag2);
}