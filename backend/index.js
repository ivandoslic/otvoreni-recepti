const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const OpenApiValidator = require("express-openapi-validator");
const { validateResponse } = require('express-openapi-validator/dist/middlewares/openapi.response.validator');
const fs = require("fs");
const { requiresAuth, auth } = require('express-openid-connect');
const { exec } = require('child_process');

const app = express();
const port = 8080;

const authConfig = {
  authRequired: false,
  auth0Logout: true,
  secret: '90d081ee0337a4f1e2e09e11a1df648eaa0f692af6f2651f0423643ec019fa20',
  baseURL: 'http://localhost:8080',
  clientID: 'nZLrqB3kZcMAPOBdI7BTnVB4XBepOzqN',
  issuerBaseURL: 'https://dev-5d34ei8tmmthtj8w.eu.auth0.com',
}

const pool = new Pool({
  host: process.env.DB_HOST || "recipesdb",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "recipesDb",
});

const wrapper = (status, message, response) => ({ status, message, response });

async function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (error, stdout, stderr) => {
      if (error) {
        return reject(error);
      }
      if (stderr) {
        // In some cases, Postgres might print warnings to stderr
        // If you want to treat them as errors, reject here.
        console.warn("stderr:", stderr);
      }
      resolve(stdout);
    });
  });
}


function hhmmssToDuration(hhmmss = "00:00:00") {
  const [hh, mm, ss] = hhmmss.split(":").map(Number);
  const hours = hh || 0;
  const minutes = mm || 0;
  const seconds = ss || 0;

  let duration = "PT";
  if (hours > 0) duration += hours + "H";
  if (minutes > 0) duration += minutes + "M";
  if (seconds > 0) duration += seconds + "S";
  return duration;
}

const copyCsvQuery = `
COPY (
  SELECT 
    r.id AS id_recepta,
    r.naziv AS naziv_recepta,
    r.opis AS opis_recepta,
    r.youtube_url AS recept_youtube_url,
    r.koraci_recepta AS koraci_recepta,
    r.wiki_url AS recept_wiki_url,
    r.vrijeme_pripreme AS vrijeme_pripreme,
    r.vrijeme_kuhanja AS vrijeme_kuhanja,
    r.broj_porcija AS broj_porcija,
    r.tezina AS tezina,
    d.id AS id_drzave,
    d.naziv AS naziv_drzave,
    d.glavni_grad AS glavni_grad,
    d.flag_url AS zastava_url,
    d.region AS regija,
    i.naziv_sastojka AS naziv_sastojka,
    i.kolicina AS kolicina,
    i.mjerna_jedinica AS mjerna_jedinica
  FROM recepti r
  LEFT JOIN drzave d ON r.drzava_id = d.id
  LEFT JOIN recept_sastojci rs ON r.id = rs.recept_id
  LEFT JOIN sastojci s ON rs.sastojak_id = s.id
  CROSS JOIN LATERAL (
      SELECT 
        s.naziv AS naziv_sastojka, 
        rs.kolicina AS kolicina, 
        rs.mjerna_jedinica AS mjerna_jedinica
  ) AS i
  GROUP BY 
    r.id, d.id, i.naziv_sastojka, 
    i.kolicina, i.mjerna_jedinica
  ORDER BY r.id, i.naziv_sastojka
)
TO STDOUT WITH (FORMAT CSV, HEADER);
`;

