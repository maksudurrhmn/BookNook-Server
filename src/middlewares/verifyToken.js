import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS = createRemoteJWKSet(new URL(`${process.env.AUTH_BASE_URL}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Token is missing',
      });
    }

    const token = authHeader.split(' ')[1];

    const { payload } = await jwtVerify(token, JWKS, {
      issuer: process.env.AUTH_BASE_URL,
      audience: process.env.AUTH_BASE_URL,
    });

    req.user = {
      id: payload.id || payload.sub,
      email: payload.email,
      name: payload.name || '',
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);

    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or expired token',
    });
  }
};

export default verifyToken;
