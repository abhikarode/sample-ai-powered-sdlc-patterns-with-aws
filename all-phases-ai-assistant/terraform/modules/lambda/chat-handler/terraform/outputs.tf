# Outputs for Chat Handler Lambda Function

output "chat_handler_function_name" {
  description = "Name of the chat handler Lambda function"
  value       = aws_lambda_function.chat_handler.function_name
}

output "chat_handler_function_arn" {
  description = "ARN of the chat handler Lambda function"
  value       = aws_lambda_function.chat_handler.arn
}

output "chat_endpoints_function_name" {
  description = "Name of the chat endpoints Lambda function"
  value       = aws_lambda_function.chat_endpoints.function_name
}

output "chat_endpoints_function_arn" {
  description = "ARN of the chat endpoints Lambda function"
  value       = aws_lambda_function.chat_endpoints.arn
}

output "chat_ask_resource_id" {
  description = "ID of the /chat/ask API Gateway resource"
  value       = aws_api_gateway_resource.chat_ask.id
}

output "chat_stream_resource_id" {
  description = "ID of the /chat/stream API Gateway resource"
  value       = aws_api_gateway_resource.chat_stream.id
}

output "chat_conversations_resource_id" {
  description = "ID of the /chat/conversations API Gateway resource"
  value       = aws_api_gateway_resource.chat_conversations.id
}

output "chat_history_resource_id" {
  description = "ID of the /chat/history API Gateway resource"
  value       = aws_api_gateway_resource.chat_history.id
}