# Import manuel TheMealDB

Travail fait à la main (sans `scripts/import-themealdb.mjs`), gardé pour pouvoir reprendre :

- `selected.json` : les 331 recettes kasher retenues (100 plats, 100 desserts, et toutes les entrées, accompagnements et petits-déjeuners disponibles).
- `mapping.py` : chaque ingrédient TheMealDB relié à un ingrédient du catalogue, ou écarté (`None`) pour le sel, l'eau, les épices…
- `new_ings.py` : les ingrédients ajoutés au catalogue pour cet import.
- `translations/` : les traductions (français, anglais, hébreu), par lots. 160 recettes sont faites : le lot suivant commence à l'index 160 de `selected.json`.
- `assemble.py` construit `catalog/recipes.json` à partir de ces fichiers (`python3 assemble.py <dossier> <racine du dépôt>`, le dossier contenant aussi `all.json`, l'export complet de TheMealDB) ; `view.py` affiche un lot à traduire.
