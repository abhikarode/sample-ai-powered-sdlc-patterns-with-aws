# Outputs for OpenSearch module

output "collection_id" {
  description = "ID of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.id
}

output "collection_arn" {
  description = "ARN of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.arn
}

output "collection_endpoint" {
  description = "Endpoint of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.collection_endpoint
}

output "dashboard_endpoint" {
  description = "Dashboard endpoint of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.dashboard_endpoint
}

output "collection_name" {
  description = "Name of the OpenSearch Serverless collection"
  value       = aws_opensearchserverless_collection.kb_collection.name
}