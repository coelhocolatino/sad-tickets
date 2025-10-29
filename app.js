// CONFIGURA AQUÍ TU ENDPOINT DE APPS SCRIPT
//const BACKEND_URL = "https://script.google.com/macros/s/AKfycby0MuXvx1BHS_GYAbsapfi6BNbuJNCkB5JtiJ8sPt9xSbJdl040EsWgAS9BOpW8YRmyXA/exec";
// URL para leer las listas
//const BACKEND_LISTAS = "https://script.google.com/macros/s/AKfycbwE_JuJWDpZcI7WqigBsJ8Bw2-JDHYy0WMm9IUY0AevIO6AorvkLYYRvmiGqlRilIwu/exec"; // <- URL SAD_PROXY_API
// URL para subir los tickets (la de siempre)
//const BACKEND_TICKETS = "https://script.google.com/macros/s/AKfycby0MuXvx1BHS_GYAbsapfi6BNbuJNCkB5JtiJ8sPt9xSbJdl040EsWgAS9BOpW8YRmyXA/exec";
// ENDPOINT DEL PROXY CLOUDFLARE
const PROXY = "https://sad-proxy.colatino-ventas-enlinea.workers.dev/";

// URL REAL DE GOOGLE APPS SCRIPT
const BACKEND_URL = "https://script.google.com/macros/s/AKfycby0MuXvx1BHS_GYAbsapfi6BNbuJNCkB5JtiJ8sPt9xSbJdl040EsWgAS9BOpW8YRmyXA/exec";

// Para leer las listas desde Sheets
async function cargarListas() {
  startSpinner();
  try {
    const proxyURL = `${PROXY}?url=${encodeURIComponent(BACKEND_URL)}`;
    const res = await fetch(proxyURL);
    const data = await res.json();

    fillSelect("tienda", data.tiendas);
    fillSelect("repartidor", data.repartidores);
    fillSelect("franja", data.franjas);
    stopSpinner();
  } catch (err) {
    console.error("Error al cargar listas:", err);
    stopSpinner();
    fillSelect("tienda", ["ERROR"]);
    fillSelect("repartidor", ["ERROR"]);
    fillSelect("franja", ["ERROR"]);
  }
}

// ====== ALERTA SIN CONEXIÓN ======
function showOfflineAlert() {
  const el = document.getElementById("offline-alert");
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 4000);
}

// 1. Pre-cargar fecha de hoy
(function initFechaHoy() {
  const hoy = new Date();
  const yyyy_mm_dd = hoy.toISOString().split("T")[0];
  document.getElementById("fecha").value = yyyy_mm_dd;
})();

// 2. Cargar listas dinámicas desde Apps Script
async function cargarListas() {
  try {
    const res = await fetch(BACKEND_LISTAS);
    const data = await res.json();
    fillSelect("tienda", data.tiendas);
    fillSelect("repartidor", data.repartidores);
    fillSelect("franja", data.franjas);
    stopSpinner();
  } catch (err) {
    console.error("Error al cargar listas:", err);
    stopSpinner();
    fillSelect("tienda", ["ERROR"]);
    fillSelect("repartidor", ["ERROR"]);
    fillSelect("franja", ["ERROR"]);
  }
}

function fillSelect(id, arr) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  arr.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    el.appendChild(opt);
  });
}

cargarListas();

// 3. Envío del ticket
const formEl = document.getElementById("ticketForm");
const msgEl = document.getElementById("msg");

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
    // ✅ Comprobamos conexión
  if (!navigator.onLine) {
    showOfflineAlert();
    return;
  msgEl.textContent = "Subiendo...";
  msgEl.style.color = "#fff";

  const file = document.getElementById("foto").files[0];
  if (!file) {
    msgEl.textContent = "❌ Falta la foto";
    msgEl.style.color = "#ffdddd";
    return;
  }

  const base64 = await fileToBase64(file);
  const formData = new FormData(formEl);
  const datos = Object.fromEntries(formData.entries());

  const payload = {
    fecha: datos.fecha,
    tienda: datos.tienda,
    repartidor: datos.repartidor,
    franja: datos.franja,
    pedidos: datos.pedidos,
    dobles: datos.dobles,
    xr: datos.xr,
    obs: datos.obs || "",
    imagenBase64: base64
  };

  try {
    // Para enviar, no necesitamos leer la respuesta (Apps Script no da CORS cómodo)
    await fetch(BACKEND_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    msgEl.textContent = "✅ Ticket enviado correctamente";
    msgEl.style.color = "#9dffb0";

    formEl.reset();
    // reponer fecha actual tras reset
    const hoy = new Date().toISOString().split("T")[0];
    document.getElementById("fecha").value = hoy;

  } catch (err) {
    console.error(err);
    msgEl.textContent = "❌ Error al subir: " + err.message;
    msgEl.style.color = "#ffdddd";
  }
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
