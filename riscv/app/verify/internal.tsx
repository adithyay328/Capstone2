import { DBConnection } from '@/app/sql/sql';
import { VerifyResponse } from './types';
import crypto from 'crypto';

/**
 * Internal verification function that validates a cookie string containing
 * sens data with HMAC signature.
 * 
 * @param cookie - The full cookie string to verify
 * @returns VerifyResponse with verified data or null on failure
 */
export async function verifyCookieInternal(cookie: string): Promise<VerifyResponse> {
  let db: DBConnection | null = null;
  
  // Extract sens object from cookie
  let sensData: any = null;
  let cookieWithoutSens = cookie;
  
  try {
    // Look for sens= in the cookie string
    const sensMatch = cookie.match(/sens=([^;]*)/);
    if (sensMatch) {
      const sensString = decodeURIComponent(sensMatch[1]);
      sensData = JSON.parse(sensString);
      
      // Remove sens from cookie for failure case
      cookieWithoutSens = cookie.replace(/sens=[^;]*;?\s*/, '');
      // Clean up any trailing semicolons
      cookieWithoutSens = cookieWithoutSens.replace(/;\s*$/, '');
    }
  } catch (parseError) {
    // If parsing fails, treat as verification failure
    sensData = null;
  }

  // If no sens data found, return failure response
  if (!sensData) {
    return {
      cookie: cookieWithoutSens,
      data: null,
    };
  }

  // Verify HMAC
  try {
    const { hmac, data } = sensData;
    
    // Get database connection and secret for HMAC verification
    db = await DBConnection.create();
    const client = db.client;
    const secretResult = await client.query(
      "SELECT value FROM secrets WHERE name = 'hmac'"
    );
    
    if (secretResult.rows.length === 0) {
      // HMAC secret not found - treat as verification failure
      console.error('HMAC secret not found in database');
      return {
        cookie: cookieWithoutSens,
        data: null,
      };
    }

    const secret = secretResult.rows[0].value;

    // Create HMAC hash of the data
    const dataString = JSON.stringify(data);
    const expectedHmac = crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    // Compare HMACs using timing-safe comparison
    const isValid = crypto.timingSafeEqual(
      Buffer.from(hmac, 'hex'),
      Buffer.from(expectedHmac, 'hex')
    );

    if (isValid) {
      // Verification successful - return same cookie and data
      return {
        cookie: cookie,
        data: data,
      };
    } else {
      // HMAC verification failed - return cookie without sens
      return {
        cookie: cookieWithoutSens,
        data: null,
      };
    }
  } catch (verificationError) {
    // Verification process failed - return cookie without sens
    console.error('Verification error:', verificationError);
    return {
      cookie: cookieWithoutSens,
      data: null,
    };
  } finally {
    // Explicitly close database connection
    if (db) {
      try {
        await db.client.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}
