# Bedrock Knowledge Base resources

# Bedrock Knowledge Base
resource "aws_bedrockagent_knowledge_base" "main" {
  name        = var.knowledge_base_name
  description = var.knowledge_base_description
  role_arn    = var.bedrock_kb_role_arn
  
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
      collection_arn    = var.opensearch_collection_arn
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
}

# Bedrock Data Source (S3)
resource "aws_bedrockagent_data_source" "s3_source" {
  knowledge_base_id = aws_bedrockagent_knowledge_base.main.id
  name              = "${var.project_name}-${var.environment}-s3-data-source"
  description       = "S3 data source for ${var.project_name} documents"
  
  data_source_configuration {
    type = "S3"
    s3_configuration {
      bucket_arn         = var.documents_bucket_arn
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