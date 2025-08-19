# Variables for S3 module

variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "documents_bucket_name" {
  description = "Base name for the documents bucket"
  type        = string
  default     = "documents"
}

variable "additional_tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}