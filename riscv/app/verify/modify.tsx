import { DBConnection } from '@/app/sql/sql';
import crypto from 'crypto';

/**
 * Internal utility function to modify cookie data and recompute HMAC
 * @param currentCookie - Current cookie string
 * @param newData - New JSON object data to store
 * @returns Promise resolving to new cookie string with updated sens object
 */
export async function modifyCookieData(currentCookie: string, newData: Record<string, unknown>): Promise<string> {
  let db: DBConnection | null = null;
  
  try {
    // Get database connection and secret for HMAC computation
    db = new DBConnection();
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

    // Convert to cookie format
    const sensString = encodeURIComponent(JSON.stringify(newSens));
    const newSensCookiePart = `sens=${sensString}`;

    // Remove existing sens from cookie if present
    let updatedCookie = currentCookie.replace(/sens=[^;]*;?\s*/, '');
    
    // Clean up any trailing semicolons or whitespace
    updatedCookie = updatedCookie.replace(/;\s*$/, '').trim();
    
    // Add new sens to cookie
    if (updatedCookie.length > 0) {
      updatedCookie = `${updatedCookie}; ${newSensCookiePart}`;
    } else {
      updatedCookie = newSensCookiePart;
    }

    return updatedCookie;
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
