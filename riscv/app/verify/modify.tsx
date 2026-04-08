import { DBConnection } from '@/app/sql/sql';
import crypto from 'crypto';

/**
 * Internal utility function to create a sens cookie with HMAC
 * @param newData - New JSON object data to store
 * @returns Promise resolving to sens cookie string (just the sens=... part)
 */
export async function modifyCookieData(newData: Record<string, unknown>): Promise<string> {
  let db: DBConnection | null = null;
  
  try {
    // Get database connection and secret for HMAC computation
    db = await DBConnection.create();
    const client = db.client;
    const secretResult = await client.query(
      "SELECT value FROM secrets WHERE name = 'hmac'"
    );
    
    if (secretResult.rows.length === 0) {
      throw new Error('HMAC secret not found in database');
    }

    const secret = secretResult.rows[0].value;

    // Create HMAC hash of the new data
    const dataString = JSON.stringify(newData);
    const newHmac = crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');

    // Create new sens object
    const newSens = {
      hmac: newHmac,
      data: newData
    };

    // Convert to cookie format and return just the sens cookie
    // Path=/ ensures the cookie is set for the entire site, not just the current path
    const sensString = encodeURIComponent(JSON.stringify(newSens));
    return `sens=${sensString}; Path=/`;
  } catch (error) {
    console.error('Error modifying cookie data:', error);
    throw error;
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
