import re
FR = {'½': .5, '¼': .25, '¾': .75, '⅓': 1/3, '⅔': 2/3, '⅛': .125}
NUM = r'(\d+\s+\d+/\d+|\d+/\d+|\d+(?:[.,]\d+)?)'
def num(s):
    s = s.strip().replace(',', '.')
    if ' ' in s:
        a, b = s.split(None, 1); return float(a) + num(b)
    if '/' in s:
        a, b = s.split('/'); return float(a) / float(b) if float(b) else None
    return float(s)
def fmt(v):
    return str(int(round(v))) if abs(v - round(v)) < 1e-6 else ('%g' % round(v, 1))
def rnd(v, unit):
    if unit in ('g', 'ml'):
        step = 50 if v >= 300 else 25 if v >= 100 else 5
        return max(step, round(v / step) * step)
    return v
def convert(measure):
    m = measure.lower().strip()
    for k, v in FR.items(): m = re.sub(r'(\d)\s*' + k, lambda x: str(int(x.group(1)) + v), m); m = m.replace(k, str(v))
    if not m or re.search(r'\b(tbsp|tbs|tblsp|tablespoons?|tsp|teaspoons?|pinch|dash|sprinkl\w*|to taste|garnish|drizzle|splash|handful|knob|few|some|as needed|for frying|for greasing)\b', m):
        return None
    g = re.search(r'(\d+)\s*x\s*' + NUM + r'\s*(g|ml)\b', m)
    if g: return fmt(rnd(int(g.group(1)) * num(g.group(2)), g.group(3))) + ' ' + g.group(3)
    g = re.search(NUM + r'\s*(kg|kilo\w*)\b', m)
    if g: return fmt(num(g.group(1))) + ' kg'
    g = re.search(NUM + r'\s*(g|gr|grams?|grammes?)\b', m)
    if g: return fmt(rnd(num(g.group(1)), 'g')) + ' g'
    g = re.search(NUM + r'\s*(ml|millilit\w*)\b', m)
    if g: return fmt(rnd(num(g.group(1)), 'ml')) + ' ml'
    g = re.search(NUM + r'\s*(l|lit\w*)\b', m)
    if g: return fmt(num(g.group(1))) + ' L'
    g = re.search(NUM + r'\s*(lb|lbs|pounds?)\b', m)
    if g: return fmt(rnd(num(g.group(1)) * 454, 'g')) + ' g'
    g = re.search(NUM + r'\s*(oz|ounces?)\b', m)
    if g: return fmt(rnd(num(g.group(1)) * 28.35, 'g')) + ' g'
    g = re.search(NUM + r'\s*(cups?|c)\b', m)
    if g: return fmt(rnd(num(g.group(1)) * 240, 'ml')) + ' ml'
    if re.search(r'\b(cans?|tins?|packets?|packs?|pkg|bunch|bunches|sticks?|jars?|bottles?|sachets?|stalks?|sheets?|slices?|pints?|quarts?|inch|cm)\b', m):
        return None
    g = re.match(r'^\s*(?:juice of |zest of |zest and juice of )?' + NUM + r'\b', m)
    if g:
        v = num(g.group(1))
        if v and v <= 50: return {0.5: '½', 0.25: '¼', 0.75: '¾'}.get(round(v, 2), fmt(v))
    return None
def merge(a, b):
    if not a: return b
    if not b: return a
    ma, mb = re.match(r'^([\d.]+) (g|ml)$', a), re.match(r'^([\d.]+) (g|ml)$', b)
    if ma and mb and ma.group(2) == mb.group(2): return fmt(float(ma.group(1)) + float(mb.group(1))) + ' ' + ma.group(2)
    return a
if __name__ == '__main__':
    for t in ['400g', '1 1/2 cups', '2 tbs', '1 large', '3 cloves', '1 lb', '8 oz', 'Juice of 1', '½ tsp', '1 can', '2 x 400g tins', '250 ml', '1.5kg', '1/2', 'Handful', '2-3', '12', '200g/7oz']:
        print(t, '->', convert(t))
