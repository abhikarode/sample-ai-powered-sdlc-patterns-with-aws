# Provider configuration for chat handler Lambda function
# CRITICAL: Must use us-west-2 region and aidlc_main profile as per steering requirements

# AWS Provider configuration - MUST use us-west-2 and aidlc_main profile
provider "aws" {
  region  = "us-west-2"
  profile = "aidlc_main"
  
  default_tags {
    tags = {
      Project     = "ai-assistant"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  }
}