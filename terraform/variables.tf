# Variables for AI Assistant Terraform configuration

variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-west-2"
  
  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "All resources must be deployed in us-west-2 region."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ai-assistant"
}

# Knowledge Base Configuration
variable "knowledge_base_name" {
  description = "Name of the Bedrock Knowledge Base"
  type        = string
  default     = "ai-assistant-knowledge-base"
}

variable "knowledge_base_description" {
  description = "Description of the Bedrock Knowledge Base"
  type        = string
  default     = "AI Assistant Knowledge Base for development team"
}

variable "embedding_model_arn" {
  description = "ARN of the embedding model for Knowledge Base"
  type        = string
  default     = "arn:aws:bedrock:us-west-2::foundation-model/amazon.titan-embed-text-v2:0"
  
  validation {
    condition = can(regex("^arn:aws:bedrock:us-west-2::foundation-model/amazon\\.titan-embed-text-v2:0$", var.embedding_model_arn))
    error_message = "Must use Titan Text Embeddings V2 model in us-west-2 region."
  }
}

variable "embedding_dimensions" {
  description = "Dimensions for the embedding model"
  type        = number
  default     = 1024
  
  validation {
    condition     = var.embedding_dimensions > 0 && var.embedding_dimensions <= 4096
    error_message = "Embedding dimensions must be between 1 and 4096."
  }
}

# S3 Configuration
variable "documents_bucket_name" {
  description = "Name of the S3 bucket for documents (will be prefixed with project and environment)"
  type        = string
  default     = "documents"
}

variable "documents_prefix" {
  description = "S3 prefix for documents in the Knowledge Base data source"
  type        = string
  default     = "documents/"
}

# OpenSearch Configuration
variable "opensearch_collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  type        = string
  default     = "ai-assistant-kb-collection"
}

variable "vector_index_name" {
  description = "Name of the vector index in OpenSearch"
  type        = string
  default     = "bedrock-knowledge-base-default-index"
}

# Chunking Configuration
variable "chunk_max_tokens" {
  description = "Maximum tokens per chunk"
  type        = number
  default     = 300
  
  validation {
    condition     = var.chunk_max_tokens >= 100 && var.chunk_max_tokens <= 8192
    error_message = "Chunk max tokens must be between 100 and 8192."
  }
}

variable "chunk_overlap_percentage" {
  description = "Percentage of overlap between chunks"
  type        = number
  default     = 20
  
  validation {
    condition     = var.chunk_overlap_percentage >= 0 && var.chunk_overlap_percentage <= 99
    error_message = "Chunk overlap percentage must be between 0 and 99."
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}