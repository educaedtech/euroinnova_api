
import {Middleware, Response} from '@loopback/rest';

export const basicAuthMiddleware: Middleware = async (ctx, next) => {
  const {request, response} = ctx;

  // Excluir rutas públicas (ej: /health, /docs)
  if (request.path.match(/^\/(health|docs)/)) {
    return next();
  }

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Basic ')) {
    return sendAuthChallenge(response);
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.ADMIN_USER ?? 'admin';
  const validPassword = process.env.ADMIN_PASSWORD ?? 'secret';

  if (username !== validUsername || password !== validPassword) {
    return sendAuthChallenge(response, 'Credenciales inválidas');
  }

  return next();
};

function sendAuthChallenge(response: Response, message?: string) {
  response
    .status(401)
    .setHeader('WWW-Authenticate', 'Basic realm="Protected Area", charset="UTF-8"')
    .json({
      error: 'Unauthorized',
      statusCode: 401,
      message: message ?? 'Autenticación requerida',
      details: {
        suggestion: 'Por favor proporcione credenciales válidas',
        support: 'ismael.diaz@educaedtech.com',
      },
    });
}
/*
import {Middleware} from '@loopback/rest';

export const basicAuthMiddleware: Middleware = async (ctx, next) => {
  const {request, response} = ctx;

  // Excluir rutas públicas (ej: /health, /docs)
  if (request.path.match(/^\/(health|docs)/)) {
    return next();
  }

  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith('Basic ')) {
    response
      .status(401)
      .setHeader('WWW-Authenticate', 'Basic realm="Protected Area"')
      .json({
        error: 'Unauthorized',
        statusCode: 401,
        message: 'Autenticación requerida',
      });
    return;
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const validUsername = process.env.ADMIN_USER ?? 'admin';
  const validPassword = process.env.ADMIN_PASSWORD ?? 'secret';

  if (username !== validUsername || password !== validPassword) {
    response.status(403).json({
      error: 'Forbidden',
      statusCode: 403,
      message: 'Credenciales inválidas',
      details: {
        suggestion: 'Verifique el usuario y contraseña',
        support: 'ismael.diaz@educaedtech.com',
      },
    });
    return;
  }

  return next();
};
*/