// Second query (JSON)
const copyJsonQuery = `
COPY (
  SELECT json_agg(
    json_build_object(
      'id_recepta', r.id,
      'naziv_recepta', r.naziv,
      'opis_recepta', r.opis,
      'recept_youtube_url', r.youtube_url,
      'koraci_recepta', r.koraci_recepta,
      'recept_wiki_url', r.wiki_url,
      'vrijeme_pripreme', r.vrijeme_pripreme,
      'vrijeme_kuhanja', r.vrijeme_kuhanja,
      'broj_porcija', r.broj_porcija,
      'tezina', r.tezina,
      'drzava', json_build_object(
        'drzava_id', d.id,
        'naziv_drzave', d.naziv,
        'glavni_grad', d.glavni_grad,
        'zastava_url', d.flag_url,
        'regija', d.region
      ),
      'sastojci', sastojci.sastojci
    )
  ) AS recepti
  FROM recepti r
  LEFT JOIN drzave d ON r.drzava_id = d.id
  LEFT JOIN (
    SELECT 
      rs.recept_id, 
      json_agg(
        json_build_object(
          'naziv_sastojka', s.naziv,
          'kolicina', rs.kolicina,
          'mjerna_jedinica', rs.mjerna_jedinica
        )
      ) AS sastojci
    FROM recept_sastojci rs
    LEFT JOIN sastojci s ON rs.sastojak_id = s.id
    GROUP BY rs.recept_id
  ) AS sastojci 
    ON r.id = sastojci.recept_id
)
TO STDOUT;
`;

app.use(express.json());
app.use(auth(authConfig));


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
    validateRequests: false,
    validateResponses: false,
    ignorePaths: /^(?!\/api)|\/api\/docs|\/api\/data(\/json|\/csv)?/,
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

    const query = `
      SELECT json_build_object(
        'id_recepta', r.id,
        'naziv_recepta', r.naziv,
        'opis_recepta', r.opis,
        'recept_youtube_url', r.youtube_url,
        'koraci_recepta', r.koraci_recepta,
        'recept_wiki_url', r.wiki_url,
        'vrijeme_pripreme', r.vrijeme_pripreme,
        'vrijeme_kuhanja', r.vrijeme_kuhanja,
        'broj_porcija', r.broj_porcija,
        'tezina', r.tezina,
        'drzava', json_build_object(
          'drzava_id', d.id,
          'naziv_drzave', d.naziv,
          'glavni_grad', d.glavni_grad,
          'zastava_url', d.flag_url,
          'regija', d.region
        ),
        'sastojci', sastojci.sastojci
      ) AS recept
      FROM recepti r
      LEFT JOIN drzave d 
        ON r.drzava_id = d.id
      LEFT JOIN (
        SELECT 
          rs.recept_id, 
          json_agg(json_build_object(
            'naziv_sastojka', s.naziv,
            'kolicina', rs.kolicina,
            'mjerna_jedinica', rs.mjerna_jedinica
          )) AS sastojci
        FROM recept_sastojci rs
        LEFT JOIN sastojci s 
          ON rs.sastojak_id = s.id
        GROUP BY rs.recept_id
      ) AS sastojci 
        ON r.id = sastojci.recept_id
      WHERE r.id = ${recipeId}
    `;

    const { rows } = await pool.query(query);

    if (rows.length <= 0) {
      return res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađen takav recept", null));
    }

    const recipe = rows[0].recept;

    const prepTimeDuration = hhmmssToDuration(recipe.vrijeme_pripreme); 
    const cookTimeDuration = hhmmssToDuration(recipe.vrijeme_kuhanja);

    const semanticData = {
      "@context": "https://schema.org",
      "@type": "Recipe",
      "name": recipe.naziv_recepta,            // from schema:name
      "description": recipe.opis_recepta,      // from schema:description
      "recipeYield": recipe.broj_porcija,      // from schema:recipeYield
      "prepTime": prepTimeDuration,            // from schema:prepTime
      "cookTime": cookTimeDuration,            // from schema:cookTime
    };

    res.json(
      wrapper(
        "OK",
        "Recept uspješno dohvaćen",
        {
          ...recipe,
          "@context": semanticData["@context"],
          "@type": semanticData["@type"],
          "schema:name": semanticData.name,
          "schema:description": semanticData.description,
          "schema:recipeYield": semanticData.recipeYield,
          "schema:prepTime": semanticData.prepTime,
          "schema:cookTime": semanticData.cookTime
        }
      )
    );
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json(wrapper("Internal Server Error", "Neuspješno dohvaćanje recepta", null));
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
    const query = `
      SELECT json_build_object(
        'drzava_id', d.id,
        'naziv_drzave', d.naziv,
        'glavni_grad', d.glavni_grad,
        'povrsina', d.povrsina,
        'broj_stanovnika', d.broj_stanovnika,
        'valuta', d.valuta,
        'jezik', d.jezici,
        'kontinent', d.kontinent,
        'zastava_url', d.flag_url,
        'datum_osnivanja', d.datum_osnivanja,
        'regija', d.region,
        'bdp', d.gdp
      ) AS country
      FROM drzave d
      WHERE d.id = ${countryId}
    `;
    const { rows } = await pool.query(query);

    if (rows.length <= 0) {
      return res
        .status(404)
        .json(wrapper("Not Found", "Nije pronađena takva država u bazi podataka", null));
    }

    const country = rows[0].country;

    const semanticData = {
      "@context": "https://schema.org",
      "@type": "Country",
      "name": country.naziv_drzave,
      "description": `Glavni grad: ${country.glavni_grad}. 
                      Valuta: ${country.valuta}. 
                      Stanovnika: ${country.broj_stanovnika}.`
    };

    const responseData = {
      ...country,
      ...semanticData,
    };

    res.json(wrapper("OK", "Država uspješno dohvaćena", responseData));
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

