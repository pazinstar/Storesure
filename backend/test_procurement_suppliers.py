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
print("1. Testing GET Suppliers")
res = client.get('/api/v1/procurement/suppliers/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(f"Count: {len(res.json().get('results', []))}")

print("-" * 40)
print("2. Testing POST (Create Supplier)")
payload = {
    "name": "Kenya Office Supplies Ltd",
    "taxPin": "P051234567A",
    "category": ["Supplies"],
    "contactPerson": "James Mwangi",
    "phone": "+254 712 345 678",
    "email": "info@kenyaoffice.co.ke",
    "physicalAddress": "Kijabe Street, Nairobi CBD",
    "county": "Nairobi",
    "status": "Active"
}
res = client.post('/api/v1/procurement/suppliers/', payload, format='json')
print(f"Status Code: {res.status_code}")
supplier_id = None
if res.status_code == 201:
    data = res.json()
    print(json.dumps(data, indent=2))
    supplier_id = data.get('id')
    print(f"Generated ID: {supplier_id}")
else:
    print(f"Failed: {res.content}")

if supplier_id:
    print("-" * 40)
    print(f"3. Testing PATCH (Update Supplier {supplier_id})")
    patch_payload = {
        "status": "Inactive",
        "notes": "Contract suspended pending review"
    }
    res = client.patch(f'/api/v1/procurement/suppliers/{supplier_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Failed: {res.content}")

    print("-" * 40)
    print(f"4. Testing DELETE (Delete Supplier {supplier_id})")
    res = client.delete(f'/api/v1/procurement/suppliers/{supplier_id}/')
    print(f"Status Code: {res.status_code}")
    if res.status_code in [200, 204]:
        print("Successfully deleted")
    else:
        print(f"Failed: {res.content}")

print("-" * 40)
print("5. Testing GET (Should reflect deletion)")
res = client.get('/api/v1/procurement/suppliers/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    results = res.json().get('results', [])
    found = any(s.get('id') == supplier_id for s in results)
    print(f"Supplier {supplier_id} still present: {found}")
