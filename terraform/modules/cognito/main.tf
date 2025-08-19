# Cognito User Pool for AI Assistant Authentication
# This module creates a Cognito User Pool with email authentication and user roles

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# Cognito User Pool
resource "aws_cognito_user_pool" "ai_assistant" {
  name = "${var.project_name}-user-pool"

  # Email as username
  username_attributes = ["email"]
  
  # Auto-verify email addresses
  auto_verified_attributes = ["email"]

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Custom attributes for user roles
  schema {
    name                = "role"
    attribute_data_type = "String"
    mutable            = true
    required           = false
    
    string_attribute_constraints {
      min_length = 4
      max_length = 10
    }
  }

  # Account recovery settings
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # User pool add-ons for advanced security
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  tags = var.tags
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "ai_assistant_client" {
  name         = "${var.project_name}-client"
  user_pool_id = aws_cognito_user_pool.ai_assistant.id

  # OAuth configuration
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  
  # Callback URLs for the frontend application
  callback_urls = var.callback_urls
  logout_urls   = var.logout_urls

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = 1  # 1 hour
  id_token_validity     = 1  # 1 hour
  refresh_token_validity = 30 # 30 days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_PASSWORD_AUTH"
  ]

  # Prevent user existence errors
  prevent_user_existence_errors = "ENABLED"

  # Read and write attributes
  read_attributes = [
    "email",
    "email_verified",
    "custom:role"
  ]

  write_attributes = [
    "email",
    "custom:role"
  ]
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "ai_assistant_domain" {
  domain       = "${var.project_name}-auth-${random_string.domain_suffix.result}"
  user_pool_id = aws_cognito_user_pool.ai_assistant.id
}

# Random string for unique domain suffix
resource "random_string" "domain_suffix" {
  length  = 8
  special = false
  upper   = false
}