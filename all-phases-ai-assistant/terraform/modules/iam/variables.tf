# Variables for IAM module

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ai-assistant"
}

variable "documents_bucket_arn" {
  description = "ARN of the S3 bucket for documents"
  type        = string
}

variable "documents_table_arn" {
  description = "ARN of the DynamoDB table for document metadata"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}