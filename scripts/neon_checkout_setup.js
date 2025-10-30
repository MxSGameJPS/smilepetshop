#!/usr/bin/env node
/**
 * Script mínimo para criar uma tabela de checkout e inserir registros no Neon Postgres.
 * Uso (PowerShell):
 *   $env:NEON_DATABASE_URL = "postgresql://...";
 *   node scripts\neon_checkout_setup.js create-table
 *   node scripts\neon_checkout_setup.js insert '{"firstName":"João","lastName":"Silva","email":"joao@example.com"}'
 *
 * NÃO comite a variável de ambiente com credenciais no repositório.
 */

const { Client } = require("pg");

const CONNECTION_URL =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!CONNECTION_URL) {
  console.error(
    "ERRO: defina a variável de ambiente NEON_DATABASE_URL com a connection string do banco."
  );
  process.exit(1);
}

async function withClient(fn) {
  const client = new Client({ connectionString: CONNECTION_URL });
  try {
    await client.connect();
    await fn(client);
  } finally {
    await client.end();
  }
}

const CREATE_SQL = `
CREATE TABLE IF NOT EXISTS checkout_billing (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  address1 TEXT,
  numero TEXT,
  address2 TEXT,
  city TEXT,
  state TEXT,
  postal VARCHAR(16),
  phone VARCHAR(64),
  email TEXT,
  ship_different BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
`;

async function createTable() {
  console.log("Criando tabela 'checkout_billing' se não existir...");
  await withClient(async (client) => {
    await client.query(CREATE_SQL);
    console.log("Tabela criada/verificada com sucesso.");
  });
}

async function insertRecord(obj) {
  const sql = `INSERT INTO checkout_billing
  (first_name, last_name, company, address1, numero, address2, city, state, postal, phone, email, ship_different, notes)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, created_at`;
  const params = [
    obj.firstName || null,
    obj.lastName || null,
    obj.company || null,
    obj.address1 || null,
    obj.numero || null,
    obj.address2 || null,
    obj.city || null,
    obj.state || null,
    obj.postal || null,
    obj.phone || null,
    obj.email || null,
    obj.shipDifferent === true,
    obj.notes || null,
  ];

  await withClient(async (client) => {
    const res = await client.query(sql, params);
    console.log("Registro inserido:", res.rows[0]);
  });
}

async function main() {
  const cmd = process.argv[2];
  if (!cmd) {
    console.log(
      "Uso: node scripts/neon_checkout_setup.js <create-table|insert> [json]"
    );
    process.exit(0);
  }

  if (cmd === "create-table") {
    await createTable();
    process.exit(0);
  }

  if (cmd === "insert") {
    const jsonArg = process.argv[3];
    let obj = {};
    if (jsonArg) {
      try {
        obj = JSON.parse(jsonArg);
      } catch (err) {
        console.error("Erro ao parsear JSON do argumento:", err.message);
        process.exit(2);
      }
    } else {
      // read stdin
      const chunks = [];
      for await (const chunk of process.stdin) chunks.push(chunk);
      const input = Buffer.concat(chunks).toString().trim();
      if (input) {
        try {
          obj = JSON.parse(input);
        } catch (err) {
          console.error("Erro ao parsear JSON do stdin:", err.message);
          process.exit(2);
        }
      } else {
        console.error("Nenhum JSON fornecido para inserção.");
        process.exit(2);
      }
    }

    await insertRecord(obj);
    process.exit(0);
  }

  console.error("Comando desconhecido:", cmd);
  process.exit(2);
}

main().catch((err) => {
  console.error(err);
  process.exit(3);
});
