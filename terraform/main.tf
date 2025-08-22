# Main Terraform configuration for AI Assistant infrastructure
# GREEN Phase: Minimal implementation to pass validation tests

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# S3 bucket for documents (Knowledge Base data source)
resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-${var.environment}-${var.documents_bucket_name}-${random_id.suffix.hex}"
  
  tags = merge(var.additional_tags, {
    Name        = "${var.project_name}-${var.environment}-documents"
    Purpose     = "Knowledge Base Data Source"
    Environment = var.environment
  })
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  rule {
    id     = "document_lifecycle"
    status = "Enabled"
    
    # Apply to all objects
    filter {
      prefix = ""
    }
    
    # Abort incomplete multipart uploads after 7 days
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
    
    # Move to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    # Delete old versions after 365 days
    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# IAM role for Bedrock Knowledge Base
resource "aws_iam_role" "bedrock_kb_role" {
  name = "${var.project_name}-${var.environment}-bedrock-kb-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "bedrock.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
  
  tags = merge(var.additional_tags, {
    Name = "${var.project_name}-${var.environment}-bedrock-kb-role"
  })
}

# Encryption security policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_security_policy" "encryption" {
  name = "${var.project_name}-${var.environment}-encrypt"
  type = "encryption"
  
  policy = jsonencode({
    Rules = [
      {
        Resource = [
          "collection/${var.opensearch_collection_name}"
        ]
        ResourceType = "collection"
      }
    ]
    AWSOwnedKey = true
  })
}

# Network security policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_security_policy" "network" {
  name = "${var.project_name}-${var.environment}-network"
  type = "network"
  
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          ResourceType = "collection"
        },
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          ResourceType = "dashboard"
        }
      ]
      AllowFromPublic = true
    }
  ])
}

# Data access policy for OpenSearch Serverless collection
resource "aws_opensearchserverless_access_policy" "data_access" {
  name = "${var.project_name}-${var.environment}-data"
  type = "data"
  
  policy = jsonencode([
    {
      Rules = [
        {
          Resource = [
            "collection/${var.opensearch_collection_name}"
          ]
          Permission = [
            "aoss:CreateCollectionItems",
            "aoss:DeleteCollectionItems",
            "aoss:UpdateCollectionItems",
            "aoss:DescribeCollectionItems"
          ]
          ResourceType = "collection"
        },
        {
          Resource = [
            "index/${var.opensearch_collection_name}/*"
          ]
          Permission = [
            "aoss:CreateIndex",
            "aoss:DeleteIndex",
            "aoss:UpdateIndex",
            "aoss:DescribeIndex",
            "aoss:ReadDocument",
            "aoss:WriteDocument"
          ]
          ResourceType = "index"
        }
      ]
      Principal = [
        aws_iam_role.bedrock_kb_role.arn,
        data.aws_caller_identity.current.arn
      ]
    }
  ])
}

# OpenSearch Serverless collection for vector storage
resource "aws_opensearchserverless_collection" "kb_collection" {
  name = var.opensearch_collection_name
  type = "VECTORSEARCH"
  
  description = "Vector search collection for ${var.project_name} ${var.environment} Knowledge Base"
  
  tags = merge(var.additional_tags, {
    Name        = var.opensearch_collection_name
    Purpose     = "Knowledge Base Vector Storage"
    Environment = var.environment
  })
  
  depends_on = [
    aws_opensearchserverless_security_policy.encryption,
    aws_opensearchserverless_security_policy.network,
    aws_opensearchserverless_access_policy.data_access
  ]
}

# IAM policies for Bedrock Knowledge Base
resource "aws_iam_role_policy" "bedrock_kb_s3_policy" {
  name = "${var.project_name}-${var.environment}-bedrock-kb-s3-policy"
  role = aws_iam_role.bedrock_kb_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.documents.arn,
          "${aws_s3_bucket.documents.arn}/*"
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_opensearch_policy" {
  name = "${var.project_name}-${var.environment}-bedrock-kb-opensearch-policy"
  role = aws_iam_role.bedrock_kb_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "aoss:APIAccessAll"
        ]
        Resource = aws_opensearchserverless_collection.kb_collection.arn
      }
    ]
  })
}

