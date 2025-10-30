import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

const app = express();
const port = process.env.API_PORT || 3001;

const connectionString =
  process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERRO: NEON_DATABASE_URL não definida no ambiente.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

app.use(cors());
app.use(express.json());

app.post("/api/checkout", async (req, res) => {
  const body = req.body || {};
  const {
    firstName,
    lastName,
    company,
    address1,
    numero,
    address2,
    city,
    state,
    postal,
    phone,
    email,
    shipDifferent,
    notes,
  } = body;

  const sql = `INSERT INTO checkout_billing
    (first_name, last_name, company, address1, numero, address2, city, state, postal, phone, email, ship_different, notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, created_at`;

  const params = [
    firstName || null,
    lastName || null,
    company || null,
    address1 || null,
    numero || null,
    address2 || null,
    city || null,
    state || null,
    postal || null,
    phone || null,
    email || null,
    shipDifferent === true,
    notes || null,
  ];

  try {
    const result = await pool.query(sql, params);
    res.json({
      success: true,
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("Erro ao inserir checkout:", err);
    res.status(500).json({ success: false, error: String(err) });
  }
});

app.listen(port, () => {
  console.log(`API server rodando em http://localhost:${port}`);
});
