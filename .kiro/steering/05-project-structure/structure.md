# Project Structure

This repository is organized by SDLC phases, with each phase containing multiple patterns and examples.

## Root Organization

```
/
├── all-phases/                # Cross-cutting patterns spanning multiple SDLC phases
├── cdk-common/                # Shared CDK constructs and utilities
├── deployment/                # Deployment-related patterns
├── design-and-architecture/   # Design and architecture patterns
├── implementation/            # Implementation patterns
├── operation-and-maintenance/ # Operation and maintenance patterns
├── requirement-and-planning/  # Requirement and planning patterns
└── testing/                   # Testing patterns
```

## Pattern Structure

Each pattern typically follows this structure:

```
pattern-name/
├── README.md                  # Pattern documentation and usage instructions
├── cdk/                       # Infrastructure as Code (if applicable)
│   ├── bin/                   # CDK app entry point
│   ├── lib/                   # CDK constructs and stacks
│   └── test/                  # CDK tests
├── images/                    # Documentation images
├── src/                       # Source code
│   ├── frontend/              # Frontend code (if applicable)
│   └── backend/               # Backend code (if applicable)
└── tests/                     # Tests for the pattern
```

## Key Directories

### all-phases/ai-assistant/
Complete AI assistant implementation with user stories, architecture, and implementation plan.

### cdk-common/
Shared CDK constructs for Amazon Q integration:
- `lib/amazon-q-stack.ts`: Base stack for Amazon Q Business
- `lib/amazon-q-confluence-stack.ts`: Confluence integration
- `lib/amazon-q-jira-plugin-stack.ts`: Jira plugin integration

### design-and-architecture/
- `design-solutionarchitecture-agent/`: Architecture design agent using Bedrock
- `java-modernization/`: Java application modernization patterns

### operation-and-maintenance/
- `maintain-loganalysis-cloudwatch-investigations/`: CloudWatch log analysis with Amazon Q

### requirement-and-planning/
- `amazon-q-business-requirements-analysis/`: Requirements analysis with Amazon Q Business
- `amazon-q-knowledge-management/`: Knowledge management patterns
- `plan-projectmanagement-jira-confluence/`: Project management integration

## Code Organization Conventions

1. **CDK Infrastructure**:
   - Stacks defined in `lib/` directory
   - App entry point in `bin/` directory
   - Stack constructs follow AWS best practices

2. **Lambda Functions**:
   - Organized by feature/service
   - Handler files named consistently (e.g., `index.ts`, `lambda_handler.py`)

3. **Frontend Code**:
   - Component-based organization
   - Shared utilities in common directories

4. **Documentation**:
   - README.md in each pattern directory
   - Architecture diagrams in images/ directory
   - Step-by-step instructions for deployment

## Naming Conventions

1. **Files and Directories**:
   - Kebab-case for directories: `design-and-architecture/`
   - Camel case for TypeScript/JavaScript files: `amazonQStack.ts`
   - Snake case for Python files: `lambda_handler.py`

2. **CDK Constructs**:
   - PascalCase for construct classes: `AmazonQBusinessStack`
   - Camel case for instance variables: `webEndpoint`

3. **Lambda Functions**:
   - Descriptive names indicating purpose: `documentProcessingFunction`

4. **Resources**:
   - Descriptive prefixes for AWS resources: `AmazonQBusinessApp`