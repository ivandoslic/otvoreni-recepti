const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const OpenApiValidator = require("express-openapi-validator");
const { validateResponse } = require('express-openapi-validator/dist/middlewares/openapi.response.validator');
const fs = require("fs");

const app = express();
const port = 8080;

const pool = new Pool({
  host: process.env.DB_HOST || "recipesdb",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "recipesDb",
});

const wrapper = (status, message, response) => ({ status, message, response });

app.use(express.json());

// Disable CORS:
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.use(
  OpenApiValidator.middleware({
    apiSpec: path.join(__dirname, "openapi.json"),
    validateRequests: true,
    validateResponses: false,
    ignorePaths: /\/api\/docs|\/api\/data(\/json|\/csv)?/,
  })
);

// Custom response validation TODO

app.use((err, req, res, next) => {
  console.log(err);
  
  if (err.status) {
    if (err.status == 400) {
      res.status(400).json(wrapper("Loš zahtjev", "Provjerite podatke i ponovite zahtjev", null));
      return;
    }
    res.status(err.status).json({
      status: "Greška",
      message: err.message,
      errors: err.errors,
    });
  } else {
    next(err);
  }
});

app.get("/api/data", async (req, res, next) => {
  try {
    const query =
      "SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id";
    const data = await pool.query(query);
    const result = data.rows.map((row) => row.recept);
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

app.get("/api/recepti", async (req, res) => {
  try {
    const {
      id,
      naziv,
      tezina,
      drzava_id,
      kategorija_id,
    } = req.query;

    let query = "SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id WHERE 1 = 1";
    const params = [];

    if (id) {
      query += " AND r.id = $" + (params.length + 1);
      params.push(id);
    }

    if (naziv) {
      query += " AND r.naziv LIKE $" + (params.length + 1);
      params.push(`%${naziv}%`);
    }

    if (tezina) {
      query += " AND r.tezina = $" + (params.length + 1);
      params.push(tezina);
    }

    if (drzava_id) {
      query += " AND d.id = $" + (params.length + 1);
      params.push(drzava_id);
    }

    const { rows } = await pool.query(query, params);

    if (rows.length <= 0) {
      res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađen takav recept", null));
      return;
    }

    res.json(wrapper("OK", "Recepti uspješno dohvaćeni", rows.map(row => row.recept)));
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(
        wrapper("Internal Server Error", "Neuspješno dohvaćanje recepata", null)
      );
  }
});

app.post("/api/recepti", async (req, res) => {
  try {
    const {
      naziv,
      opis,
      youtube_url,
      koraci_recepta,
      wiki_url,
      vrijeme_pripreme,
      vrijeme_kuhanja,
      broj_porcija,
      tezina,
      drzava_id,
      kategorija_id,
    } = req.body;

    const query = `
      INSERT INTO recepti 
      (naziv, opis, youtube_url, koraci_recepta, wiki_url, vrijeme_pripreme, vrijeme_kuhanja, broj_porcija, tezina, drzava_id, kategorija_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *;
    `;

    const { rows } = await pool.query(query, [
      naziv,
      opis,
      youtube_url,
      koraci_recepta,
      wiki_url,
      vrijeme_pripreme,
      vrijeme_kuhanja,
      broj_porcija,
      tezina,
      drzava_id,
      kategorija_id,
    ]);

    const returnQuery = `SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id WHERE r.id = ${rows[0].id}`;

    const returnRows = await pool.query(returnQuery);

    res.status(201).json(wrapper("Created", "Recept uspješno stvoren", returnRows.rows[0].recept || rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json(wrapper("Internal Server Error", "Greška pri stvaranju recepta", null));
  }
});

app.get("/api/recepti/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;

    const query = `SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id WHERE r.id = ${recipeId}`;

    const { rows } = await pool.query(query);

    if (rows.length <= 0) {
      res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađen takav recept", null));
      return;
    }

    res.json(wrapper("OK", "Recept uspješno dohvaćen", rows[0].recept));
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(
        wrapper("Internal Server Error", "Neuspješno dohvaćanje recepta", null)
      );
  }
});

app.put("/api/recepti/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const {
      naziv,
      opis,
      youtube_url,
      koraci_recepta,
      wiki_url,
      vrijeme_pripreme,
      vrijeme_kuhanja,
      broj_porcija,
      tezina,
      drzava_id,
      kategorija_id,
    } = req.body;

    const query = `
      UPDATE recepti
      SET
        naziv = $1,
        opis = $2,
        youtube_url = $3,
        koraci_recepta = $4,
        wiki_url = $5,
        vrijeme_pripreme = $6,
        vrijeme_kuhanja = $7,
        broj_porcija = $8,
        tezina = $9,
        drzava_id = $10,
        kategorija_id = $11
      WHERE id = $12
      RETURNING *;
    `;

    const values = [
      naziv,
      opis,
      youtube_url,
      koraci_recepta,
      wiki_url,
      vrijeme_pripreme,
      vrijeme_kuhanja,
      broj_porcija,
      tezina,
      drzava_id,
      kategorija_id,
      recipeId,
    ];

    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res
        .status(404)
        .json(wrapper("Not Found", "Recept s danim ID-jem ne postoji", null));
    }

    const returnQuery = `SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id WHERE r.id = ${recipeId}`;

    const returnRows = await pool.query(returnQuery);

    res.json(wrapper("OK", "Recept uspješno ažuriran", returnRows.rows[0].recept || rows[0]));
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(wrapper("Internal Server Error", "Neuspješno ažuriranje recepta", null));
  }
});

