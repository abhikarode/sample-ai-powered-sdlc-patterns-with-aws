# Variables for Bedrock module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "knowledge_base_name" {
  description = "Name of the Bedrock Knowledge Base"
  type        = string
}

variable "knowledge_base_description" {
  description = "Description of the Bedrock Knowledge Base"
  type        = string
}

variable "bedrock_kb_role_arn" {
  description = "ARN of the IAM role for Bedrock Knowledge Base"
  type        = string
}

variable "embedding_model_arn" {
  description = "ARN of the embedding model"
  type        = string
}

variable "embedding_dimensions" {
  description = "Dimensions for the embedding model"
  type        = number
}

variable "opensearch_collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  type        = string
}

variable "vector_index_name" {
  description = "Name of the vector index"
  type        = string
}

variable "documents_bucket_arn" {
  description = "ARN of the S3 bucket for documents"
  type        = string
}

variable "documents_prefix" {
  description = "S3 prefix for documents"
  type        = string
}

variable "chunk_max_tokens" {
  description = "Maximum tokens per chunk"
  type        = number
}

variable "chunk_overlap_percentage" {
  description = "Percentage of overlap between chunks"
  type        = number
}

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}