import { Client } from 'pg';

export function get_sql_client() {
  const USERNAME = "postgres";
  const DNS_NAME = "pg.wg.adiy.io";
  const DB_NAME = "capstone";
  const PORT_NUMBER = 5432;

  const clientConfig = {
    host: DNS_NAME,
    database: DB_NAME,
    port: PORT_NUMBER,
    user: USERNAME
  }

  return new Client(clientConfig);
};