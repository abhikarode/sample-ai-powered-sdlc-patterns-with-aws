# Outputs for Bedrock module

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

output "data_source_id" {
  description = "ID of the Bedrock data source"
  value       = aws_bedrockagent_data_source.s3_source.data_source_id
}

output "data_source_name" {
  description = "Name of the Bedrock data source"
  value       = aws_bedrockagent_data_source.s3_source.name
}