# Outputs for API Gateway module

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.ai_assistant.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.ai_assistant.arn
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.ai_assistant.execution_arn
}

output "api_gateway_invoke_url" {
  description = "Invoke URL of the API Gateway"
  value       = "https://${aws_api_gateway_rest_api.ai_assistant.id}.execute-api.${var.aws_region}.amazonaws.com/${var.stage_name}"
}

output "authorizer_id" {
  description = "ID of the Cognito authorizer"
  value       = aws_api_gateway_authorizer.cognito_authorizer.id
}

output "chat_resource_id" {
  description = "ID of the chat resource"
  value       = aws_api_gateway_resource.chat.id
}

output "documents_resource_id" {
  description = "ID of the documents resource"
  value       = aws_api_gateway_resource.documents.id
}

output "admin_resource_id" {
  description = "ID of the admin resource"
  value       = aws_api_gateway_resource.admin.id
}