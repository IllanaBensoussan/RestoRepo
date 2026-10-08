// UI copy. French is the reference; English and Hebrew are written from it.
export type Lang = 'fr' | 'en' | 'he';
export const LANGS: Lang[] = ['fr', 'en', 'he'];
export const LANG_NAMES: Record<Lang, string> = { fr: 'Français', en: 'English', he: 'עברית' };
export type L10n = Record<Lang, string>;

const fr = {
  tagline: 'Cuisine avec ce qu’il y a vraiment dans ta cuisine.',
  signIn: 'Se connecter',
  signUp: 'Créer un compte',
  signInTitle: 'Content de te revoir',
  signUpTitle: 'Bienvenue sur RestoFrigo',
  signInHint: 'Connecte-toi pour retrouver ton frigo et tes recettes.',
  signUpHint: 'Crée ton compte en un geste : ton frigo te suit sur tous tes appareils.',
  continueGoogle: 'Continuer avec Google',
  signUpGoogle: 'S’inscrire avec Google',
  noAccount: 'Pas encore de compte ?',
  haveAccount: 'Déjà un compte ?',
  legal: 'En continuant, tu acceptes que RestoFrigo utilise ton nom et ton e-mail Google pour ton compte.',
  authError: 'La connexion n’a pas abouti. Réessaie.',
  popupBlocked: 'La fenêtre de connexion a été bloquée. Autorise les pop-ups ou réessaie.',
  notConfigured: 'Connexion Google pas encore configurée : ajoute les clés Firebase dans .env (voir README).',
  demo: 'Essayer sans compte (démo)',
  loading: 'Chargement…',
  welcomeNew: 'Ton compte est créé',
  syncError: 'La synchronisation en ligne a échoué. Tes changements restent sur cet appareil pour l’instant.',
  signOut: 'Se déconnecter',
  language: 'Langue',
  account: 'Compte',
  close: 'Fermer',

  tabHome: 'Accueil', tabPantry: 'Frigo', tabScan: 'Scanner', tabRecipes: 'Recettes', tabList: 'Courses', nav: 'Navigation',
  hello: 'Bonjour {name}',
  helloSub: 'Qu’est-ce qu’on mange ce soir ?',
  statItems: 'produits au frigo',
  statSoon: 'à utiliser vite',
  statRecipes: 'recettes possibles',
  shopping: 'Des courses ?',
  lastReceipt: 'Dernier ticket : {when}',
  noReceipt: 'Scanne ton premier ticket',
  scanShort: 'Scanner',
  readyToCook: 'Prêt à cuisiner',
  almost: 'Il manque presque rien',
  seeAll: 'Tout voir',
  useSoon: 'À utiliser vite',
  myFridge: 'Mon frigo',
  nothingSoon: 'Rien ne presse : tout est frais.',

  pantryTitle: 'Mon frigo',
  pantryEmptyTitle: 'Ton frigo est vide',
  pantryEmptyHint: 'Prends une photo de ton ticket de caisse : on range tout pour toi.',
  scanReceipt: 'Scanner le ticket',
  uploadReceipt: 'Importer photo ou PDF',
  addByHand: 'Ajouter à la main',
  remove: 'Retirer',
  used: 'Utilisé',

  scanTitle: 'Scanne ton ticket',
  scanHint: 'Prends une photo de ton ticket de caisse, ou importe-le en photo ou en PDF.',
  reading: 'Lecture du ticket… {pct} %',
  readError: 'Impossible de lire ce fichier. Essaie une photo plus nette.',
  nothingFound: 'Aucun produit trouvé sur ce ticket. Ajoute-les à la main ou réessaie avec une photo plus nette.',
  reviewTitle: 'Vérifie le ticket',
  reviewHint: 'Décoche ce qui ne va pas au frigo et corrige les noms si besoin.',
  checkLine: 'À vérifier',
  keepLine: 'Garder cette ligne',
  addToFridge: 'Ajouter {n} produits au frigo',
  cancel: 'Annuler',
  added: '{n} produits ajoutés au frigo.',
  ingredientName: 'Ingrédient',
  chooseIngredient: 'Choisir un ingrédient',

  manualTitle: 'Ajouter à la main',
  quantity: 'Quantité',
  add: 'Ajouter',
  search: 'Rechercher un ingrédient',

  recipesTitle: 'Qu’est-ce qu’on mange ?',
  ingredients: 'ingrédients',
  ingr: 'ingr.',
  allInFridge: 'Tout est au frigo',
  missingToBuy: 'À acheter :',
  addedToList: '{name} ajouté aux courses.',
  steps: 'Préparation',
  youHave: 'Tu as',
  youMiss: 'Il te manque',
  addMissing: 'Ajouter le manquant aux courses',
  back: 'Retour',

  listTitle: 'Courses',
  listEmpty: 'Ta liste est vide. Ajoute les ingrédients qui manquent depuis une recette.',
  bought: 'Acheté',
  clearBought: 'Retirer les achetés',
  addItem: 'Ajouter un article',

  fresh: 'Frais', today: 'Aujourd’hui', expired: 'Périmé', days: '{n} jours', day: '1 jour',
  yesterday: 'hier', todayLower: 'aujourd’hui', daysAgo: 'il y a {n} jours',
  easy: 'Facile', medium: 'Moyen', min: 'min',
};