app.delete("/api/recepti/:id", async (req, res) => {
  try {
    const recipeId = req.params.id;

    const returnQuery = `SELECT json_build_object( 'id_recepta', r.id, 'naziv_recepta', r.naziv, 'opis_recepta', r.opis, 'recept_youtube_url', r.youtube_url, 'koraci_recepta', r.koraci_recepta, 'recept_wiki_url', r.wiki_url, 'vrijeme_pripreme', r.vrijeme_pripreme, 'vrijeme_kuhanja', r.vrijeme_kuhanja, 'broj_porcija', r.broj_porcija, 'tezina', r.tezina, 'drzava', json_build_object( 'drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'zastava_url', d.flag_url, 'regija', d.region ), 'sastojci', sastojci.sastojci ) AS recept FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN ( SELECT  rs.recept_id,  json_agg(json_build_object( 'naziv_sastojka', s.naziv, 'kolicina', rs.kolicina, 'mjerna_jedinica', rs.mjerna_jedinica )) AS sastojci FROM recept_sastojci rs LEFT JOIN sastojci s ON rs.sastojak_id = s.id GROUP BY rs.recept_id ) AS sastojci ON r.id = sastojci.recept_id WHERE r.id = ${recipeId}`;

    const returnRows = await pool.query(returnQuery);

    const query = "DELETE FROM recepti WHERE id = $1 RETURNING *;";
    const { rows } = await pool.query(query, [recipeId]);

    if (rows.length === 0) {
      res.status(404).json(wrapper("Not Found", "Recept nije pronađen", null));
      return;
    }

    res.json(wrapper("OK", "Recept uspješno obrisan", returnRows.rows[0].recept || rows[0]));
  } catch (e) {
    console.error(e);
    res.status(500).json(wrapper("Internal Server Error", "Greška pri brisanju recepta", null));
  }
});

app.get("/api/drzave", async (req, res) => {
  const query = "SELECT json_build_object('drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'povrsina', d.povrsina, 'broj_stanovnika', d.broj_stanovnika, 'valuta', d.valuta, 'jezik', d.jezici, 'kontinent', d.kontinent, 'zastava_url', d.flag_url, 'datum_osnivanja', d.datum_osnivanja, 'regija', d.region, 'bdp', d.gdp) AS country FROM drzave d";

  try {
    const { rows } = await pool.query(query);

    if (rows.length <= 0) {
      res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađena niti jedna država u bazi podataka", null));
      return;
    }

    res.json(wrapper("OK", "Države uspješno dohvaćene", rows.map(row => row.country)));
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(
        wrapper("Internal Server Error", "Neuspješno dohvaćanje država", null)
      );
  }
});

app.get("/api/drzave/:id", async (req, res) => {
  try {
    const countryId = req.params.id;
    const query = `SELECT json_build_object('drzava_id', d.id, 'naziv_drzave', d.naziv, 'glavni_grad', d.glavni_grad, 'povrsina', d.povrsina, 'broj_stanovnika', d.broj_stanovnika, 'valuta', d.valuta, 'jezik', d.jezici, 'kontinent', d.kontinent, 'zastava_url', d.flag_url, 'datum_osnivanja', d.datum_osnivanja, 'regija', d.region, 'bdp', d.gdp) AS country FROM drzave d WHERE d.id = ${countryId}`;
    const { rows } = await pool.query(query);

    if (rows.length <= 0) {
      res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađena takva država u bazi podataka", null));
      return;
    }

    res.json(wrapper("OK", "Država uspješno dohvaćena", rows[0].country));
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(
        wrapper("Internal Server Error", "Neuspješno dohvaćanje države", null)
      );
  }
});

app.get("/api/docs", (req, res) => {
  const openApiSpecPath = path.join(__dirname, "openapi.json");
  
  fs.readFile(openApiSpecPath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading OpenAPI specification file:", err);
      res.status(500).send("Internal Server Error");
    } else {
      res.type("application/json").send(data);
    }
  });
});

app.listen(port);
