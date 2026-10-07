# RestoFrigo

Cuisine avec ce qu'il y a vraiment dans ta cuisine. RestoFrigo garde ton frigo à jour en scannant tes tickets de caisse et classe les recettes selon ce que tu peux déjà cuisiner.

L'app est construite à partir du design system **RestoFrigo** (Claude Design) : tokens, composants (`Button`, `ExpiryBadge`, `IngredientChip`, `PantryItem`, `ReceiptScan`, `ReceiptLine`, `MatchMeter`, `RecipeCard`, `TabBar`) et écran d'accueil. Les composants sont dans `src/ds/`.

## Écrans

- **Connexion / inscription avec Google** : écran d'entrée de l'app.
- **Accueil** : salutation, état du frigo, invitation à scanner, recettes possibles, produits à utiliser vite.
- **Frigo** : produits par catégorie, triés par date de péremption.
- **Scanner** : photo (appareil photo), import photo ou PDF, ou ajout à la main. Chaque ligne lue est vérifiée avant d'entrer dans le frigo.
- **Recettes** : classées selon les ingrédients que tu as, puis selon ce qui périme en premier. Les ingrédients manquants s'ajoutent aux courses.
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

Tant que les clés ne sont pas renseignées, l'écran de connexion le signale et propose un **mode démo** sans compte.

## Notes techniques

- Vite + React 18 + TypeScript, Firebase Auth.
- Lecture des tickets : les PDF passent par `pdfjs-dist` (texte du PDF), les photos par `tesseract.js` (OCR français, anglais et hébreu). Les deux bibliothèques ne se chargent qu'au moment d'un scan. Tesseract télécharge son moteur et ses langues depuis un CDN au premier scan.
- Les données (frigo, courses) sont enregistrées dans le navigateur, séparément pour chaque compte Google. Pour synchroniser entre appareils, la prochaine étape serait de les déplacer dans Firestore.
