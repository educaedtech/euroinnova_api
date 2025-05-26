import {get, response} from '@loopback/rest';
import fetch from 'node-fetch';

export class GeneralController {
  @get('/general/api/ip-info')
  @response(200, {
    description: 'Get IP Address',
    content: {
      'application/json': {
        schema: {},
      },
    },
  })
  async getIPData() {
    try {
      const url = 'https://ipinfo.io/json';

      try {
        const response2 = await fetch(url, {
          method: 'GET',
        });

        let dres = null;
        const contentType = response2.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          dres = await response2.json(); // Parsear como JSON
        } else {
          dres = await response2.text(); // Parsear como texto
        }

        return {
          success: true,
          message: 'INFO server',
          result: dres,
        };
      } catch (error) {
        console.error('ERROR geting INFO:', error);

        return {
          success: false,
          message: 'ERROR sending Warranty',
          result: error,
        };
      }
    } catch (error) {
      console.error('Error procesando el envío de correo:', error.message);
    }

    return {
      success: true,
      message: 'testing mail send',
    };
  }
}

/*app.post("/api/ip-info", async (req, res) => {
  try {
    const url = "https://ipinfo.io/json";

    try {
      // TODO: enviar la garantia a webshop.bcwm.es
      const response = await fetch(url, {
        method: "GET",
      });

      console.log(response);
      let dres = null;
      const contentType = response.headers.get("content-type");
      if (contentType.includes("application/json")) {
        dres = await response.json(); // Parsear como JSON
      } else {
        dres = await response.text(); // Parsear como texto
      }

      return res.status(200).json({
        success: true,
        message: "INFO server",
        result: dres,
      });
    } catch (error) {
      console.error("ERROR geting INFO:", error);

      return res.status(500).json({
        success: false,
        message: "ERROR sending Warranty",
        result: error,
      });
    }
  } catch (error) {
    console.error("Error procesando el envío de correo:", error.message);
  }

  return res.status(200).json({
    success: true,
    message: "testing mail send",
  });
});*/
