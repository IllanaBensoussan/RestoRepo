# RestoFrigo

Cuisine avec ce qu'il y a vraiment dans ta cuisine. RestoFrigo garde ton frigo à jour en scannant tes tickets de caisse et classe les recettes selon ce que tu peux déjà cuisiner.

L'app est construite à partir du design system **RestoFrigo** (Claude Design) : tokens, composants (`Button`, `ExpiryBadge`, `IngredientChip`, `PantryItem`, `ReceiptScan`, `ReceiptLine`, `MatchMeter`, `RecipeCard`, `TabBar`) et écran d'accueil. Les composants sont dans `src/ds/`.

## Écrans

- **Connexion / inscription avec Google** : écran d'entrée de l'app.
- **Accueil** : salutation, état du frigo, invitation à scanner, recettes possibles, produits à utiliser vite.
- **Frigo** : produits par catégorie, triés par date de péremption.
- **Scanner** : photo (appareil photo), import photo ou PDF, ou ajout à la main. Chaque ligne lue est vérifiée avant d'entrer dans le frigo.
- **Recettes** : classées selon les ingrédients que tu as, puis selon ce qui périme en premier. Les ingrédients manquants s'ajoutent aux courses.
- **Menu de la semaine** (dans l'onglet Recettes) : un déjeuner et un dîner par jour, un déjeuner et un dîner par jour, partagé avec le foyer. On passe d'une semaine à l'autre, on choisit une recette par repas (celles qu'on peut faire avec le frigo d'abord) ou on l'ajoute depuis une recette, et un bouton met aux courses tout ce qui manque pour les repas à venir. Le menu du jour s'affiche sur l'accueil.
- **Courses** : liste de courses.

Trois langues : français, anglais et hébreu (de droite à gauche).

## Lancer l'app

```bash
npm install
cp .env.example .env   # puis remplis les clés Firebase (voir plus bas)
npm run dev
```

`npm test` lance les tests du lecteur de tickets, `npm run build` crée la version de production dans `dist/`.

## Configurer la connexion Google (Firebase)

1. Crée un projet sur https://console.firebase.google.com.
2. **Authentication > Sign-in method** : active **Google**.
3. **Authentication > Settings > Authorized domains** : ajoute le domaine où l'app est hébergée (`localhost` est déjà autorisé).
4. **Project settings > Your apps** : ajoute une app **Web** et copie `apiKey`, `authDomain`, `projectId` et `appId` dans `.env` :

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=mon-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=mon-projet
VITE_FIREBASE_APP_ID=...
```

Avec Google, se connecter et s'inscrire passent par le même bouton : Firebase crée le compte à la première connexion, et l'app affiche alors « Ton compte est créé ». Si le navigateur bloque la pop-up, l'app passe par une redirection.

### Activer la base de données (Firestore)

5. **Build > Firestore Database** : clique sur **Créer une base de données**, choisis une région proche (par exemple `europe-west1` ou `me-west1` pour Israël), en **mode production**.
6. Onglet **Règles** : remplace le contenu par celui du fichier `firestore.rules` du projet, puis **Publier**. Ou bien, depuis le terminal : `npx firebase-tools deploy --only firestore:rules --project <id-du-projet>`.

Tant que les clés ne sont pas renseignées, l'écran de connexion le signale et propose un **mode démo** sans compte.

## Notes techniques

- Vite + React 18 + TypeScript, Firebase Auth.
- Lecture des tickets : les PDF passent par `pdfjs-dist` (texte du PDF), les photos par `tesseract.js` (OCR français, anglais et hébreu). Les deux bibliothèques ne se chargent qu'au moment d'un scan. Tesseract télécharge son moteur et ses langues depuis un CDN au premier scan.
- **Données** : avec un compte Google, le frigo, les courses et la date du dernier ticket appartiennent à un **foyer**, partagé par ses membres, dans Firestore :
  - `households/{id}` contient `owner` (la personne qui l'a créé ; l'id du foyer est son uid), `lastReceiptAt` et `invite` (le code du lien d'invitation actuel) ;
  - `households/{id}/members/{uid}` contient un document par membre (nom, photo, date d'arrivée) ;
  - `households/{id}/pantry/{id}` contient un document par produit du frigo ;
  - `households/{id}/shopping/{id}` contient un document par article de courses (`addedBy` : qui l'a ajouté) ;
  - `users/{uid}` contient `householdId`, le foyer de la personne ;
  - `invites/{code}` mène au foyer qui a créé ce code.

  Tout se synchronise en direct entre les membres et leurs appareils, et l'app continue de marcher hors ligne grâce au cache de Firestore, puis rattrape à la reconnexion. Les règles (`firestore.rules`) n'autorisent que les membres d'un foyer à le lire et à le modifier. À la première connexion, chacun reçoit son propre foyer, rempli avec ce qui était déjà enregistré (l'ancien emplacement `users/{uid}/pantry` et `users/{uid}/shopping`, ou à défaut le navigateur). Le mode démo reste dans le navigateur, sans foyer.
- **Partage** :
  - **Foyer** : dans **Compte** (ou **Partager la liste** dans Courses), **Inviter quelqu'un** envoie un lien `/foyer/{code}`. La personne qui l'ouvre se connecte avec Google et rejoint le foyer : elle voit le même frigo et la même liste, en direct. Si elle avait déjà des produits, l'app propose de les apporter au frigo commun. Elle quitte alors son foyer précédent. La personne qui a créé le foyer peut retirer un membre (il retrouve son propre foyer) et **changer le lien d'invitation** (l'ancien ne marche plus). Les autres membres peuvent **quitter le foyer**.
  - **Courses** : quand quelqu'un d'autre ajoute un article, un message l'annonce, et l'article indique qui l'a ajouté. **Ranger les achetés au frigo** met les articles cochés dans le frigo du foyer.
  - **Recette** : le bouton **Partager** d'une recette envoie un lien `/recette/{id}`, qui ouvre cette recette dans l'app (après connexion si besoin).
  - Ces liens passent par la réécriture de `firebase.json`, qui sert l'app à toutes les adresses. Sur téléphone, le bouton ouvre le menu de partage (WhatsApp, SMS…) ; sinon il copie le lien.
- **Catalogue** : les ingrédients, les recettes et leurs sources sont dans Firestore, dans les collections `ingredients`, `recipes` et `sources`. L'app ne contient aucune copie : tout vient de Firestore (le cache de l'appareil prend le relais hors ligne). Chaque recette a une catégorie (`course` : entrée, plat, accompagnement, dessert, petit-déjeuner), une annotation `kashrut` (viande/lait/neutre, בשרי/חלבי/פרווה) qui doit correspondre à ses ingrédients (champ `kashrut` des ingrédients), et une `source` (id dans `sources` et lien vers la page de la recette). Tout compte connecté peut les lire, et seul le script d'import peut les modifier. Leur source est dans le dépôt, dans `catalog/ingredients.json`, `catalog/recipes.json` et `catalog/sources.json` :
  - pour ajouter ou corriger une recette ou un ingrédient, modifie ces fichiers et pousse ;
  - le workflow `.github/workflows/catalog.yml` vérifie le catalogue (`src/catalog.test.ts`), puis l'envoie dans Firestore ;
  - l'app lit Firestore et suit les changements en direct. Après une modification de `firestore.rules`, publie les règles (console Firebase, onglet **Règles**) **avant** de publier l'app qui en dépend.

  Pour une recette, `image` peut être un chemin du site ou une URL. Sans photo (`null`), l'app affiche un cadre provisoire.

### Importer des recettes de TheMealDB

`scripts/import-themealdb.mjs` ajoute au catalogue des recettes de [TheMealDB](https://www.themealdb.com), en trois temps :

1. **Brouillons** : `ANTHROPIC_API_KEY=... npm run import:themealdb` récupère toutes les recettes, écarte celles qui ne sont pas kasher, puis Claude revérifie la cacheroute, traduit en français et en hébreu, découpe les étapes, estime le temps et la difficulté, et relie chaque ingrédient au catalogue. Le résultat va dans `imports/themealdb/drafts.json`, et les recettes écartées dans `imports/themealdb/excluded.json`, avec la raison. Relancer la commande ne traite que les nouvelles recettes. Options : `-- --limit 5` pour essayer sur quelques recettes, `-- --dry-run` pour seulement récupérer et filtrer (sans Claude), `-- --redo 52772` pour refaire un brouillon.
2. **Relecture** : `npm run review:themealdb` ouvre une page sur http://localhost:5174. Pour chaque brouillon, elle montre l'original anglais à côté de la traduction, avec les points à vérifier (`notes`). Tu peux corriger les titres, les étapes (les trois langues restent alignées), les ingrédients, le temps, les portions et les étiquettes, puis **Approuver** ou **Rejeter**. Tout est enregistré dans `drafts.json`. Une recette n'est approuvée que si elle est complète. Le statut « Ingrédients manquants » signale des ingrédients absents du catalogue (`missing`) : ajoute-les à `catalog/ingredients.json` puis à la recette, ou refais le brouillon avec `--redo`. Ne lance pas l'import pendant la relecture : il écraserait ce qui vient d'être approuvé.
3. **Publication** : `npm run import:themealdb -- --publish` copie les brouillons approuvés dans `catalog/recipes.json` (identifiants `mealdb-<id>`), retire ceux qui ne sont plus approuvés et refuse de publier s'il manque une traduction ou un ingrédient. Il suffit ensuite de pousser.

Le filtre kasher (`scripts/themealdb/kosher.mjs`) écarte le porc, les fruits de mer, les poissons sans écailles, le lapin, la gélatine, le suif, les saucisses sans précision, et tout mélange de viande et de lait ou de viande et de poisson. Il juge la composition de la recette, pas la certification des produits ni l'abattage. La clé de test TheMealDB (`1`) sert par défaut. Pour une app publiée, mets ta clé dans `THEMEALDB_API_KEY`.

## Mise en ligne

Chaque push sur la branche principale construit l'app et la publie sur **https://resto-frigo.web.app** (`.github/workflows/deploy.yml`). Il faut une seule fois le secret GitHub `FIREBASE_SERVICE_ACCOUNT` : la clé JSON d'un compte de service Google Cloud qui a les rôles **Administrateur Firebase Hosting** (pour la mise en ligne) et **Utilisateur Cloud Datastore** (pour l'envoi du catalogue).

## Tester en local avec les émulateurs Firebase

Sans toucher au vrai projet : il faut Java et `firebase-tools` (`npm i -g firebase-tools`).

```bash
npm run emulators       # Auth + Firestore en local, avec les règles de firestore.rules
npm run dev:emulators   # l'app branchée sur ces émulateurs
```
