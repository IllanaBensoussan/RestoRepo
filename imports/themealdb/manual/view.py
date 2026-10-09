import json, sys, re
S = sys.argv[1]
sel = json.load(open(S + '/selected.json'))
meals = {m['idMeal']: m for m in json.load(open(S + '/all.json'))}
ns = {}; exec(open(S + '/mapping.py').read(), ns); MAP = ns['MAP']
a, b = int(sys.argv[2]), int(sys.argv[3])
norm = lambda s: re.sub(r'\s+', ' ', s.lower().strip())
for i, x in enumerate(sel[a:b], a):
    m = meals[x['id']]
    ings = []
    for n in range(1, 21):
        nm = (m.get(f'strIngredient{n}') or '').strip()
        if nm: ings.append(f"{nm} [{(m.get(f'strMeasure{n}') or '').strip()}]→{MAP[norm(nm)] or '-'}")
    instr = re.sub(r'\s*\n\s*', ' / ', (m['strInstructions'] or '').strip())
    instr = re.sub(r'(?i)step \d+ / ', '', instr)
    print(f"#{i} {x['id']} {m['strMeal']} | {m['strCategory']}/{m['strArea']} | {x['course']}")
    print('  ' + '; '.join(ings))
    print('  ' + instr)