export type Key = keyof typeof fr;
type Dict = Record<Key, string>;

const en: Dict = {
  tagline: 'Cook with what is really in your kitchen.',
  signIn: 'Sign in',
  signUp: 'Sign up',
  signInTitle: 'Welcome back',
  signUpTitle: 'Welcome to RestoFrigo',
  signInHint: 'Sign in to get back to your fridge and recipes.',
  signUpHint: 'Create your account in one tap: your fridge follows you on every device.',
  continueGoogle: 'Continue with Google',
  signUpGoogle: 'Sign up with Google',
  noAccount: 'No account yet?',
  haveAccount: 'Already have an account?',
  legal: 'By continuing, you let RestoFrigo use your Google name and email for your account.',
  authError: 'Sign-in didn’t go through. Try again.',
  popupBlocked: 'The sign-in window was blocked. Allow pop-ups or try again.',
  notConfigured: 'Google sign-in isn’t set up yet: add the Firebase keys to .env (see README).',
  demo: 'Try without an account (demo)',
  loading: 'Loading…',
  welcomeNew: 'Your account is ready',
  syncError: 'Online sync failed. Your changes are kept on this device for now.',
  signOut: 'Sign out',
  language: 'Language',
  account: 'Account',
  close: 'Close',

  tabHome: 'Home', tabPantry: 'Fridge', tabScan: 'Scan', tabRecipes: 'Recipes', tabList: 'Shopping', nav: 'Navigation',
  hello: 'Hi {name}',
  helloSub: 'What’s for dinner tonight?',
  statItems: 'items in the fridge',
  statSoon: 'to use soon',
  statRecipes: 'recipes you can cook',
  shopping: 'Been shopping?',
  lastReceipt: 'Last receipt: {when}',
  noReceipt: 'Scan your first receipt',
  scanShort: 'Scan',
  readyToCook: 'Ready to cook',
  almost: 'Almost there',
  seeAll: 'See all',
  useSoon: 'Use soon',
  myFridge: 'My fridge',
  nothingSoon: 'Nothing urgent: everything is fresh.',

  pantryTitle: 'My fridge',
  pantryEmptyTitle: 'Your fridge is empty',
  pantryEmptyHint: 'Take a photo of your receipt and we’ll put everything away for you.',
  scanReceipt: 'Scan the receipt',
  uploadReceipt: 'Upload photo or PDF',
  addByHand: 'Add by hand',
  remove: 'Remove',
  used: 'Used up',

  scanTitle: 'Scan your receipt',
  scanHint: 'Take a photo of your receipt, or upload it as a photo or PDF.',
  reading: 'Reading the receipt… {pct}%',
  readError: 'Couldn’t read this file. Try a sharper photo.',
  nothingFound: 'No products found on this receipt. Add them by hand or try a sharper photo.',
  reviewTitle: 'Check the receipt',
  reviewHint: 'Untick what doesn’t go in the fridge and fix names if needed.',
  checkLine: 'Check this',
  keepLine: 'Keep this line',
  addToFridge: 'Add {n} items to the fridge',
  cancel: 'Cancel',
  added: '{n} items added to the fridge.',
  ingredientName: 'Ingredient',
  chooseIngredient: 'Choose an ingredient',

  manualTitle: 'Add by hand',
  quantity: 'Quantity',
  add: 'Add',
  search: 'Search for an ingredient',

  recipesTitle: 'What’s for dinner?',
  ingredients: 'ingredients',
  ingr: 'ingr.',
  allInFridge: 'All in the fridge',
  missingToBuy: 'To buy:',
  addedToList: '{name} added to shopping.',
  steps: 'Method',
  youHave: 'You have',
  youMiss: 'You’re missing',
  addMissing: 'Add missing to shopping',
  back: 'Back',

  listTitle: 'Shopping',
  listEmpty: 'Your list is empty. Add missing ingredients from a recipe.',
  bought: 'Bought',
  clearBought: 'Remove bought items',
  addItem: 'Add an item',

  fresh: 'Fresh', today: 'Today', expired: 'Expired', days: '{n} days', day: '1 day',
  yesterday: 'yesterday', todayLower: 'today', daysAgo: '{n} days ago',
  easy: 'Easy', medium: 'Medium', min: 'min',
};

