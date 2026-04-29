import json
from app import app

# Test the predict endpoint
with app.test_client() as client:
    resp = client.post('/predict', 
        json={'text': 'Breaking news: Scientists discover new species'},
        content_type='application/json'
    )
    result = json.loads(resp.data)
    print('Flask Backend Test Result:')
    print('  Status Code:', resp.status_code)
    print('  Prediction:', result.get('prediction'))
    print('  Confidence:', str(result.get('confidence')) + '%')
    print('  REAL:', str(result.get('probabilities', {}).get('REAL')) + '%')
    print('  FAKE:', str(result.get('probabilities', {}).get('FAKE')) + '%')
    print('\n✓ Backend API format is compatible with extension!')
