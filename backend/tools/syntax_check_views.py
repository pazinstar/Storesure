from pathlib import Path
p=Path('backend/roles/storekeeper/stores/views.py').read_text(encoding='utf-8')
print('len', len(p))
for q in ['"""', "'''"]:
    idxs=[i for i in range(len(p)) if p.startswith(q,i)]
    print(q, len(idxs))
    if idxs:
        for i in idxs[:10]:
            line = p.count('\n',0,i)+1
            print('  at', line)
import ast
try:
    ast.parse(p)
    print('AST OK')
except SyntaxError as e:
    print('SyntaxError', e.lineno, e.offset)
