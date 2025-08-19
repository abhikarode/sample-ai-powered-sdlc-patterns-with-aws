# Provider configuration for AWS with profile and region requirements
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    null = {
      source  = "hashicorp/null"
      version = "~> 3.0"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.9"
    }
  }
  
  # Backend will be configured separately
  # Using local backend for development
}

# Primary AWS provider configuration
provider "aws" {
  profile = "aidlc_main"
  region  = var.aws_region
  
  default_tags {
    tags = {
      Project     = "AI-Assistant"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Additional provider for us-east-1 (for CloudFront SSL certificates if needed)
provider "aws" {
  alias   = "us_east_1"
  profile = "aidlc_main"
  region  = "us-east-1"
  
  default_tags {
    tags = {
      Project     = "AI-Assistant"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}