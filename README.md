# Luna Core v0.2 — Demo interactiva: Agente de Ventas (Luna Appointments)

Demo **real** del primer empleado digital de Luna Core: el usuario **escribe** y la **IA responde en vivo** (Groq), adaptándose al rubro. Tras un límite de mensajes aparece el **muro freemium** (suscríbete / agenda demo). Es el germen del producto.

> *"La inteligencia que trabaja mientras tú descansas."* · Luna IT Solutions

## Arquitectura (por qué no es solo un HTML)
Para que la IA responda de verdad necesita una API key, y **la key NUNCA debe ir en el navegador**. Por eso:
```
Navegador (index.html)  ──POST /api/chat──►  Netlify Function (chat.js)  ──►  Groq API
                                              [aquí vive GROQ_API_KEY]
```
- `index.html` — UI interactiva (chat, input, contador, muro freemium). Sin dependencias.
- `netlify/functions/chat.js` — proxy seguro a Groq + "cerebro" del agente por rubro + tope de mensajes server-side.
- `netlify.toml` — publica la carpeta y enruta `/api/chat` → la función.

## Cómo ponerla en vivo (3 pasos)
1. Sube esta carpeta a un repo y **conéctala a Netlify** (o `netlify deploy`).
2. En **Netlify → Site settings → Environment variables** agrega:
   - `GROQ_API_KEY` = tu key de Groq (https://console.groq.com/keys). *(Tú la pones; no se comparte.)*
   - *(opcional)* `GROQ_MODEL` = `llama-3.3-70b-versatile` (default) u otro modelo vigente de Groq.
3. Deploy. Listo: la IA responde en vivo.

## Cómo probarla localmente
```
npm i -g netlify-cli
netlify dev        # levanta el frontend + la función con tu GROQ_API_KEY
```
(Si la abres con un servidor estático sin la función, el chat mostrará un aviso de que falta configurar la IA — es lo esperado.)

## Límite freemium
- Por defecto **6 mensajes** del usuario (constante `LIMIT` en `index.html` y `chat.js`).
- Al llegar, se bloquea el input y aparece el muro con CTAs (WhatsApp / suscripción).
- El tope también se valida en el servidor (la función responde 429 si se excede) para controlar costo.
- ⚠️ El contador del navegador es para la *demo*; en el producto real el límite debe ir por cuenta/IP en el backend, y el "pagar" se conecta a una pasarela (Culqi/Stripe/MercadoPago) — eso es v0.3.

## Personalizar por rubro
- **UI y saludo:** objeto `RUBROS` en `index.html`.
- **Personalidad/comportamiento de la IA:** objeto `RUBROS` + `buildSystem()` en `netlify/functions/chat.js` (ahí defines tono, qué pregunta, precios, seña).
- Para personalizar a un cliente concreto antes de una reunión: ajusta su bloque (nombre, precios, dirección).

## Roadmap
- **v0.2 (ahora):** demo interactiva real con Groq + muro freemium. ✅
- **v0.3 — producto:** WhatsApp Cloud API (atiende el WhatsApp real del cliente), base de conocimiento subible, agenda real (Google Calendar), seña Yape real (link de cobro), login + límite por cuenta, pasarela de pago.
- **v0.4:** panel con métricas reales (respuesta, citas, no-show, seña).
- **Extracción de "Luna Core":** con el 2º agente (Soporte/Cobranza) se refactoriza el núcleo común. El núcleo se destila de aquí, no se construye antes.

## Stack objetivo del producto
Angular (panel) · .NET o Node (backend) · WhatsApp Cloud API/BSP · Groq (IA) · SQL Server. Esta demo es estática + Netlify Function para poder mostrarse y desplegarse hoy.
