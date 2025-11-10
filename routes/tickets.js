import express from "express";
import multer from "multer";
import Tesseract from "tesseract.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 🧠 Función auxiliar para extraer código de embolsador
function detectarEmbolsador(textoOCR) {
  const match = textoOCR.match(/E\d+/i);
  return match ? match[0].toUpperCase() : "NO_DETECTADO";
}

// 📸 Endpoint: subir ticket
router.post("/upload-ticket", upload.single("ticketImage"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // Procesar OCR
    const { data: { text } } = await Tesseract.recognize(imagePath, "spa");

    // Buscar código de embolsador
    const embolsador = detectarEmbolsador(text);

    // Extraer más datos (ejemplo: fecha, valor, etc.)
    // Puedes expandir esto con más regex según tus necesidades
    const fechaTicket = new Date().toISOString().split("T")[0];

    // Simular guardado (aquí puedes enviar a tu DB o Google Sheet)
    const resultado = {
      fecha: fechaTicket,
      embolsador,
      textoOCR: text.slice(0, 200) + "...", // Muestra un fragmento del texto detectado
    };

    console.log("Ticket procesado:", resultado);
    res.status(200).json({ success: true, data: resultado });

  } catch (error) {
    console.error("Error procesando ticket:", error);
    res.status(500).json({ success: false, message: "Error procesando ticket" });
  }
});

export default router;
