#!/usr/bin/env python3
"""
Script to create OpenSearch Serverless vector index for Bedrock Knowledge Base
"""

import boto3
import json
import requests
from requests_aws4auth import AWS4Auth

def create_vector_index():
    # Configuration
    collection_endpoint = "https://bhp9z0d7dyxdo1yik5ej.us-west-2.aoss.amazonaws.com"
    index_name = "ai-assistant-index"
    region = "us-west-2"
    
    # Create AWS session with profile
    session = boto3.Session(profile_name='aidlc_main')
    credentials = session.get_credentials()
    
    # Create AWS4Auth for OpenSearch Serverless
    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        'aoss',
        session_token=credentials.token
    )
    
    # Index mapping for Bedrock Knowledge Base
    index_mapping = {
        "settings": {
            "index": {
                "knn": True,
                "knn.algo_param.ef_search": 512,
                "knn.algo_param.ef_construction": 512
            }
        },
        "mappings": {
            "properties": {
                "bedrock-knowledge-base-default-vector": {
                    "type": "knn_vector",
                    "dimension": 1024,
                    "method": {
                        "name": "hnsw",
                        "space_type": "l2",
                        "engine": "nmslib",
                        "parameters": {
                            "ef_construction": 512,
                            "m": 16
                        }
                    }
                },
                "AMAZON_BEDROCK_TEXT_CHUNK": {
                    "type": "text"
                },
                "AMAZON_BEDROCK_METADATA": {
                    "type": "text"
                }
            }
        }
    }
    
    # Create the index
    url = f"{collection_endpoint}/{index_name}"
    
    try:
        response = requests.put(
            url,
            auth=awsauth,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(index_mapping),
            timeout=30
        )
        
        if response.status_code in [200, 201]:
            print(f"✅ Successfully created index '{index_name}'")
            print(f"Response: {response.text}")
            return True
        else:
            print(f"❌ Failed to create index. Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating index: {str(e)}")
        return False

if __name__ == "__main__":
    print("Creating OpenSearch Serverless vector index for Bedrock Knowledge Base...")
    success = create_vector_index()
    exit(0 if success else 1)