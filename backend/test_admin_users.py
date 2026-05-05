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
print("1. Testing GET Users (Initial List)")
res = client.get('/api/v1/admin/users/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(f"Count: {res.json().get('count', 0)}")

print("-" * 40)
print("2. Testing POST (Create User)")
payload = {
    "name": "James Maina",
    "email": "jmaina@school.ac.ke",
    "role": "storekeeper",
    "department": "Stores",
    "password": "securepassword123",
    "assignedStores": ["store-1"]
}
res = client.post('/api/v1/admin/users/', payload, format='json')
print(f"Status Code: {res.status_code}")
user_id = None
if res.status_code == 201:
    data = res.json()
    print(json.dumps(data, indent=2))
    user_id = data.get('id')
    print(f"Generated ID: {user_id}")
else:
    print(f"Failed: {res.content}")

if user_id:
    print("-" * 40)
    print(f"3. Testing PATCH (Update User {user_id})")
    patch_payload = {
        "name": "James Maina Updated",
        "role": "bursar"
    }
    res = client.patch(f'/api/v1/admin/users/{user_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Failed: {res.content}")

    print("-" * 40)
    print(f"4. Testing PATCH (Toggle Status {user_id})")
    status_payload = {
        "status": "inactive"
    }
    res = client.patch(f'/api/v1/admin/users/{user_id}/', status_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(f"Status: {res.json().get('status')}")
    else:
        print(f"Failed: {res.content}")

    print("-" * 40)
    print(f"5. Testing DELETE (Delete User {user_id})")
    res = client.delete(f'/api/v1/admin/users/{user_id}/')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 204:
        print("Successfully deleted")
    else:
        print(f"Failed: {res.content}")

print("-" * 40)
print("6. Testing GET (Should reflect deletion)")
res = client.get('/api/v1/admin/users/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    results = res.json().get('results', [])
    found = any(u.get('id') == user_id for u in results)
    print(f"User {user_id} still present: {found}")