const he: Dict = {
  tagline: 'מבשלים עם מה שבאמת יש במטבח.',
  signIn: 'התחברות',
  signUp: 'הרשמה',
  signInTitle: 'טוב לראות אותך שוב',
  signUpTitle: 'ברוכים הבאים ל־RestoFrigo',
  signInHint: 'התחברו כדי לחזור למקרר ולמתכונים שלכם.',
  signUpHint: 'פותחים חשבון בלחיצה אחת: המקרר שלכם זמין בכל מכשיר.',
  continueGoogle: 'המשך עם Google',
  signUpGoogle: 'הרשמה עם Google',
  noAccount: 'אין לך חשבון עדיין?',
  haveAccount: 'כבר יש לך חשבון?',
  legal: 'בהמשך, את/ה מאשר/ת ל־RestoFrigo להשתמש בשם ובאימייל של Google עבור החשבון.',
  authError: 'ההתחברות לא הצליחה. נסו שוב.',
  popupBlocked: 'חלון ההתחברות נחסם. אפשרו חלונות קופצים או נסו שוב.',
  notConfigured: 'התחברות Google עוד לא מוגדרת: הוסיפו את מפתחות Firebase לקובץ ‎.env (ראו README).',
  demo: 'לנסות בלי חשבון (הדגמה)',
  loading: 'טוען…',
  welcomeNew: 'החשבון שלך מוכן',
  syncError: 'הסנכרון נכשל. השינויים שלך נשמרים במכשיר הזה בינתיים.',
  signOut: 'התנתקות',
  language: 'שפה',
  account: 'חשבון',
  close: 'סגירה',

  tabHome: 'בית', tabPantry: 'מקרר', tabScan: 'סריקה', tabRecipes: 'מתכונים', tabList: 'קניות', nav: 'ניווט',
  hello: 'שלום {name}',
  helloSub: 'מה אוכלים הערב?',
  statItems: 'מוצרים במקרר',
  statSoon: 'לנצל בקרוב',
  statRecipes: 'מתכונים אפשריים',
  shopping: 'עשית קניות?',
  lastReceipt: 'קבלה אחרונה: {when}',
  noReceipt: 'סרקו את הקבלה הראשונה',
  scanShort: 'סריקה',
  readyToCook: 'מוכן לבישול',
  almost: 'כמעט הכול יש',
  seeAll: 'הכול',
  useSoon: 'לנצל בקרוב',
  myFridge: 'המקרר שלי',
  nothingSoon: 'אין לחץ: הכול טרי.',

  pantryTitle: 'המקרר שלי',
  pantryEmptyTitle: 'המקרר ריק',
  pantryEmptyHint: 'צלמו את הקבלה מהסופר ואנחנו נסדר הכול.',
  scanReceipt: 'סריקת קבלה',
  uploadReceipt: 'העלאת תמונה או PDF',
  addByHand: 'הוספה ידנית',
  remove: 'הסרה',
  used: 'נגמר',

  scanTitle: 'סרקו את הקבלה',
  scanHint: 'צלמו את הקבלה, או העלו אותה כתמונה או כ־PDF.',
  reading: 'קורא את הקבלה… {pct}%',
  readError: 'לא הצלחנו לקרוא את הקובץ. נסו תמונה חדה יותר.',
  nothingFound: 'לא נמצאו מוצרים בקבלה. הוסיפו ידנית או נסו תמונה חדה יותר.',
  reviewTitle: 'בדיקת הקבלה',
  reviewHint: 'בטלו את הסימון ממה שלא נכנס למקרר ותקנו שמות במידת הצורך.',
  checkLine: 'לבדוק',
  keepLine: 'לשמור שורה זו',
  addToFridge: 'הוספת {n} מוצרים למקרר',
  cancel: 'ביטול',
  added: '{n} מוצרים נוספו למקרר.',
  ingredientName: 'מרכיב',
  chooseIngredient: 'בחירת מרכיב',

  manualTitle: 'הוספה ידנית',
  quantity: 'כמות',
  add: 'הוספה',
  search: 'חיפוש מרכיב',

  recipesTitle: 'מה אוכלים?',
  ingredients: 'מרכיבים',
  ingr: 'מרכ׳',
  allInFridge: 'הכול במקרר',
  missingToBuy: 'לקנות:',
  addedToList: '{name} נוסף לקניות.',
  steps: 'אופן ההכנה',
  youHave: 'יש לך',
  youMiss: 'חסר לך',
  addMissing: 'הוספת החסר לקניות',
  back: 'חזרה',

  listTitle: 'קניות',
  listEmpty: 'הרשימה ריקה. הוסיפו מרכיבים חסרים מתוך מתכון.',
  bought: 'נקנה',
  clearBought: 'הסרת מה שנקנה',
  addItem: 'הוספת פריט',

  fresh: 'טרי', today: 'היום', expired: 'פג תוקף', days: '{n} ימים', day: 'יום אחד',
  yesterday: 'אתמול', todayLower: 'היום', daysAgo: 'לפני {n} ימים',
  easy: 'קל', medium: 'בינוני', min: 'דק׳',
};

const DICTS: Record<Lang, Dict> = { fr, en, he };

export type T = (key: Key, vars?: Record<string, string | number>) => string;

export function makeT(lang: Lang): T {
  const d = DICTS[lang];
  return (key, vars) => {
    let s = d[key] ?? fr[key];
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
    return s;
  };
}

export function detectLang(): Lang {
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'fr').slice(0, 2);
  if (nav === 'he' || nav === 'iw') return 'he';
  if (nav === 'en') return 'en';
  return 'fr';
}

const LOCALES: Record<Lang, string> = { fr: 'fr-FR', en: 'en-IL', he: 'he-IL' };

export function formatPrice(n: number, lang: Lang) {
  const v = n.toFixed(2);
  return lang === 'en' ? `₪${v}` : `${v.replace('.', ',')} ₪`;
}

export function formatDate(d: Date, lang: Lang) {
  return d.toLocaleDateString(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' });
}