resource "aws_iam_role_policy" "bedrock_kb_bedrock_policy" {
  name = "${var.project_name}-${var.environment}-bedrock-kb-bedrock-policy"
  role = aws_iam_role.bedrock_kb_role.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = var.embedding_model_arn
      }
    ]
  })
}

# Wait for OpenSearch collection to be fully ready
resource "time_sleep" "wait_for_opensearch" {
  depends_on = [aws_opensearchserverless_collection.kb_collection]
  create_duration = "60s"
}

# Create the vector index using AWS CLI (required for Bedrock Knowledge Base)
resource "null_resource" "create_opensearch_index" {
  depends_on = [
    time_sleep.wait_for_opensearch,
    aws_opensearchserverless_access_policy.data_access
  ]

  provisioner "local-exec" {
    command = <<-EOT
      python3 -c "
import boto3
import json
import requests
from requests_aws4auth import AWS4Auth
import sys

def manage_index():
    try:
        session = boto3.Session(profile_name='aidlc_main')
        credentials = session.get_credentials()
        
        awsauth = AWS4Auth(
            credentials.access_key,
            credentials.secret_key,
            '${var.aws_region}',
            'aoss',
            session_token=credentials.token
        )
        
        base_url = '${aws_opensearchserverless_collection.kb_collection.collection_endpoint}'
        index_url = f'{base_url}/${var.vector_index_name}'
        
        # First, try to delete existing index
        print('Attempting to delete existing index...')
        delete_response = requests.delete(index_url, auth=awsauth, timeout=30)
        if delete_response.status_code in [200, 404]:
            print('Index deleted or did not exist')
        else:
            print(f'Delete response: {delete_response.status_code} - {delete_response.text}')
        
        # Wait a moment for deletion to propagate
        import time
        time.sleep(5)
        
        # Create new index with correct configuration
        index_mapping = {
            'settings': {
                'index': {
                    'knn': True,
                    'knn.algo_param.ef_search': 512
                }
            },
            'mappings': {
                'properties': {
                    'bedrock-knowledge-base-default-vector': {
                        'type': 'knn_vector',
                        'dimension': ${var.embedding_dimensions},
                        'method': {
                            'name': 'hnsw',
                            'space_type': 'l2',
                            'engine': 'faiss',
                            'parameters': {
                                'm': 16
                            }
                        }
                    },
                    'AMAZON_BEDROCK_TEXT_CHUNK': {'type': 'text'},
                    'AMAZON_BEDROCK_METADATA': {'type': 'text'}
                }
            }
        }
        
        print('Creating new index with FAISS engine...')
        response = requests.put(index_url, auth=awsauth, headers={'Content-Type': 'application/json'}, data=json.dumps(index_mapping), timeout=30)
        
        if response.status_code in [200, 201]:
            print('Index created successfully with FAISS engine')
            sys.exit(0)
        else:
            print(f'Failed to create index: {response.status_code} - {response.text}')
            sys.exit(1)
            
    except Exception as e:
        print(f'Error: {str(e)}')
        sys.exit(1)

manage_index()
"
    EOT
  }

  triggers = {
    collection_endpoint = aws_opensearchserverless_collection.kb_collection.collection_endpoint
    index_name         = var.vector_index_name
  }
}

# Bedrock Knowledge Base
resource "aws_bedrockagent_knowledge_base" "main" {
  name        = var.knowledge_base_name
  description = var.knowledge_base_description
  role_arn    = aws_iam_role.bedrock_kb_role.arn
  
  knowledge_base_configuration {
    type = "VECTOR"
    vector_knowledge_base_configuration {
      embedding_model_arn = var.embedding_model_arn
      
      embedding_model_configuration {
        bedrock_embedding_model_configuration {
          dimensions          = var.embedding_dimensions
          embedding_data_type = "FLOAT32"
        }
      }
    }
  }
  
  storage_configuration {
    type = "OPENSEARCH_SERVERLESS"
    opensearch_serverless_configuration {
      collection_arn    = aws_opensearchserverless_collection.kb_collection.arn
      vector_index_name = var.vector_index_name
      
      field_mapping {
        vector_field   = "bedrock-knowledge-base-default-vector"
        text_field     = "AMAZON_BEDROCK_TEXT_CHUNK"
        metadata_field = "AMAZON_BEDROCK_METADATA"
      }
    }
  }
  
  tags = merge(var.additional_tags, {
    Name        = var.knowledge_base_name
    Purpose     = "AI Assistant Knowledge Base"
    Environment = var.environment
  })
  
  depends_on = [
    aws_iam_role_policy.bedrock_kb_s3_policy,
    aws_iam_role_policy.bedrock_kb_opensearch_policy,
    aws_iam_role_policy.bedrock_kb_bedrock_policy,
    null_resource.create_opensearch_index
  ]
}

