# Outputs for CloudWatch Monitoring Module

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.knowledge_base_dashboard.dashboard_name}"
}

output "knowledge_base_metrics_log_group" {
  description = "Name of the Knowledge Base metrics log group"
  value       = aws_cloudwatch_log_group.knowledge_base_metrics.name
}

output "admin_audit_log_group" {
  description = "Name of the admin audit log group"
  value       = aws_cloudwatch_log_group.admin_audit.name
}

output "cloudwatch_sns_role_arn" {
  description = "ARN of the CloudWatch SNS role"
  value       = aws_iam_role.cloudwatch_sns_role.arn
}

output "alarm_arns" {
  description = "ARNs of all CloudWatch alarms"
  value = {
    bedrock_high_latency     = aws_cloudwatch_metric_alarm.bedrock_high_latency.arn
    bedrock_errors           = aws_cloudwatch_metric_alarm.bedrock_errors.arn
    chat_lambda_errors       = aws_cloudwatch_metric_alarm.chat_lambda_errors.arn
    document_lambda_errors   = aws_cloudwatch_metric_alarm.document_lambda_errors.arn
    dynamodb_throttles       = aws_cloudwatch_metric_alarm.dynamodb_throttles.arn
    kb_query_success_rate    = aws_cloudwatch_metric_alarm.kb_query_success_rate.arn
    kb_response_time         = aws_cloudwatch_metric_alarm.kb_response_time.arn
    kb_ingestion_failures    = aws_cloudwatch_metric_alarm.kb_ingestion_failures.arn
    kb_query_latency         = aws_cloudwatch_metric_alarm.kb_query_latency.arn
  }
}