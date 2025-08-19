# Variables for OpenSearch module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "opensearch_collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  type        = string
}

variable "bedrock_kb_role_arn" {
  description = "ARN of the IAM role for Bedrock Knowledge Base"
  type        = string
}

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}