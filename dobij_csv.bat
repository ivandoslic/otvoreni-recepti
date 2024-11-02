docker exec -u postgres recipesdb psql -d recipesDb -c "COPY (SELECT r.id AS id_recepta, r.naziv AS naziv_recepta, r.opis AS opis_recepta, r.youtube_url AS recept_youtube_url, r.koraci_recepta AS koraci_recepta, r.wiki_url AS recept_wiki_url, r.vrijeme_pripreme AS vrijeme_pripreme, r.vrijeme_kuhanja AS vrijeme_kuhanja, r.broj_porcija AS broj_porcija, r.tezina AS tezina, d.id AS id_drzave, d.naziv AS naziv_drzave, d.glavni_grad AS glavni_grad, d.flag_url AS zastava_url, d.region AS regija, i.naziv_sastojka AS naziv_sastojka, i.kolicina AS kolicina, i.mjerna_jedinica AS mjerna_jedinica FROM recepti r LEFT JOIN drzave d ON r.drzava_id = d.id LEFT JOIN recept_sastojci rs ON r.id = rs.recept_id LEFT JOIN sastojci s ON rs.sastojak_id = s.id CROSS JOIN LATERAL (SELECT s.naziv AS naziv_sastojka, rs.kolicina AS kolicina, rs.mjerna_jedinica AS mjerna_jedinica) AS i GROUP BY r.id, d.id, i.naziv_sastojka, i.kolicina, i.mjerna_jedinica ORDER BY r.id, i.naziv_sastojka) TO STDOUT WITH (FORMAT CSV, HEADER);" > novi_csv.csv