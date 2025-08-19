# S3 resources for document storage

# S3 bucket for documents (Knowledge Base data source)
resource "aws_s3_bucket" "documents" {
  bucket = "${var.project_name}-${var.environment}-${var.documents_bucket_name}-${random_id.bucket_suffix.hex}"
  
  tags = merge(var.additional_tags, {
    Name        = "${var.project_name}-${var.environment}-documents"
    Purpose     = "Knowledge Base Data Source"
    Environment = var.environment
  })
}

# Random suffix for bucket name to ensure uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  rule {
    id     = "document_lifecycle"
    status = "Enabled"
    
    # Move to IA after 30 days
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
    
    # Move to Glacier after 90 days
    transition {
      days          = 90
      storage_class = "GLACIER"
    }
    
    # Delete old versions after 365 days
    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# S3 bucket notification for Knowledge Base sync (placeholder for future use)
resource "aws_s3_bucket_notification" "documents" {
  bucket = aws_s3_bucket.documents.id
  
  # Placeholder - will be configured when Lambda functions are added
  depends_on = [aws_s3_bucket.documents]
}