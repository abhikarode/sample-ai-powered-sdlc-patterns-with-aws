# Variables for Cognito module

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "ai-assistant"
}

variable "callback_urls" {
  description = "List of callback URLs for the Cognito client"
  type        = list(string)
  default     = ["http://localhost:3000/callback"]
}

variable "logout_urls" {
  description = "List of logout URLs for the Cognito client"
  type        = list(string)
  default     = ["http://localhost:3000/logout"]
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