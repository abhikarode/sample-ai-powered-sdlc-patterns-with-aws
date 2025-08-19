# CloudFront module for React frontend deployment
# Provides secure, fast content delivery for the AI Assistant frontend

# S3 bucket for frontend static assets
resource "aws_s3_bucket" "frontend" {
  bucket = var.frontend_bucket_name
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-frontend"
    Purpose     = "Frontend Static Assets"
    Environment = var.environment
  })
}

# S3 bucket versioning for frontend assets
resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket server-side encryption for frontend assets
resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 bucket public access block - CloudFront will access via OAC
resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudFront Origin Access Control for S3 bucket access
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.project_name}-${var.environment}-frontend-oac"
  description                       = "Origin Access Control for ${var.project_name} frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# S3 bucket policy to allow CloudFront access via OAC
resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontend.arn
          }
        }
      }
    ]
  })
  
  depends_on = [aws_cloudfront_distribution.frontend]
}

# CloudFront distribution for React frontend
resource "aws_cloudfront_distribution" "frontend" {
  # S3 origin for static assets
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
    origin_id                = "S3-${aws_s3_bucket.frontend.bucket}"
    
    # Custom headers for security
    custom_header {
      name  = "X-Frontend-Origin"
      value = "${var.project_name}-${var.environment}"
    }
  }

  # API Gateway origin for backend API calls
  origin {
    domain_name = var.api_gateway_domain
    origin_id   = "API-Gateway"
    origin_path = "/${var.environment}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
      origin_keepalive_timeout = 5
      origin_read_timeout    = 30
    }
    
    custom_header {
      name  = "X-API-Origin"
      value = "${var.project_name}-${var.environment}"
    }
  }

  enabled             = true
  is_ipv6_enabled     = var.enable_ipv6
  comment             = "${var.project_name} ${var.environment} React Frontend Distribution"
  default_root_object = var.default_root_object
  price_class         = var.price_class

  # Default cache behavior for static assets (React app)
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Use AWS managed caching policy for SPA
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized

    # Use AWS managed origin request policy
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf" # Managed-CORS-S3Origin
    
    # Security headers policy
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behavior for API calls - no caching
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "API-Gateway"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Use AWS managed caching policy for API (no caching)
    cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad" # Managed-CachingDisabled

    # Use AWS managed origin request policy for API Gateway
    origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac" # Managed-AllViewerExceptHostHeader
  }

  # Cache behavior for static assets with long TTL
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Use AWS managed caching policy for static assets (long TTL)
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6" # Managed-CachingOptimized
  }

  # Custom error responses for SPA routing
  dynamic "custom_error_response" {
    for_each = var.custom_error_responses
    content {
      error_code            = custom_error_response.value.error_code
      response_code         = custom_error_response.value.response_code
      response_page_path    = custom_error_response.value.response_page_path
      error_caching_min_ttl = custom_error_response.value.error_caching_min_ttl
    }
  }

  # Geographic restrictions (none by default)
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Use CloudFront default certificate
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-frontend-distribution"
    Purpose     = "Frontend Content Delivery"
    Environment = var.environment
  })
}

# CloudFront Response Headers Policy for security
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "${var.project_name}-${var.environment}-security-headers"
  comment = "Security headers for ${var.project_name} frontend"

  security_headers_config {
    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      override                   = true
    }
    
    content_type_options {
      override = true
    }
    
    frame_options {
      frame_option = "DENY"
      override     = true
    }
    
    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }
  }

  custom_headers_config {
    items {
      header   = "X-Frontend-Version"
      value    = "1.0.0"
      override = true
    }
    
    items {
      header   = "X-Environment"
      value    = var.environment
      override = true
    }
  }

  cors_config {
    access_control_allow_credentials = false
    access_control_allow_headers {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "POST", "PUT", "DELETE", "HEAD", "OPTIONS"]
    }
    access_control_allow_origins {
      items = ["*"]
    }
    access_control_max_age_sec = 86400
    origin_override           = true
  }
}

# CloudWatch Log Group for CloudFront access logs (optional)
resource "aws_cloudwatch_log_group" "cloudfront_logs" {
  name              = "/aws/cloudfront/${var.project_name}-${var.environment}"
  retention_in_days = 30
  
  tags = merge(var.tags, {
    Name        = "${var.project_name}-${var.environment}-cloudfront-logs"
    Purpose     = "CloudFront Access Logs"
    Environment = var.environment
  })
}