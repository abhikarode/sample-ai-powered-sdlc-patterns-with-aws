# Outputs for Admin Management Lambda Function

output "lambda_function_arn" {
  description = "ARN of the admin management Lambda function"
  value       = aws_lambda_function.admin_management.arn
}

output "lambda_function_name" {
  description = "Name of the admin management Lambda function"
  value       = aws_lambda_function.admin_management.function_name
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the admin management Lambda function"
  value       = aws_lambda_function.admin_management.invoke_arn
}

output "admin_api_resource_id" {
  description = "ID of the admin API Gateway resource"
  value       = aws_api_gateway_resource.admin.id
}

output "admin_proxy_resource_id" {
  description = "ID of the admin proxy API Gateway resource"
  value       = aws_api_gateway_resource.admin_proxy.id
}