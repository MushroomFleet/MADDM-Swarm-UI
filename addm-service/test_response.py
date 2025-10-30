"""
Test the ADDM service response
"""
import requests
import json

# Test the ADDM service with a sample request
payload = {
    'content': 'Sample LLM article about new AI developments',
    'context': '',
    'workflow_mode': 'research_assembly',
    'iteration': 0,
    'confidence_threshold': 0.85,
    'max_iterations': 20
}

try:
    response = requests.post('http://localhost:8000/api/v1/decide', json=payload)
    print(f'Status: {response.status_code}')

    if response.status_code == 200:
        data = response.json()
        print(f'Decision: {data.get("decision", "None")}')
        print(f'Confidence: {data.get("confidence", "None")}')
        print(f'Has refinement_strategy: {"refinement_strategy" in data}')
        if 'refinement_strategy' in data:
            print(f'Refinement strategy null: {data["refinement_strategy"] is None}')
            if data['refinement_strategy']:
                print(f'Refinement strategy type: {data["refinement_strategy"].get("type", "None")}')

        # Print full response for debugging
        print("\n-- Full Response --")
        print(json.dumps(data, indent=2))
    else:
        print(f'Error response: {response.text}')

except Exception as e:
    print(f'Error: {e}')
