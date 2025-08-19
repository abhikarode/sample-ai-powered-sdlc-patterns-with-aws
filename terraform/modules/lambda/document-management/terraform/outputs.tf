# Outputs for Document Management Lambda Function Terraform Module

output "lambda_function_arn" {
  description = "ARN of the document management Lambda function"
  value       = aws_lambda_function.document_management.arn
}

output "lambda_function_name" {
  description = "Name of the document management Lambda function"
  value       = aws_lambda_function.document_management.function_name
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the document management Lambda function"
  value       = aws_lambda_function.document_management.invoke_arn
}

output "documents_id_resource_id" {
  description = "ID of the /documents/{id} API Gateway resource"
  value       = aws_api_gateway_resource.documents_id.id
}

output "documents_status_resource_id" {
  description = "ID of the /documents/status API Gateway resource"
  value       = aws_api_gateway_resource.documents_status.id
}