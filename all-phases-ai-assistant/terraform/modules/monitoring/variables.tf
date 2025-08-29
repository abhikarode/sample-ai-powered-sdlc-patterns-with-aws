# Variables for CloudWatch Monitoring Module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "alert_email_addresses" {
  description = "List of email addresses to receive alerts"
  type        = list(string)
  default     = []
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}

variable "bedrock_model_id" {
  description = "Bedrock model ID for monitoring"
  type        = string
  default     = "anthropic.claude-opus-4-1-20250805-v1:0"
}

variable "chat_lambda_function_name" {
  description = "Name of the chat Lambda function"
  type        = string
}

variable "document_lambda_function_name" {
  description = "Name of the document management Lambda function"
  type        = string
}

variable "admin_lambda_function_name" {
  description = "Name of the admin Lambda function"
  type        = string
}

variable "documents_table_name" {
  description = "Name of the DynamoDB documents table"
  type        = string
}



variable "knowledge_base_id" {
  description = "ID of the Bedrock Knowledge Base"
  type        = string
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for documents"
  type        = string
}