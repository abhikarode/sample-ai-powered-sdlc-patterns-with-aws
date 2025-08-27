# CloudFront module outputs

output "distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.frontend.id
}

output "distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.frontend.arn
}

output "distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  value       = aws_cloudfront_distribution.frontend.hosted_zone_id
}

output "distribution_status" {
  description = "CloudFront distribution status"
  value       = aws_cloudfront_distribution.frontend.status
}

output "frontend_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = aws_s3_bucket.frontend.bucket
}

output "frontend_bucket_arn" {
  description = "S3 bucket ARN for frontend assets"
  value       = aws_s3_bucket.frontend.arn
}

output "frontend_bucket_domain_name" {
  description = "S3 bucket domain name for frontend assets"
  value       = aws_s3_bucket.frontend.bucket_domain_name
}

output "frontend_bucket_regional_domain_name" {
  description = "S3 bucket regional domain name for frontend assets"
  value       = aws_s3_bucket.frontend.bucket_regional_domain_name
}

output "origin_access_control_id" {
  description = "CloudFront Origin Access Control ID"
  value       = aws_cloudfront_origin_access_control.frontend.id
}

output "response_headers_policy_id" {
  description = "CloudFront Response Headers Policy ID"
  value       = aws_cloudfront_response_headers_policy.security_headers.id
}

output "cloudfront_url" {
  description = "Full CloudFront URL for the frontend"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "log_group_name" {
  description = "CloudWatch Log Group name for CloudFront logs"
  value       = aws_cloudwatch_log_group.cloudfront_logs.name
}

output "log_group_arn" {
  description = "CloudWatch Log Group ARN for CloudFront logs"
  value       = aws_cloudwatch_log_group.cloudfront_logs.arn
}