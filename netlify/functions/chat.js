/* Luna Core — Agente de Ventas · backend (proxy a Groq)
   La API key vive SOLO aquí, como variable de entorno en Netlify (GROQ_API_KEY).
   Nunca se expone al navegador. */

const RUBROS = {
  estetica:    { agente:'Bella',  negocio:'clínica de estética', cliente:'paciente', evento:'cita',
                 servicio:'tratamientos faciales y corporales (limpieza facial, botox, láser)', ticket:'S/ 150 a S/ 800', sena:50 },
  dental:      { agente:'Sonríe', negocio:'clínica dental', cliente:'paciente', evento:'cita',
                 servicio:'limpieza, ortodoncia, implantes', ticket:'S/ 80 a S/ 1500', sena:40 },
  inmobiliaria:{ agente:'Mateo',  negocio:'inmobiliaria', cliente:'interesado', evento:'visita',
                 servicio:'venta y alquiler de departamentos en Lima', ticket:'US$ 90k a US$ 300k', sena:0 },
  gimnasio:    { agente:'Fit',    negocio:'gimnasio', cliente:'interesado', evento:'clase de prueba',
                 servicio:'membresías, funcional, pesas y clases grupales', ticket:'S/ 120 a S/ 200 al mes', sena:0 },
  restaurante: { agente:'Sazón',  negocio:'restaurante', cliente:'cliente', evento:'reserva',
                 servicio:'reservas de mesa y eventos', ticket:'S/ 80 a S/ 300 por persona', sena:0 },
  veterinaria: { agente:'Huellitas', negocio:'veterinaria', cliente:'cliente', evento:'cita',
                 servicio:'consultas, vacunas, baño y peluquería', ticket:'S/ 60 a S/ 250', sena:30 },
};

const LIMIT = 6; // máximo de mensajes del usuario en la demo

function buildSystem(c){
  const sena = c.sena > 0
    ? `Para asegurar la asistencia y reducir las inasistencias, pide una seña de S/${c.sena} por Yape para confirmar la ${c.evento} (menciona que se descuenta del total). Si el ${c.cliente} duda, explica con calidez que así le garantizas el cupo.`
    : `Para confirmar la ${c.evento}, pide solo el nombre completo del ${c.cliente}.`;
  return [
    `Eres ${c.agente}, asistente de ventas por WhatsApp de un(a) ${c.negocio} en Lima, Perú.`,
    `Ofreces: ${c.servicio}. Rango de precios referencial: ${c.ticket}.`,
    `Tu objetivo es: responder al instante y con calidez, calificar al ${c.cliente} con 1 o 2 preguntas, ofrecer 2 horarios concretos y agendar la ${c.evento}. ${sena}`,
    `REGLAS DE ESTILO: escribe como en WhatsApp, mensajes MUY cortos (1 a 3 frases), tono cercano y peruano, máximo un emoji por mensaje, UNA sola pregunta por turno. No inventes datos que no tengas (di que lo confirmas). No hables de temas ajenos al negocio; si ocurre, redirige amablemente a agendar.`,
    `Es de noche y atiendes 24/7: si es oportuno, recuérdalo con naturalidad. Cuando el ${c.cliente} acepte (y, si aplica, confirme la seña), confirma la ${c.evento} con día, hora y un recordatorio.`,
  ].join('\n');
}

function json(status, obj){
  return { statusCode: status, headers: { 'Content-Type':'application/json', 'Access-Control-Allow-Origin':'*' }, body: JSON.stringify(obj) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Método no permitido' });

  const KEY = process.env.GROQ_API_KEY;
  if (!KEY) return json(500, { error: 'config', message: 'Falta GROQ_API_KEY en las variables de entorno de Netlify.' });

  let data;
  try { data = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'JSON inválido' }); }

  const cfg = RUBROS[data.rubro] || RUBROS.estetica;
  const messages = Array.isArray(data.messages) ? data.messages : [];
  const userTurns = messages.filter(m => m.role === 'user').length;
  if (userTurns > LIMIT) return json(429, { error: 'limit', limit: true });

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  try {
    const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${KEY}` },
      body: JSON.stringify({
        model, temperature: 0.6, max_tokens: 220,
        messages: [{ role:'system', content: buildSystem(cfg) }, ...messages.slice(-12)]
      })
    });
    if (!r.ok) { const detail = await r.text(); return json(502, { error: 'groq', detail }); }
    const j = await r.json();
    const reply = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim() || '…';
    return json(200, { reply, model, remaining: Math.max(0, LIMIT - userTurns) });
  } catch (e) {
    return json(502, { error: 'fetch', detail: String(e) });
  }
};
