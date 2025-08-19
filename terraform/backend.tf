# Backend configuration for Terraform state management
# This will be configured during terraform init

terraform {
  # Remove the backend block for now - we'll configure it separately
  # backend "s3" {
  #   # Configuration will be provided via backend config file
  # }
}

# For now, use local backend for development
# In production, this should be configured with S3 backend