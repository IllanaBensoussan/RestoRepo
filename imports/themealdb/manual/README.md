# Import manuel TheMealDB

Travail fait à la main (sans `scripts/import-themealdb.mjs`), gardé pour pouvoir reprendre :

- `selected.json` : les 331 recettes kasher retenues (100 plats, 100 desserts, et toutes les entrées, accompagnements et petits-déjeuners disponibles).
- `mapping.py` : chaque ingrédient TheMealDB relié à un ingrédient du catalogue, ou écarté (`None`) pour le sel, l'eau, les épices…
- `new_ings.py` : les ingrédients ajoutés au catalogue pour cet import.
- `translations/` : les traductions (français, anglais, hébreu), par lots. Les 331 recettes sont faites. Quelques recettes ont été adaptées pour la cacheroute (agar-agar à la place de la gélatine, graisse végétale à la place du saindoux, eau à la place du lait dans des pains servis avec de la viande, porc ou charcuterie retirés des suggestions).
- `assemble.py` construit `catalog/recipes.json` à partir de ces fichiers (`python3 assemble.py <dossier> <racine du dépôt>`, le dossier contenant `all.json`, l'export complet de TheMealDB, `selected.json`, `mapping.py`, `qty.py` et les traductions dans un sous-dossier `tr/`). `all.json` n'est pas dans le dépôt : il se reconstruit en concaténant les listes `meals` de `https://www.themealdb.com/api/json/v1/1/search.php?f=a` à `f=z`. Le script écrit les recettes dans l'ordre de `selected.json` ; `catalog/recipes.json` est ensuite trié par identifiant ; `view.py` affiche un lot à traduire.
