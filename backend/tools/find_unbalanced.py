from pathlib import Path
p=Path('backend/roles/storekeeper/stores/views.py').read_text(encoding='utf-8')
# Only look for triple double-quotes to avoid quoting complexity here
positions=[]
for i in range(len(p)):
    if p.startswith('"""',i):
        positions.append((i,'"""'))
# Print occurrences with line numbers and a short context
lines = p.splitlines()
for idx,(pos,q) in enumerate(positions):
    line_no = p.count('\n',0,pos)+1
    context = lines[line_no-1][:200]
    print(idx+1, line_no, context)

# Pair them sequentially and show start/end
print('\nPairings:')
for i in range(0, len(positions), 2):
    if i+1 < len(positions):
        a_line = p.count('\n',0,positions[i][0])+1
        b_line = p.count('\n',0,positions[i+1][0])+1
        print(f'Pair {i//2+1}: start {a_line}  end {b_line}')
    else:
        a_line = p.count('\n',0,positions[i][0])+1
        print(f'Unpaired start at {a_line}')
# Now simulate toggling
state=None
pairs=[]
for pos,q in positions:
    if state is None:
        state=(pos,q)
    else:
        pairs.append((state,(pos,q)))
        state=None
if state is not None:
    # unmatched start at state
    start=state[0]
    line = p.count('\n',0,start)+1
    print('Unmatched triple-quote at line', line)
    # print surrounding lines
    start_line = max(1,line-10)
    lines = p.splitlines()
    for ln in range(start_line, min(line+10,len(lines))+1):
        prefix = '>>' if ln==line else '  '
        print(f"{prefix} {ln:4}: {lines[ln-1]}")
else:
    print('All triple quotes balanced (even count)')