# Bedrock Data Source (S3)
resource "aws_bedrockagent_data_source" "s3_source" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.main.id
  name              = "${var.project_name}-${var.environment}-s3-data-source"
  description       = "S3 data source for ${var.project_name} documents"
  
  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn         = aws_s3_bucket.documents.arn
      inclusion_prefixes = [var.documents_prefix]
    }
  }
  
  vector_ingestion_configuration {
    chunking_configuration {
      chunking_strategy = "FIXED_SIZE"
      fixed_size_chunking_configuration {
        max_tokens         = var.chunk_max_tokens
        overlap_percentage = var.chunk_overlap_percentage
      }
    }
  }
  
  data_deletion_policy = "RETAIN"
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# Cognito module for authentication
module "cognito" {
  source = "./modules/cognito"
  
  project_name = var.project_name
  aws_region   = var.aws_region
  
  # Frontend callback URLs (will be updated with CloudFront URL later)
  callback_urls = [
    "https://diaxl2ky359mj.cloudfront.net/callback",
    "http://localhost:3000/callback"
  ]
  logout_urls = [
    "https://diaxl2ky359mj.cloudfront.net/logout",
    "http://localhost:3000/logout"
  ]
  
  tags = var.additional_tags
}

# API Gateway module
module "api_gateway" {
  source = "./modules/api-gateway"
  
  project_name          = var.project_name
  aws_region           = var.aws_region
  cognito_user_pool_arn = module.cognito.user_pool_arn
  stage_name           = var.environment
  
  tags = var.additional_tags
}

# DynamoDB module for document metadata
module "dynamodb" {
  source = "./modules/dynamodb"
  
  project_name = var.project_name
  environment  = var.environment
  tags         = var.additional_tags
}

# IAM module for Lambda execution roles
module "iam" {
  source = "./modules/iam"
  
  project_name         = var.project_name
  aws_region          = var.aws_region
  documents_bucket_arn = aws_s3_bucket.documents.arn
  documents_table_arn  = module.dynamodb.table_arn
  
  tags = var.additional_tags
}

# Document Upload Lambda Function
module "document_upload_lambda" {
  source = "./modules/lambda/document-upload/terraform"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  lambda_execution_role_arn = module.iam.lambda_document_execution_role_arn
  documents_bucket_name     = aws_s3_bucket.documents.bucket
  documents_table_name      = module.dynamodb.table_name
  knowledge_base_id         = aws_bedrockagent_knowledge_base.main.id
  data_source_id           = aws_bedrockagent_data_source.s3_source.data_source_id
  
  api_gateway_id                     = module.api_gateway.api_gateway_id
  api_gateway_documents_resource_id  = module.api_gateway.documents_resource_id
  api_gateway_authorizer_id          = module.api_gateway.authorizer_id
  api_gateway_execution_arn          = module.api_gateway.api_gateway_execution_arn
  
  tags = var.additional_tags
}

# Knowledge Base Sync Monitor Lambda Function
module "kb_sync_monitor_lambda" {
  source = "./modules/lambda/kb-sync-monitor/terraform"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  lambda_execution_role_arn = module.iam.lambda_kb_monitor_execution_role_arn
  knowledge_base_id         = aws_bedrockagent_knowledge_base.main.id
  data_source_id           = aws_bedrockagent_data_source.s3_source.data_source_id
  documents_table_name      = module.dynamodb.table_name
  
  tags = var.additional_tags
}

# Document Management Lambda Function
module "document_management_lambda" {
  source = "./modules/lambda/document-management/terraform"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  lambda_execution_role_arn = module.iam.lambda_document_execution_role_arn
  documents_bucket_name     = aws_s3_bucket.documents.bucket
  documents_table_name      = module.dynamodb.table_name
  knowledge_base_id         = aws_bedrockagent_knowledge_base.main.id
  data_source_id           = aws_bedrockagent_data_source.s3_source.data_source_id
  
