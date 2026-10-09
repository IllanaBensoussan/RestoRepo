import json, sys, re, glob
S, ROOT = sys.argv[1], sys.argv[2]
sys.path.insert(0, S)
from qty import convert, merge
sel = json.load(open(S + '/selected.json'))
meals = {m['idMeal']: m for m in json.load(open(S + '/all.json'))}
ns = {}; exec(open(S + '/mapping.py').read(), ns); MAP = ns['MAP']
ings = json.load(open(ROOT + '/catalog/ingredients.json'))
kind = {}
for i in ings:
    k = i.get('kashrut', 'parve')
    for key in (i['id'], i.get('group')):
        if key and kind.get(key) != 'meat': kind[key] = 'meat' if k == 'meat' else (kind.get(key) if kind.get(key) == 'dairy' and k == 'parve' else k)
FISH = {'salmon', 'white-fish', 'tuna', 'sardines', 'anchovies', 'fish-stock'}
ANIMAL = FISH | {'egg', 'honey'}
norm = lambda s: re.sub(r'\s+', ' ', s.lower().strip())
# Grams per 240 ml cup, for dry ingredients whose cups came out as millilitres.
CUP = {'flour': 125, 'sugar': 200, 'rice': 185, 'oats': 90, 'cornstarch': 120, 'cocoa': 100, 'almonds': 100, 'coconut': 85, 'raisins': 150,
       'couscous': 180, 'butter': 225, 'breadcrumbs': 110, 'cornmeal': 150, 'semolina': 170, 'lentils': 190, 'walnuts': 120, 'pecans': 110,
       'cashews': 130, 'peanuts': 145, 'pistachios': 125, 'hazelnuts': 135, 'pine-nuts': 135, 'chocolate': 170, 'quinoa': 170, 'bulgur': 140,
       'buckwheat': 170, 'tapioca': 150, 'rye-flour': 100, 'dried-fruit': 150, 'dried-apricots': 130, 'prunes': 150, 'sesame': 145,
       'cheese': 110, 'parmesan': 100, 'feta': 150, 'mozzarella': 110, 'white-cheese': 230, 'frozen-peas': 145, 'corn': 165, 'pasta': 100,
       'chickpeas': 165, 'kidney-beans': 175, 'black-beans': 175, 'white-beans': 175, 'cassava': 200, 'pumpkin': 250, 'spinach': 30}
def grams(ref, q):
    m = re.match(r'^([\d.]+) ml$', q or '')
    if ref in CUP and m:
        g = float(m.group(1)) / 240 * CUP[ref]
        step = 50 if g >= 300 else 25 if g >= 100 else 5
        return '%d g' % max(step, round(g / step) * step)
    return q
tr = {}
for f in sorted(glob.glob(S + '/tr/*.json')):
    for e in json.load(open(f)): tr[e['id']] = e
out, problems, todo = [], [], []
for x in sel:
    e = tr.get(x['id'])
    if not e: todo.append(x['id']); continue
    m = meals[x['id']]
    refs = {}
    for n in range(1, 21):
        nm = (m.get(f'strIngredient{n}') or '').strip()
        if not nm: continue
        ref = MAP[norm(nm)]
        if not ref: continue
        q = grams(ref, convert((m.get(f'strMeasure{n}') or '').strip()))
        refs[ref] = merge(refs.get(ref), q) if ref in refs else q
    for ref in e.get('drop', []): refs.pop(ref, None)
    for ref, q in e.get('add', {}).items(): refs[ref] = q
    for ref, q in e.get('qty', {}).items(): refs[ref] = q
    kinds = {kind[r] for r in refs}
    if 'meat' in kinds and 'dairy' in kinds: problems.append(f"{x['id']} {m['strMeal']}: meat and dairy")
    kashrut = 'meat' if 'meat' in kinds else 'dairy' if 'dairy' in kinds else 'parve'
    course = e.get('c', x['course'])
    tags = set(e.get('g', []))
    if kashrut == 'meat': tags.add('meat')
    if FISH & set(refs): tags.add('fish')
    if kashrut != 'meat' and not (FISH & set(refs)):
        tags.add('veggie')
        if kashrut == 'parve' and not (ANIMAL & set(refs)): tags.add('vegan')
    if e['m'] <= 20: tags.add('quick')
    if course == 'dessert': tags.add('sweet')
    if 'pasta' in refs or 'noodles' in refs: tags.add('pasta')
    if re.search(r'\bsoup\b', e['t'][1], re.I): tags.add('soup')
    if re.search(r'\bsalad\b', e['t'][1], re.I): tags.add('salad')
    steps = e['s']
    if not steps or any(len(s) != 3 or not all(p.strip() for p in s) for s in steps): problems.append(f"{x['id']}: bad steps")
    if len(e['t']) != 3 or not all(e['t']): problems.append(f"{x['id']}: bad title")
    if not refs: problems.append(f"{x['id']}: no ingredients")
    out.append({
        'id': f"mealdb-{x['id']}",
        'title': {'fr': e['t'][0], 'en': e['t'][1], 'he': e['t'][2]},
        'image': m['strMealThumb'],
        'course': course,
        'kashrut': kashrut,
        'source': {'id': 'themealdb', 'url': f"https://www.themealdb.com/meal/{x['id']}"},
        'minutes': e['m'],
        'difficulty': 'medium' if e['d'] == 'm' else 'easy',
        'servings': e['v'],
        'tags': [t for t in ['veggie', 'vegan', 'fish', 'meat', 'quick', 'oven', 'soup', 'salad', 'pasta', 'sweet', 'asian', 'israeli'] if t in tags],
        'ingredients': [{'ref': r, **({'qty': q} if q else {})} for r, q in refs.items()],
        'steps': {l: [s[k] for s in steps] for k, l in enumerate(['fr', 'en', 'he'])},
    })
open(ROOT + '/catalog/recipes.json', 'w').write(json.dumps(out, ensure_ascii=False, indent=1))
from collections import Counter
print('written', len(out), Counter(r['course'] for r in out), 'todo', len(todo))
print('\n'.join(problems) or 'no problems')
