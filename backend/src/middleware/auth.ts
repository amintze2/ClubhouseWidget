/**
 * SLUGGER JWT Authentication Middleware
 * 
 * This middleware verifies JWT tokens from the SLUGGER platform.
 * 
 * NOTE: You'll need to get the following from the SLUGGER platform team:
 * - Cognito User Pool ID
 * - Cognito Region
 * - JWKS URI (or we can construct it)
 * 
 * Install required packages:
 * npm install jsonwebtoken jwks-rsa
 */

import { Request, Response, NextFunction } from 'express';

// Extend Express Request to include user info
declare global {
  namespace Express {
    interface Request {
      user?: {
        sub: string; // Cognito user ID
        email: string;
        email_verified: boolean;
        given_name?: string;
        family_name?: string;
        [key: string]: any;
      };
    }
  }
}

/**
 * Verify SLUGGER JWT token
 * 
 * This is a placeholder implementation. You'll need to:
 * 1. Install: npm install jsonwebtoken jwks-rsa
 * 2. Get Cognito configuration from SLUGGER platform team
 * 3. Uncomment and configure the JWT verification code below
 */
export async function verifySluggerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  // TODO: Uncomment and configure when you have Cognito details from SLUGGER team
  /*
  try {
    // Import these at the top of the file when ready
    // import jwt from 'jsonwebtoken';
    // import jwksClient from 'jwks-rsa';

    // Get these values from SLUGGER platform team
    const COGNITO_REGION = process.env.COGNITO_REGION || 'us-east-2';
    const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || '';

    if (!COGNITO_USER_POOL_ID) {
      throw new Error('COGNITO_USER_POOL_ID not configured');
    }

    const client = jwksClient({
      jwksUri: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}/.well-known/jwks.json`
    });

    function getKey(header: any, callback: any) {
      client.getSigningKey(header.kid, (err, key) => {
        if (err) {
          callback(err);
          return;
        }
        const signingKey = key?.getPublicKey();
        callback(null, signingKey);
      });
    }

    // Verify token
    jwt.verify(token, getKey, {
      audience: process.env.COGNITO_CLIENT_ID,
      issuer: `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/${COGNITO_USER_POOL_ID}`,
    }, (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Invalid token', details: err.message });
        return;
      }
      
      req.user = decoded as Express.Request['user'];
      next();
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Token verification failed', details: error.message });
    return;
  }
  */

  // TEMPORARY: For development, just decode the token without verification
  // REMOVE THIS IN PRODUCTION and uncomment the code above
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    req.user = {
      sub: payload.sub,
      email: payload.email,
      email_verified: payload.email_verified || false,
      given_name: payload.given_name,
      family_name: payload.family_name,
    };
    next();
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid token format', details: error.message });
    return;
  }
}

/**
 * Optional: Middleware that allows both SLUGGER tokens and manual slugger_user_id
 * Useful during transition period
 */
export async function verifySluggerTokenOrManual(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  // If Bearer token provided, verify it
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return verifySluggerToken(req, res, next);
  }
  
  // Otherwise, allow manual slugger_user_id (for backward compatibility)
  // This assumes your routes handle slugger_user_id from query/body
  next();
}