  api_gateway_id                     = module.api_gateway.api_gateway_id
  api_gateway_documents_resource_id  = module.api_gateway.documents_resource_id
  api_gateway_authorizer_id          = module.api_gateway.authorizer_id
  api_gateway_execution_arn          = module.api_gateway.api_gateway_execution_arn
  
  tags = var.additional_tags
}

# Chat Handler Lambda Function
module "chat_handler_lambda" {
  source = "./modules/lambda/chat-handler/terraform"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  knowledge_base_id         = aws_bedrockagent_knowledge_base.main.id
  documents_table_name      = module.dynamodb.table_name
  documents_table_arn       = module.dynamodb.table_arn
  
  api_gateway_id                = module.api_gateway.api_gateway_id
  api_gateway_chat_resource_id  = module.api_gateway.chat_resource_id
  api_gateway_authorizer_id     = module.api_gateway.authorizer_id
  api_gateway_execution_arn     = module.api_gateway.api_gateway_execution_arn
  
  log_level           = "INFO"
  enable_advanced_rag = "false"
}

# Admin Management Lambda Function
module "admin_management_lambda" {
  source = "./modules/lambda/admin-management/terraform"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  lambda_execution_role_arn = module.iam.lambda_admin_execution_role_arn
  knowledge_base_id         = aws_bedrockagent_knowledge_base.main.id
  data_source_id           = aws_bedrockagent_data_source.s3_source.data_source_id
  documents_table_name      = module.dynamodb.table_name
  
  api_gateway_id                = module.api_gateway.api_gateway_id
  api_gateway_root_resource_id  = module.api_gateway.root_resource_id
  api_gateway_authorizer_id     = module.api_gateway.authorizer_id
  api_gateway_execution_arn     = module.api_gateway.api_gateway_execution_arn
  
  log_level               = "INFO"
  audit_log_group_name    = module.monitoring.admin_audit_log_group
  metrics_log_group_name  = module.monitoring.knowledge_base_metrics_log_group
  
  tags = var.additional_tags
}

# CloudFront distribution for React frontend
module "cloudfront" {
  source = "./modules/cloudfront"
  
  project_name         = var.project_name
  environment          = var.environment
  aws_region          = var.aws_region
  frontend_bucket_name = "${var.project_name}-${var.environment}-frontend-${random_id.suffix.hex}"
  
  # Extract domain from API Gateway invoke URL
  api_gateway_domain = "${module.api_gateway.api_gateway_id}.execute-api.${var.aws_region}.amazonaws.com"
  cognito_domain     = module.cognito.user_pool_domain
  
  price_class    = "PriceClass_100"
  enable_ipv6    = true
  
  tags = var.additional_tags
}

# Monitoring Metrics Lambda Function
module "monitoring_metrics_lambda" {
  source = "./modules/lambda/monitoring-metrics"
  
  project_name    = var.project_name
  environment     = var.environment
  aws_region      = var.aws_region
  
  knowledge_base_id       = aws_bedrockagent_knowledge_base.main.id
  metrics_log_group_name  = module.monitoring.knowledge_base_metrics_log_group
  audit_log_group_name    = module.monitoring.admin_audit_log_group
  log_retention_days      = 30
}

# CloudWatch Monitoring and Alerting
module "monitoring" {
  source = "./modules/monitoring"
  
  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  
  # Alert configuration
  alert_email_addresses = var.alert_email_addresses
  log_retention_days    = 30
  
  # Resource references for monitoring
  bedrock_model_id                = "anthropic.claude-opus-4-1-20250805-v1:0"
  chat_lambda_function_name       = module.chat_handler_lambda.chat_handler_function_name
  document_lambda_function_name   = module.document_management_lambda.lambda_function_name
  admin_lambda_function_name      = module.admin_management_lambda.lambda_function_name
  documents_table_name            = module.dynamodb.table_name
  knowledge_base_id               = aws_bedrockagent_knowledge_base.main.id
  s3_bucket_name                  = aws_s3_bucket.documents.bucket
}