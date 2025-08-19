# API Gateway REST API for AI Assistant
# This module creates an API Gateway with Cognito authorizer integration

# Data source for current AWS caller identity
data "aws_caller_identity" "current" {}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "ai_assistant" {
  name        = "${var.project_name}-api"
  description = "AI Assistant API Gateway with Cognito authentication"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # CORS configuration
  binary_media_types = ["application/octet-stream", "image/*"]

  tags = var.tags
}

# Cognito User Pool Authorizer
resource "aws_api_gateway_authorizer" "cognito_authorizer" {
  name                   = "${var.project_name}-cognito-authorizer"
  rest_api_id           = aws_api_gateway_rest_api.ai_assistant.id
  type                  = "COGNITO_USER_POOLS"
  provider_arns         = [var.cognito_user_pool_arn]
  identity_source       = "method.request.header.Authorization"
}

# API Gateway Resource for /chat
resource "aws_api_gateway_resource" "chat" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  parent_id   = aws_api_gateway_rest_api.ai_assistant.root_resource_id
  path_part   = "chat"
}

# API Gateway Resource for /documents
resource "aws_api_gateway_resource" "documents" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  parent_id   = aws_api_gateway_rest_api.ai_assistant.root_resource_id
  path_part   = "documents"
}

# API Gateway Resource for /admin
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  parent_id   = aws_api_gateway_rest_api.ai_assistant.root_resource_id
  path_part   = "admin"
}

# CORS Method for /chat
resource "aws_api_gateway_method" "chat_options" {
  rest_api_id   = aws_api_gateway_rest_api.ai_assistant.id
  resource_id   = aws_api_gateway_resource.chat.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# CORS Integration for /chat
resource "aws_api_gateway_integration" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# CORS Method Response for /chat
resource "aws_api_gateway_method_response" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Response for /chat
resource "aws_api_gateway_integration_response" "chat_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.chat.id
  http_method = aws_api_gateway_method.chat_options.http_method
  status_code = aws_api_gateway_method_response.chat_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Similar CORS setup for /documents
resource "aws_api_gateway_method" "documents_options" {
  rest_api_id   = aws_api_gateway_rest_api.ai_assistant.id
  resource_id   = aws_api_gateway_resource.documents.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "documents_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.documents.id
  http_method = aws_api_gateway_method.documents_options.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "documents_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.documents.id
  http_method = aws_api_gateway_method.documents_options.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "documents_options" {
  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id
  resource_id = aws_api_gateway_resource.documents.id
  http_method = aws_api_gateway_method.documents_options.http_method
  status_code = aws_api_gateway_method_response.documents_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "ai_assistant" {
  depends_on = [
    aws_api_gateway_method.chat_options,
    aws_api_gateway_integration.chat_options,
    aws_api_gateway_method.documents_options,
    aws_api_gateway_integration.documents_options,
  ]

  rest_api_id = aws_api_gateway_rest_api.ai_assistant.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.chat.id,
      aws_api_gateway_resource.documents.id,
      aws_api_gateway_resource.admin.id,
      aws_api_gateway_method.chat_options.id,
      aws_api_gateway_integration.chat_options.id,
      aws_api_gateway_method.documents_options.id,
      aws_api_gateway_integration.documents_options.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "ai_assistant" {
  deployment_id = aws_api_gateway_deployment.ai_assistant.id
  rest_api_id   = aws_api_gateway_rest_api.ai_assistant.id
  stage_name    = var.stage_name

  # Enable CloudWatch logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  # Enable X-Ray tracing
  xray_tracing_enabled = true

  tags = var.tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${var.project_name}"
  retention_in_days = 14

  tags = var.tags
}

# API Gateway Account (for CloudWatch logging)
resource "aws_api_gateway_account" "ai_assistant" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# IAM Role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.project_name}-api-gateway-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy Attachment for API Gateway CloudWatch logging
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}