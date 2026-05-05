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
print("1. Testing GET RIAs")
res = client.get('/api/v1/storekeeper/stores/ria/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    results = res.json().get('results', [])
    print(f"Found {len(results)} RIAs.")
else:
    print(f"Failed to fetch RIAs: {res.content}")

print("-" * 40)
print("2. Testing POST (Create RIA)")
payload = {
    "department": "Science Lab",
    "costCenter": "LAB-001",
    "responsibleOfficer": "Jane Doe",
    "startDate": "2024-03-01",
    "endDate": "2024-03-31",
    "notes": "Monthly recurring supplies",
    "status": "draft",
    "items": [
        {
            "itemCode": "CHEM-01",
            "itemName": "Ethanol 95%",
            "unit": "L",
            "approvedQty": 5,
            "usedQty": 0
        }
    ]
}

res = client.post('/api/v1/storekeeper/stores/ria/', payload, format='json')
print(f"Status Code: {res.status_code}")
ria_id = None
if res.status_code == 201:
    data = res.json()
    print("Successfully created RIA:")
    print(json.dumps(data, indent=2))
    ria_id = data.get('id')
else:
    print(f"Failed to create RIA: {res.content}")

if ria_id:
    print("-" * 40)
    print(f"3. Testing PATCH (Update/Approve RIA {ria_id})")
    patch_payload = {
        "status": "active"
    }
    res = client.patch(f'/api/v1/storekeeper/stores/ria/{ria_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        data = res.json()
        print(f"Updated RIA Status: {data.get('status')}")
    else:
        print(f"Failed to update RIA: {res.content}")

    print("-" * 40)
    print(f"4. Testing DELETE RIA ({ria_id})")
    res = client.delete(f'/api/v1/storekeeper/stores/ria/{ria_id}/')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 204:
        print("Successfully deleted RIA.")
    else:
        print(f"Failed to delete RIA: {res.content}")
