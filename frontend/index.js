function recipesTable() {
  return {
    allRecipes: [],
    pretraga: "",
    atribut: "",

    fetchRecipes() {
      fetch("http://localhost:8080/api/data")
        .then((response) => response.json())
        .then((data) => {
          this.allRecipes = data;
        })
        .catch((err) => {
          console.error("Error fetching recipes:", err);
        });
    },

    get attributes() {
      return [
        "naziv_recepta",
        "opis_recepta",
        "tezina",
        "drzava.naziv_drzave",
        "broj_porcija",
      ];
    },

    get filteredRecipes() {
      const search = this.pretraga.toLowerCase();

      return this.allRecipes.filter((recipe) => {
        if (!this.pretraga) return true;

        if (this.atribut) {
          const value = this.getNestedValue(recipe, this.atribut);
          return value && value.toString().toLowerCase().includes(search);
        }

        return this.attributes.some((attr) => {
          const value = this.getNestedValue(recipe, attr);
          return value && value.toString().toLowerCase().includes(search);
        });
      });
    },

    getNestedValue(obj, path) {
      return path
        .split(".")
        .reduce((o, key) => (o && o[key] !== undefined ? o[key] : null), obj);
    },

    downloadJSON() {
      const jsonBlob = new Blob(
        [JSON.stringify(this.filteredRecipes, null, 2)],
        {
          type: "application/json",
        }
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(jsonBlob);
      link.download = "recipes.json";
      link.click();
    },

    downloadCSV() {
      const csvRows = [];
      const headers = [
        "id_recepta",
        "naziv_recepta",
        "opis_recepta",
        "recept_youtube_url",
        "koraci_recepta",
        "recept_wiki_url",
        "vrijeme_pripreme",
        "vrijeme_kuhanja",
        "broj_porcija",
        "tezina",
        "id_drzave",
        "naziv_drzave",
        "glavni_grad",
        "zastava_url",
        "regija",
        "naziv_sastojka",
        "kolicina",
        "mjerna_jedinica",
      ];
      csvRows.push(headers.join(","));

      this.filteredRecipes.forEach((recipe) => {
        const baseData = [
          recipe.id_recepta,
          recipe.naziv_recepta,
          recipe.opis_recepta,
          recipe.recept_youtube_url,
          recipe.koraci_recepta,
          recipe.recept_wiki_url,
          recipe.vrijeme_pripreme,
          recipe.vrijeme_kuhanja,
          recipe.broj_porcija,
          recipe.tezina,
          recipe.drzava?.drzava_id || "",
          recipe.drzava?.naziv_drzave || "",
          recipe.drzava?.glavni_grad || "",
          recipe.drzava?.zastava_url || "",
          recipe.drzava?.regija || "",
        ];

        if (recipe.sastojci && recipe.sastojci.length > 0) {
          recipe.sastojci.forEach((ingredient) => {
            const row = [
              ...baseData,
              ingredient.naziv_sastojka,
              ingredient.kolicina,
              ingredient.mjerna_jedinica,
            ];
            csvRows.push(row.map((value) => `"${value}"`).join(","));
          });
        } else {
          const row = [...baseData, "", "", ""];
          csvRows.push(row.map((value) => `"${value}"`).join(","));
        }
      });

      const csvBlob = new Blob([csvRows.join("\n")], {
        type: "text/csv",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(csvBlob);
      link.download = "recipes.csv";
      link.click();
    },
  };
}
