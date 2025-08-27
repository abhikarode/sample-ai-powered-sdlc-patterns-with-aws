# Outputs for AI Assistant infrastructure

# Knowledge Base Outputs
output "knowledge_base_id" {
  description = "ID of the Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.main.id
}

output "knowledge_base_arn" {
  description = "ARN of the Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.main.arn
}

output "knowledge_base_name" {
  description = "Name of the Bedrock Knowledge Base"
  value       = aws_bedrockagent_knowledge_base.main.name
}

# Data Source Outputs
output "data_source_id" {
  description = "ID of the Bedrock data source"
  value       = aws_bedrockagent_data_source.s3_source.data_source_id
}

output "data_source_name" {
  description = "Name of the Bedrock data source"
  value       = aws_bedrockagent_data_source.s3_source.name
}

# S3 Outputs
output "documents_bucket_name" {
  description = "Name of the S3 bucket for documents"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "ARN of the S3 bucket for documents"
  value       = aws_s3_bucket.documents.arn
}

output "documents_bucket_region" {
  description = "Region of the S3 bucket"
  value       = aws_s3_bucket.documents.region
}

# OpenSearch Outputs
output "opensearch_collection_id" {
  description = "ID of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.id
}

output "opensearch_collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.arn
}

output "opensearch_collection_endpoint" {
  description = "Endpoint of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.collection_endpoint
}

output "opensearch_dashboard_endpoint" {
  description = "Dashboard endpoint of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.dashboard_endpoint
}

# IAM Outputs
output "bedrock_kb_role_arn" {
  description = "ARN of the IAM role for Bedrock Knowledge Base"
  value       = aws_iam_role.bedrock_kb_role.arn
}

output "bedrock_kb_role_name" {
  description = "Name of the IAM role for Bedrock Knowledge Base"
  value       = aws_iam_role.bedrock_kb_role.name
}

# Configuration Outputs for Lambda Functions
output "knowledge_base_config" {
  description = "Configuration object for Knowledge Base integration"
  value = {
    knowledge_base_id = aws_bedrockagent_knowledge_base.main.id
    data_source_id    = aws_bedrockagent_data_source.s3_source.data_source_id
    embedding_model   = var.embedding_model_arn
    s3_bucket        = aws_s3_bucket.documents.id
    s3_prefix        = var.documents_prefix
  }
  sensitive = false
}

# Environment Information
output "environment_info" {
  description = "Environment configuration information"
  value = {
    environment = var.environment
    region      = var.aws_region
    project     = var.project_name
  }
}

# Cognito outputs
output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.cognito.user_pool_client_id
}

output "cognito_user_pool_domain" {
  description = "Domain of the Cognito User Pool"
  value       = module.cognito.user_pool_domain
}

# API Gateway outputs
output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = module.api_gateway.api_gateway_id
}

output "api_gateway_invoke_url" {
  description = "Invoke URL of the API Gateway"
  value       = module.api_gateway.api_gateway_invoke_url
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = module.api_gateway.api_gateway_execution_arn
}

output "api_gateway_authorizer_id" {
  description = "ID of the API Gateway Cognito authorizer"
  value       = module.api_gateway.authorizer_id
}

output "api_gateway_chat_resource_id" {
  description = "ID of the API Gateway chat resource"
  value       = module.api_gateway.chat_resource_id
}

# IAM outputs
output "lambda_chat_execution_role_arn" {
  description = "ARN of the Lambda chat execution role"
  value       = module.iam.lambda_chat_execution_role_arn
}

output "lambda_document_execution_role_arn" {
  description = "ARN of the Lambda document execution role"
  value       = module.iam.lambda_document_execution_role_arn
}

output "lambda_admin_execution_role_arn" {
  description = "ARN of the Lambda admin execution role"
  value       = module.iam.lambda_admin_execution_role_arn
}

# CloudFront outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = module.cloudfront.distribution_id
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = module.cloudfront.distribution_arn
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = module.cloudfront.distribution_domain_name
}

output "cloudfront_url" {
  description = "Full CloudFront URL for the frontend"
  value       = module.cloudfront.cloudfront_url
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = module.cloudfront.frontend_bucket_name
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN for frontend assets"
  value       = module.cloudfront.frontend_bucket_arn
}

# Monitoring outputs
output "monitoring_dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = module.monitoring.dashboard_url
}

output "monitoring_sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = module.monitoring.sns_topic_arn
}

output "monitoring_alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value       = module.monitoring.alarm_arns
}

output "monitoring_log_groups" {
  description = "CloudWatch log groups for monitoring"
  value = {
    knowledge_base_metrics = module.monitoring.knowledge_base_metrics_log_group
    admin_audit           = module.monitoring.admin_audit_log_group
    monitoring_lambda     = module.monitoring_metrics_lambda.log_group_name
  }
}

# DynamoDB outputs
output "documents_table_name" {
  description = "Name of the DynamoDB documents table"
  value       = module.dynamodb.table_name
}

output "documents_table_arn" {
  description = "ARN of the DynamoDB documents table"
  value       = module.dynamodb.table_arn
}

# Complete application configuration for frontend
output "frontend_config" {
  description = "Complete configuration for React frontend"
  value = {
    # AWS Configuration
    aws_region = var.aws_region
    
    # Cognito Configuration
    cognito_user_pool_id     = module.cognito.user_pool_id
    cognito_user_pool_client_id = module.cognito.user_pool_client_id
    cognito_user_pool_domain = module.cognito.user_pool_domain
    
    # API Configuration
    api_gateway_url = module.api_gateway.api_gateway_invoke_url
    
    # CloudFront Configuration
    cloudfront_url = module.cloudfront.cloudfront_url
    
    # Environment
    environment = var.environment
    project_name = var.project_name
  }
  sensitive = false
}