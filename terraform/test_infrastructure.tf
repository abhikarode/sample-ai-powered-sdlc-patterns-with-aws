# RED Phase: Terraform validation tests for expected infrastructure resources
# These tests define the expected behavior before implementation

# Test 1: Verify Bedrock Knowledge Base resource exists
resource "terraform_data" "test_knowledge_base_exists" {
  lifecycle {
    postcondition {
      condition     = can(aws_bedrockagent_knowledge_base.main.id)
      error_message = "Bedrock Knowledge Base resource must be defined"
    }
  }
}

# Test 2: Verify S3 bucket for documents exists
resource "terraform_data" "test_s3_bucket_exists" {
  lifecycle {
    postcondition {
      condition     = can(aws_s3_bucket.documents.id)
      error_message = "S3 bucket for documents must be defined"
    }
  }
}

# Test 3: Verify OpenSearch Serverless collection exists
resource "terraform_data" "test_opensearch_collection_exists" {
  lifecycle {
    postcondition {
      condition     = can(aws_opensearchserverless_collection.kb_collection.id)
      error_message = "OpenSearch Serverless collection must be defined"
    }
  }
}

# Test 4: Verify Bedrock data source exists
resource "terraform_data" "test_data_source_exists" {
  lifecycle {
    postcondition {
      condition     = can(aws_bedrockagent_data_source.s3_source.id)
      error_message = "Bedrock data source must be defined"
    }
  }
}

# Test 5: Verify IAM role for Bedrock exists
resource "terraform_data" "test_bedrock_role_exists" {
  lifecycle {
    postcondition {
      condition     = can(aws_iam_role.bedrock_kb_role.arn)
      error_message = "IAM role for Bedrock Knowledge Base must be defined"
    }
  }
}

# Test 6: Verify Knowledge Base uses correct embedding model
resource "terraform_data" "test_embedding_model" {
  lifecycle {
    postcondition {
      condition = contains([
        "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v2:0"
      ], aws_bedrockagent_knowledge_base.main.knowledge_base_configuration[0].vector_knowledge_base_configuration[0].embedding_model_arn)
      error_message = "Knowledge Base must use Titan Text Embeddings V2 model"
    }
  }
}

# Test 7: Verify S3 bucket is in us-west-2 region
resource "terraform_data" "test_s3_region" {
  lifecycle {
    postcondition {
      condition     = aws_s3_bucket.documents.region == "us-west-2"
      error_message = "S3 bucket must be in us-west-2 region"
    }
  }
}

# Test 8: Verify OpenSearch collection is VECTORSEARCH type
resource "terraform_data" "test_opensearch_type" {
  lifecycle {
    postcondition {
      condition     = aws_opensearchserverless_collection.kb_collection.type == "VECTORSEARCH"
      error_message = "OpenSearch collection must be VECTORSEARCH type"
    }
  }
}