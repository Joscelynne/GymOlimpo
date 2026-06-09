import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import axios from "axios";

setGlobalOptions({ maxInstances: 10 });

export const crearPagoFlow = onRequest(async (req, res) => {
  try {

    const {
      monto,
      orden,
      descripcion
    } = req.body;

    const apiKey = process.env.FLOW_API_KEY;
    const secretKey = process.env.FLOW_SECRET_KEY;

    logger.info("Creando pago Flow");

    res.json({
      success: true,
      monto,
      orden,
      descripcion,
      apiKeyExiste: !!apiKey,
      secretExiste: !!secretKey
    });

  } catch (error: any) {

    logger.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });

  }
});