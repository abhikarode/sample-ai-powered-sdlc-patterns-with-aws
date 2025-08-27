# Variables for Monitoring Metrics Lambda Module

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

variable "knowledge_base_id" {
  description = "ID of the Bedrock Knowledge Base"
  type        = string
}

variable "metrics_log_group_name" {
  description = "Name of the CloudWatch log group for metrics"
  type        = string
}

variable "audit_log_group_name" {
  description = "Name of the CloudWatch log group for audit logs"
  type        = string
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30
}