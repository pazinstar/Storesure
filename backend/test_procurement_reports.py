import os
import django
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'storesure_backend.settings')
django.setup()

from django.conf import settings
if 'testserver' not in settings.ALLOWED_HOSTS:
    settings.ALLOWED_HOSTS.append('testserver')
from rest_framework.test import APIClient

client = APIClient()

endpoints = [
    ('/api/v1/procurement/reports/kpis/', 'GET'),
    ('/api/v1/procurement/reports/monthly-spend/', 'GET'),
    ('/api/v1/procurement/reports/category-breakdown/', 'GET'),
    ('/api/v1/procurement/reports/vendor-performance/', 'GET'),
    ('/api/v1/procurement/reports/standard-reports/', 'GET'),
]

for url, method in endpoints:
    print("-" * 40)
    print(f"Testing {method} {url}")
    
    if method == 'GET':
        res = client.get(url)
    else:
        res = client.post(url)
        
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Failed: {res.content}")

print("-" * 40)
print("Testing POST /api/v1/procurement/reports/generate/")
res = client.post('/api/v1/procurement/reports/generate/', {'type':'summary', 'dateRange':'q1', 'format':'pdf'})
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Failed: {res.content}")
