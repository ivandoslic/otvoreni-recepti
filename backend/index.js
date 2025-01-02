const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = 8080;

const pool = new Pool({
  host: process.env.DB_HOST || "recipesdb",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "recipesDb",
});

// Disable CORS:
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/api/data", async (req, res, next) => {
  try {
    const query = "SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id";
    const data = await pool.query(query);
    const result = data.rows.map(row => row.recept);
    res.json(result);
  } catch (e) {
    console.error(e.message);
    res.status(500).send("Internal server error");
  }
});

app.get("/api/data/json", (req, res) => {
  const filePath = path.join(__dirname, "recipes.json");
  res.download(filePath, "recipes.json", (err) => {
    if (err) {
      console.error("Error sending JSON file:", err);
      res.status(500).send("Could not download JSON file");
    }
  });
});

app.get("/api/data/csv", (req, res) => {
  const filePath = path.join(__dirname, "recipes.csv");
  res.download(filePath, "recipes.csv", (err) => {
    if (err) {
      console.error("Error sending CSV file:", err);
      res.status(500).send("Could not download CSV file");
    }
  });
});

app.get('/schema.json', (req, res, next) => {
    res.sendFile(`${__dirname}/schema.json`);
});

app.listen(port);