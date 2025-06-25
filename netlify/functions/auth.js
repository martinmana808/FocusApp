import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'dev-zy2v2vb4ic7m785h.us.auth0.com';

const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export function getUserIdFromAuthHeader(headers) {
  console.log('[Auth Backend] Verifying token...');
  console.log('[Auth Backend] Using AUTH0_DOMAIN:', process.env.AUTH0_DOMAIN);
  console.log('[Auth Backend] Using AUTH0_CLIENT_ID:', process.env.AUTH0_CLIENT_ID);
  
  const auth = headers.authorization || headers.Authorization;
  if (!auth) {
    console.log('[Auth Backend] No authorization header found.');
    return null;
  }

  const token = auth.split(' ')[1];
  console.log('[Auth Backend] Token found:', token.substring(0, 20) + '...'); // Log first 20 chars

  return new Promise((resolve) => {
    jwt.verify(token, getKey, {
      audience: `https://${process.env.AUTH0_DOMAIN}/api/v2/`,
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        console.error('[Auth Backend] Token verification failed:', err);
        return resolve(null);
      }
      console.log('[Auth Backend] Token verified successfully. Decoded:', decoded);
      resolve(decoded && decoded.sub);
    });
  });
} 
