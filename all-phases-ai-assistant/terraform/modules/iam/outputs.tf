# Outputs for IAM module

output "lambda_chat_execution_role_arn" {
  description = "ARN of the Lambda chat execution role"
  value       = aws_iam_role.lambda_chat_execution.arn
}

output "lambda_chat_execution_role_name" {
  description = "Name of the Lambda chat execution role"
  value       = aws_iam_role.lambda_chat_execution.name
}

output "lambda_document_execution_role_arn" {
  description = "ARN of the Lambda document execution role"
  value       = aws_iam_role.lambda_document_execution.arn
}

output "lambda_document_execution_role_name" {
  description = "Name of the Lambda document execution role"
  value       = aws_iam_role.lambda_document_execution.name
}

output "lambda_admin_execution_role_arn" {
  description = "ARN of the Lambda admin execution role"
  value       = aws_iam_role.lambda_admin_execution.arn
}

output "lambda_admin_execution_role_name" {
  description = "Name of the Lambda admin execution role"
  value       = aws_iam_role.lambda_admin_execution.name
}

output "lambda_kb_monitor_execution_role_arn" {
  description = "ARN of the Lambda Knowledge Base monitor execution role"
  value       = aws_iam_role.lambda_kb_monitor_execution.arn
}

output "lambda_kb_monitor_execution_role_name" {
  description = "Name of the Lambda Knowledge Base monitor execution role"
  value       = aws_iam_role.lambda_kb_monitor_execution.name
}