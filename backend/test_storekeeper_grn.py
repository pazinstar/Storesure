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
print("1. Testing GET GRNs (Receive History List)")
res = client.get('/api/v1/storekeeper/stores/receive/')
print(f"Status Code: {res.status_code}")

grn_id = None
if res.status_code == 200:
    results = res.json().get('results', [])
    if results:
        grn_id = results[0].get('id')
        print(f"Found existing GRN: {grn_id}")
    else:
        print("No GRNs found. Please invoke a mock seeder or create one manually for comprehensive detail test.")
else:
    print(f"Failed to fetch GRNs: {res.content}")

if grn_id:
    print("-" * 40)
    print(f"2. Testing PATCH GRN Status ({grn_id})")
    patch_payload = {
        "status": "Approved"
    }
    
    res = client.patch(f'/api/v1/storekeeper/stores/receive/{grn_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Updated GRN Status: {data.get('status')}")
    else:
        print(f"Failed to update GRN: {res.content}")
