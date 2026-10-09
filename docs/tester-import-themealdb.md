# Tester l'import TheMealDB

Ce guide sert à vérifier les trois outils ajoutés pour importer des recettes de [TheMealDB](https://www.themealdb.com) :

| Commande | Fichier | Rôle |
| --- | --- | --- |
| `npm run import:themealdb` | `scripts/import-themealdb.mjs` | Récupère les recettes, écarte celles qui ne sont pas kasher, fait traduire et préparer les autres par Claude, et les range en brouillons. |
| `npm run review:themealdb` | `scripts/review-themealdb.mjs`, `scripts/themealdb/review.html` | Page locale pour relire, corriger, approuver ou rejeter les brouillons. |
| `npm run import:themealdb -- --publish` | `scripts/import-themealdb.mjs` | Copie les brouillons approuvés dans `catalog/recipes.json`. |

Le filtre kasher est dans `scripts/themealdb/kosher.mjs`, et les contrôles avant publication dans `scripts/themealdb/drafts.mjs`.

## Déjà dans le catalogue

Cinq recettes TheMealDB ont été ajoutées à la main, sans passer par le script : Poulet rôti à l’algérienne (53280), Falafels à la poêle (53266), Haricots verts syriens à l’huile d’olive (53092), Oukha (53079) et Gâteau au chocolat (52776). Elles sont dans `catalog/recipes.json` (identifiants `mealdb-<numéro>`) et notées `approved` dans `imports/themealdb/drafts.json`. Le script ne les retraduit donc pas, et `--publish` les garde. Pour repartir de zéro, supprime `imports/themealdb/` et les recettes `mealdb-` de `catalog/recipes.json`.

## Ce qu'il faut

- **Node.js 20 ou plus récent** : `node -v` pour vérifier, sinon https://nodejs.org (version LTS).
- **Le projet**, avec les dépendances installées :
  ```bash
  git clone https://github.com/IllanaBensoussan/RestoRepo.git
  cd RestoRepo
  npm install
  ```
  Tant que la pull request n'est pas fusionnée, ajoute `git checkout claude/vibrant-lamport-lhi8s2` avant `npm install`.
- **Une clé Anthropic** pour l'étape 3 seulement. Elle se crée sur https://console.anthropic.com, dans **API Keys**, avec un peu de crédit dans **Billing**. Garde-la hors du projet : ne la mets dans aucun fichier.
- **Un accès internet** à `www.themealdb.com` et `api.anthropic.com`.

## 1. Tests automatiques (sans internet ni clé)

```bash
npm test
```

Attendu : tous les tests passent, dont `scripts/themealdb/kosher.test.mjs`. Ces tests vérifient que le filtre :

- garde du poulet sans produit laitier, et du poisson avec du beurre ;
- ne se laisse pas tromper par le lait de coco, le beurre de cacahuète, les haricots beurre ou l'orange sanguine ;
- écarte le bacon, les crevettes, la gélatine, le suif et les recettes de la catégorie Pork ;
- écarte les saucisses sans précision, mais garde les saucisses de bœuf ;
- écarte viande et fromage, bouillon de poulet et beurre, et bœuf avec sauce Worcestershire (qui contient des anchois).

## 2. Récupération et filtre (sans clé, gratuit)

```bash
npm run import:themealdb -- --dry-run
```

Attendu :

- le terminal affiche le nombre de recettes trouvées, le nombre de recettes écartées et le nombre restant à traduire ;
- `imports/themealdb/excluded.json` liste chaque recette écartée avec la raison (par exemple `"meat with dairy: Minced Beef + Cheddar Cheese"`).

À vérifier à la main : ouvre `excluded.json` et parcours une dizaine de recettes. Chaque raison doit être juste. Note toute recette kasher écartée à tort, ou toute recette non kasher qui ne figure pas dans la liste.

## 3. Brouillons sur 5 recettes (avec clé, quelques centimes)

Mac / Linux :

```bash
ANTHROPIC_API_KEY=sk-ant-xxxx npm run import:themealdb -- --limit 5
```

Windows (PowerShell) :

```powershell
$env:ANTHROPIC_API_KEY="sk-ant-xxxx"
npm run import:themealdb -- --limit 5
```

Attendu :

- une ligne par recette, qui finit par `pending`, `needs-ingredients` ou `excluded (…)` ;
- les brouillons sont rangés dans `imports/themealdb/drafts.json` ;
- relancer la même commande ne retraduit pas les recettes déjà traitées, mais passe aux 5 suivantes.

Si une ligne commence par `[skip]`, le message indique la cause (clé invalide, crédit épuisé, réponse refusée…). La recette sera retentée au prochain lancement.

Pour refaire un brouillon précis : `npm run import:themealdb -- --redo 52772` (avec la clé).

## 4. Relecture

```bash
npm run review:themealdb
```

Puis ouvre http://localhost:5174. Pour arrêter : `Ctrl+C` dans le terminal.

À vérifier :

- [ ] La liste à gauche montre les brouillons, et les filtres affichent les bons nombres.
- [ ] Pour une recette, l'original anglais est à gauche et la version traduite à droite.
- [ ] Les titres et les étapes sont corrects en français (tutoiement : « Fais revenir… ») et en hébreu (« מטגנים », « מוסיפים »).
- [ ] Les ingrédients correspondent à l'original, avec des quantités en nombre, en grammes ou en millilitres.
- [ ] Ajouter une étape vide puis cliquer sur **Approuver** affiche « Impossible d'approuver : une étape est vide… ».
- [ ] Après correction, **Approuver** passe à la recette suivante, et `drafts.json` contient `"status": "approved"` pour la recette approuvée.
- [ ] **Rejeter** fonctionne de la même façon, avec `"status": "rejected"`.
- [ ] Changer de recette sans enregistrer demande une confirmation.
- [ ] La page reste lisible sur un téléphone, ou dans une fenêtre étroite.

Ne lance pas l'import pendant que la page de relecture est ouverte : il écraserait ce qui vient d'être approuvé.

## 5. Publication

```bash
npm run import:themealdb -- --publish
npm test
```

Attendu :

- le terminal affiche le nombre de recettes du projet et le nombre de recettes TheMealDB ;
- `catalog/recipes.json` contient les recettes approuvées, avec des identifiants `mealdb-<numéro>` ;
- `npm test` passe toujours, car `src/catalog.test.ts` vérifie le catalogue ;
- si tu remets une recette à « À relire » puis relances `--publish`, elle disparaît de `catalog/recipes.json`.

Pour voir les recettes dans l'app : `npm run dev`, puis l'écran **Recettes**. Les recettes arrivent dans Firestore quand le changement de `catalog/recipes.json` est poussé sur la branche principale, grâce au workflow `.github/workflows/catalog.yml`.

## Si quelque chose ne marche pas

| Message | Cause probable |
| --- | --- |
| `TheMealDB answered 4xx/5xx` ou `fetch failed` | Pas d'accès à `www.themealdb.com` (réseau, proxy). |
| `authentication_error` | Clé Anthropic absente ou mal copiée. |
| `credit balance is too low` | Plus de crédit dans la console Anthropic. |
| `EADDRINUSE` au lancement de la relecture | La page tourne déjà. Ferme l'autre terminal, ou lance avec `PORT=5175`. |
| `Rien n'a été publié. Corrige d'abord…` | Une recette approuvée est incomplète. Le message dit laquelle et pourquoi. |
