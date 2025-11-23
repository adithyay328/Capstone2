// Contains our login creds for this server. This
// is on wireguard regardless, no one can
// access this but Adi.
const USERNAME = "capstone";
const PASSWORD = "capstone";
const HOST = "pg.wg.adiy.io";
const DB_NAME = "capstone";

import { Client } from "pg";

// To help with preventing too many connections,
// all connections are wrapped in this object.
// When it's auto destroyed, the connections close.
export class DBConnection {
  client: Client;

  constructor() {
    this.client = new Client({
      user: USERNAME,
      host: HOST,
      database: DB_NAME,
      password: PASSWORD,
      port: 5432,
    });
    this.client.connect();

    // In one minute, register
    // a callback to close this connection
    // if not already closed
    setTimeout(async () => {
      await this.client.end();
    }, 60000);
  }
}