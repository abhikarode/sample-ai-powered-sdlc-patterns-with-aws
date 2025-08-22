---
inclusion: always
---

# Steering Documentation Organization

This directory contains steering documents that provide guidance and constraints for the AI assistant development project.

## Primary Reference

### COMPACT-STEERING-GUIDE.md
**START HERE** - The essential rules and requirements in a single, easy-to-reference document. This compact guide contains all critical information needed for development and is automatically included in every AI assistant interaction.

## Detailed Documentation

### detailed/
Comprehensive documentation organized by category for deep-dive reference:

- **01-development-principles/** - TDD, task completion, code quality standards
- **02-technology-stack/** - AWS services, Claude models, Bedrock Knowledge Base
- **03-testing-strategy/** - Playwright MCP requirements and patterns
- **04-infrastructure/** - Terraform, AWS region requirements, deployment standards
- **05-project-structure/** - Repository organization and naming conventions
- **06-knowledge-base/** - Implementation lessons learned and troubleshooting

## Usage Guidelines

### Primary Workflow
1. **Start with COMPACT-STEERING-GUIDE.md** for all essential rules
2. **Reference detailed docs** only when you need comprehensive examples or troubleshooting
3. **Always follow the compact guide** - it contains all non-negotiable requirements

### Document Precedence
1. **COMPACT-STEERING-GUIDE.md** (highest priority - always applies)
2. Detailed documentation (for additional context and examples)
3. When conflicts arise, the compact guide takes precedence

### Accessing Detailed Documentation
To reference detailed docs in chat, use the context key format:
- `#detailed/01-development-principles/test-driven-development.md`
- `#detailed/06-knowledge-base/ai-assistant-implementation-knowledge.md`
- etc.

### Key Benefits of This Organization
- **Faster Development**: Essential rules always available in compact guide
- **Reduced Cognitive Load**: No information overload from detailed docs
- **Deep Reference Available**: Comprehensive examples when needed
- **Consistent Standards**: Single source of truth for critical requirements

## Quick Principles Summary

1. **Test-Driven Development**: Write tests first, always test against real AWS infrastructure
2. **No Temporary Fixes**: Implement proper solutions from the start  
3. **Terraform Only**: All infrastructure must use Terraform with MCP tools
4. **Playwright MCP Only**: All UI testing must use Playwright MCP server
5. **AWS us-west-2**: All resources must be deployed in us-west-2 region
6. **Claude Sonnet 4 Only**: No other models permitted
7. **Task Completion**: Never skip steps or mark incomplete tasks as done

**Remember**: The compact guide contains everything you need for 95% of development work. Reference detailed docs only when you need comprehensive examples or troubleshooting guidance.