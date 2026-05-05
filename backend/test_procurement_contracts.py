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
print("1. Testing GET Contracts (Empty List)")
res = client.get('/api/v1/procurement/contracts/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))

print("-" * 40)
print("2. Testing POST (Create Contract)")
payload = {
    "contractName": "Painting of Blocks A & B",
    "contractType": "Works",
    "contractorName": "ColorPro",
    "totalValue": 250000
}
res = client.post('/api/v1/procurement/contracts/', payload, format='json')
print(f"Status Code: {res.status_code}")
contract_id = None
if res.status_code == 201:
    data = res.json()
    print(json.dumps(data, indent=2))
    contract_id = data.get('id')
else:
    print(f"Failed: {res.content}")

if contract_id:
    print("-" * 40)
    print(f"3. Testing PATCH (Update Contract Status for {contract_id})")
    patch_payload = {
        "status": "Completed"
    }
    res = client.patch(f'/api/v1/procurement/contracts/{contract_id}/', patch_payload, format='json')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))
    else:
        print(f"Failed: {res.content}")
        
    print("-" * 40)
    print(f"4. Testing POST (Create Milestone for Contract {contract_id})")
    milestone_payload = {
        "description": "Initial Deposit 30%",
        "amount": 75000,
        "dueDate": "2024-05-01T00:00:00Z"
    }
    res = client.post(f'/api/v1/procurement/contracts/{contract_id}/milestones/', milestone_payload, format='json')
    print(f"Status Code: {res.status_code}")
    milestone_id = None
    if res.status_code == 201:
        data = res.json()
        print(json.dumps(data, indent=2))
        milestone_id = data.get('id')
    else:
        print(f"Failed: {res.content}")
        
    if milestone_id:
        print("-" * 40)
        print(f"5. Testing PATCH (Pay Milestone {milestone_id} for Contract {contract_id})")
        pay_payload = {
            "paidDate": "2024-04-29T10:00:00Z"
        }
        res = client.patch(f'/api/v1/procurement/contracts/{contract_id}/milestones/{milestone_id}/pay/', pay_payload, format='json')
        print(f"Status Code: {res.status_code}")
        if res.status_code == 200:
            print(json.dumps(res.json(), indent=2))
        else:
            print(f"Failed: {res.content}")
            
    print("-" * 40)
    print(f"6. Testing GET Contracts (Check payment mapping on Contract)")
    res = client.get('/api/v1/procurement/contracts/')
    print(f"Status Code: {res.status_code}")
    if res.status_code == 200:
        print(json.dumps(res.json(), indent=2))

print("-" * 40)
print("7. Testing DELETE (Clear All Contracts)")
res = client.delete('/api/v1/procurement/contracts/clear/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Failed: {res.content}")

print("-" * 40)
print("8. Testing GET (Should be empty after delete)")
res = client.get('/api/v1/procurement/contracts/')
print(f"Status Code: {res.status_code}")
if res.status_code == 200:
    print(json.dumps(res.json(), indent=2))
else:
    print(f"Failed: {res.content}")
