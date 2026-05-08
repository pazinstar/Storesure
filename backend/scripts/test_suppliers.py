import urllib.request, json
base='http://127.0.0.1:8000'

def fetch(url):
    with urllib.request.urlopen(url) as r:
        return json.load(r)

for p in (1,2):
    try:
        j = fetch(f"{base}/api/v1/procurement/suppliers/?page={p}")
        print('PAGE',p,'count=',j.get('count'),'results=',len(j.get('results',[])),'next=',bool(j.get('next')),'prev=',bool(j.get('previous')))
    except Exception as e:
        print('PAGE',p,'error',e)

try:
    s = fetch(f"{base}/api/v1/procurement/suppliers/stats/")
    print('STATS',s)
except Exception as e:
    print('STATS error',e)
