output "lambda_function_arn" {
  description = "ARN of the document upload Lambda function"
  value       = aws_lambda_function.document_upload.arn
}

output "lambda_function_name" {
  description = "Name of the document upload Lambda function"
  value       = aws_lambda_function.document_upload.function_name
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the document upload Lambda function"
  value       = aws_lambda_function.document_upload.invoke_arn
}