# CloudFront module variables for React frontend deployment

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "frontend_bucket_name" {
  description = "Name of the S3 bucket for frontend assets"
  type        = string
}

variable "api_gateway_domain" {
  description = "Domain name of the API Gateway"
  type        = string
}

variable "cognito_domain" {
  description = "Cognito User Pool domain"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200", 
      "PriceClass_100"
    ], var.price_class)
    error_message = "Price class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}

variable "enable_ipv6" {
  description = "Enable IPv6 for CloudFront distribution"
  type        = bool
  default     = true
}

variable "default_root_object" {
  description = "Default root object for CloudFront distribution"
  type        = string
  default     = "index.html"
}

variable "custom_error_responses" {
  description = "Custom error responses for SPA routing"
  type = list(object({
    error_code         = number
    response_code      = number
    response_page_path = string
    error_caching_min_ttl = number
  }))
  default = [
    {
      error_code         = 403
      response_code      = 200
      response_page_path = "/index.html"
      error_caching_min_ttl = 0
    },
    {
      error_code         = 404
      response_code      = 200
      response_page_path = "/index.html"
      error_caching_min_ttl = 0
    }
  ]
}