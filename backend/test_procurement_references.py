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

print("-" * 40)
print("1. Testing GET (Empty List)")
res = client.get('/api/v1/procurement/references/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))

print("-" * 40)
print("2. Testing POST (Create Reference)")
payload = {
    "entityCode": "SCH",
    "procurementType": "Supplies",
    "description": "Computers",
    "department": "IT",
    "requestedBy": "Admin"
}
res = client.post('/api/v1/procurement/references/', payload, format='json')
print(f"Status Code: {res.status_code}")
ref_id = None
if res.status_code == 201:
    data = res.json()
    print(json.dumps(data, indent=2))
    ref_id = data.get('id')
else:
    print(f"Failed: {res.content}")

if ref_id:
    print("-" * 40)
    print(f"3. Testing PATCH (Update Status for {ref_id})")
    patch_payload = {
        "status": "Completed"
    }
    res = client.patch(f'/api/v1/procurement/references/{ref_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Failed: {res.content}")

print("-" * 40)
print("4. Testing DELETE (Clear All References)")
res = client.delete('/api/v1/procurement/references/clear/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Failed: {res.content}")

print("-" * 40)
print("5. Testing GET (Should be empty after delete)")
res = client.get('/api/v1/procurement/references/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Failed: {res.content}")
