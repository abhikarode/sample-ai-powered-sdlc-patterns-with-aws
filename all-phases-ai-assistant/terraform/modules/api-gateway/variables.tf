# Variables for API Gateway module

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ai-assistant"
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorization"
  type        = string
}

variable "stage_name" {
  description = "Name of the API Gateway stage"
  type        = string
  default     = "dev"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-2"
}

variable "allowed_origins" {
  description = "Allowed origins for CORS (comma-separated list or single origin)"
  type        = string
  default     = "https://diaxl2ky359mj.cloudfront.net"
  
  validation {
    condition     = can(regex("^https://", var.allowed_origins))
    error_message = "Allowed origins must use HTTPS protocol."
  }
}

variable "rate_limit" {
  description = "API Gateway rate limit (requests per second)"
  type        = number
  default     = 100
  
  validation {
    condition     = var.rate_limit > 0 && var.rate_limit <= 10000
    error_message = "Rate limit must be between 1 and 10000 requests per second."
  }
}

variable "burst_limit" {
  description = "API Gateway burst limit (concurrent requests)"
  type        = number
  default     = 200
  
  validation {
    condition     = var.burst_limit > 0 && var.burst_limit <= 5000
    error_message = "Burst limit must be between 1 and 5000 concurrent requests."
  }
}