app.get('/', (req, res) => {
  const isLoggedIn = req.oidc.isAuthenticated();
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Otvoreni podaci s receptima za hranu, uključujući detaljne informacije o pripremi, sastojcima i podrijetlu jela.">
        <meta name="author" content="Ivan Došlić &lt;ivan.doslic@fer.hr&gt;">
        <meta name="keywords" content="recepti, kuhanje, hrana">
        <meta name="language" content="Croatian">
        <meta name="theme" content="Cooking and food">
        <meta name="license" content="CC0 1.0 Universal">
        <meta name="publication_date" content="2024-10-27">
        <meta name="source" content="www.coolinarka.com">
        <meta name="media_types" content="text/csv, text/json">
        <meta name="version" content="1.0">
        <title>OR Labos - Ivan Došlić</title>
    </head>
    <body>
        ${
          !isLoggedIn ?
          `
          <a href="/login">Prijava</a>
          `
          :
          `
          <a href="/profile">Korisnički profil</a>
          <a href="/refreshdata">Osvježi podatke</a>
          <a href="/logout">Odjava</a>
          `
        }
        <h1>Otvoreni Recepti</h1>
    </body>
    </html>
  `);
});

app.get("/profile", (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    // if not authenticated, redirect to /login
    return res.oidc.login();
  }

  const user = req.oidc.user; // user profile from ID token
  res.send(`
    <html>
      <head><title>Profile</title></head>
      <body>
        <h1>Profile Page</h1>
        <p>Here is your user info:</p>
        <div id="profilJson">
        <pre>${JSON.stringify(user, null, 2)}</pre>
        </div>
        <p><a href="/">Back Home</a></p>
      </body>
    </html>
  `);
});

app.get('/refreshdata', async (req, res) => {
  if (!req.oidc.isAuthenticated()) {
    return res.status(401).send("Please log in to see secret data.");
  }

  try {
    const csvCommand = `psql "postgresql://postgres:root@recipesdb:5432/recipesDb" -c "${copyCsvQuery.replace(/\n/g, ' ')}"`;
    const csvResult = await execShellCommand(csvCommand);
    
    fs.writeFileSync(path.join(__dirname, 'recipes.csv'), csvResult, 'utf8');

    const jsonCommand = `psql "postgresql://postgres:root@recipesdb:5432/recipesDb" -c "${copyJsonQuery.replace(/\n/g, ' ')}"`;
    const jsonResult = await execShellCommand(jsonCommand);

    fs.writeFileSync(path.join(__dirname, 'recipes.json'), jsonResult, 'utf8');

    return res.status(200).redirect("/");
  } catch (error) {
    console.error("Error refreshing data:", error);
    return res.status(500).send("An error occurred while refreshing the data.");
  }
})

app.listen(port);
