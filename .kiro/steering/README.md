---
inclusion: always
---

# Steering Documentation Organization

This directory contains steering documents that provide guidance and constraints for the AI assistant development project. The documents are organized into logical groups for better navigation and understanding.

## Directory Structure

### 01-development-principles/
Core development methodologies and quality standards that must be followed throughout the project.

- **test-driven-development.md** - Fundamental TDD approach for all development
- **no-temporary-fixes.md** - Policy against temporary solutions and workarounds
- **task-completion-policy.md** - Standards for task completion and quality gates

### 02-technology-stack/
Technology choices, frameworks, and architectural decisions for the project.

- **tech.md** - Core technology stack (React, TypeScript, AWS services)
- **product.md** - Product overview and AWS service integration approach

### 03-testing-strategy/
Testing requirements, frameworks, and validation approaches.

- **testing-requirements.md** - Mandatory Playwright MCP usage and testing standards

### 04-infrastructure/
Infrastructure as Code requirements and AWS deployment standards.

- **terraform-iac.md** - Mandatory Terraform usage for all infrastructure
- **aws-region-requirement.md** - us-west-2 region requirement for all resources

### 05-project-structure/
Project organization, file structure, and naming conventions.

- **structure.md** - Repository organization and code structure guidelines

## Usage Guidelines

### Always Included
All steering documents are configured with `inclusion: always` and will be automatically included in every AI assistant interaction to ensure consistent guidance.

### Precedence
When steering documents conflict, follow this precedence order:
1. Development Principles (highest priority)
2. Testing Strategy
3. Infrastructure Requirements
4. Technology Stack
5. Project Structure (lowest priority)

### Updates
Steering documents should be updated as the project evolves, but changes should be carefully considered as they affect all future development work.

## Key Principles Summary

1. **Test-Driven Development**: Write tests first, always test against real AWS infrastructure
2. **No Temporary Fixes**: Implement proper solutions from the start
3. **Terraform Only**: All infrastructure must use Terraform with MCP tools
4. **Playwright MCP Only**: All UI testing must use Playwright MCP server
5. **AWS us-west-2**: All resources must be deployed in us-west-2 region
6. **Task Completion**: Never skip steps or mark incomplete tasks as done

These principles ensure consistent, high-quality development practices throughout the project lifecycle.