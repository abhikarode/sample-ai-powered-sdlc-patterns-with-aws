# Outputs for S3 module

output "documents_bucket_id" {
  description = "ID of the documents bucket"
  value       = aws_s3_bucket.documents.id
}

output "documents_bucket_arn" {
  description = "ARN of the documents bucket"
  value       = aws_s3_bucket.documents.arn
}

output "documents_bucket_region" {
  description = "Region of the documents bucket"
  value       = aws_s3_bucket.documents.region
}

output "documents_bucket_domain_name" {
  description = "Domain name of the documents bucket"
  value       = aws_s3_bucket.documents.bucket_domain_name
}