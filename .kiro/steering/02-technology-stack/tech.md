# Technology Stack

## Core Technologies

### Frontend
- **React.js**: Single Page Application (SPA) with modern hooks
- **TypeScript**: Type-safe JavaScript for frontend development
- **HTML/CSS**: Standard web technologies for UI

### Backend
- **AWS Lambda**: Serverless compute for backend services
- **Node.js/TypeScript**: Primary backend language for Lambda functions
- **Python**: Used for specific components (e.g., Bedrock integration, architecture design tools)
- **Java**: Sample applications for modernization patterns (Java 8, 17, 21)

### Data Storage
- **Amazon DynamoDB**: NoSQL database for document metadata
- **Amazon S3**: Object storage for documents and files
- **Amazon OpenSearch**: Vector database for semantic search

### AI/ML
- **Amazon Bedrock**: Foundation models (Claude, etc.)
- **Amazon Q**: Developer and Business assistants
- **Vector Embeddings**: For semantic search capabilities

## Build System

### CDK Projects
- **TypeScript-based CDK**: For infrastructure deployment
- **Package manager**: npm/yarn
- **Testing framework**: Jest

### Java Projects
- **Build system**: Maven
- **Testing**: JUnit, Cucumber

### Python Projects
- **Package manager**: pip/requirements.txt
- **Virtual environments**: venv/conda

## Common Commands

### CDK Projects

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build

# Watch for changes
npm run watch

# Run tests
npm test

# Deploy CDK stack
cdk deploy

# Synthesize CloudFormation template
cdk synth
```

### Java Applications

```bash
# Build Java application
./mvnw clean package

# Run Java application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Security checks
./mvnw dependency-check:check
```

### Python Components

```bash
# Install dependencies
pip install -r requirements.txt

# Run Python application
python app.py

# Run tests
pytest
```

## Development Environment

- **IDE**: VS Code recommended (with appropriate extensions)
- **AWS CLI**: Required for deployment and resource management
- **Docker**: Used for containerization of some components
- **Git**: Version control system

## CI/CD

- **AWS CodeBuild/CodePipeline**: For automated builds and deployments
- **GitHub Actions**: For CI/CD workflows
- **Testing**: Automated unit and integration tests
#
# Spec Development Approach

## AWS-Only Development and Testing

**CRITICAL REQUIREMENT**: All development, testing, and validation must be performed on AWS infrastructure. No local development or testing is permitted.

- All code must be deployed to AWS Lambda functions for execution
- All testing must use real AWS services (DynamoDB, S3, OpenSearch, Bedrock, etc.)
- No mocked services or local testing frameworks
- All validation must occur through deployed AWS resources
- Integration testing happens through actual AWS service interactions

## Test-Centered Development on AWS

When writing a spec you will take a test-centered approach to task planning and ordering, but all testing occurs on deployed AWS infrastructure. Think about how to organize tasks and subtasks in order to make the overall plan actionable and executable in smaller, discrete, testable units deployed to AWS.

Example: If building a client/server application, you will first write a task for building the API and deploying it to AWS Lambda, then test the API through actual AWS API Gateway endpoints. Then you will build the frontend client connection to the deployed API and test through real AWS services. Last you will build the end to end integration tests using deployed AWS resources.

This approach ensures:
- Each task is independently testable on AWS
- Progress can be verified incrementally through deployed services
- Issues are caught early using real AWS service interactions
- The implementation follows test-driven development principles on AWS
- Tasks build upon each other in a logical sequence using deployed infrastructure

## Architecture Diagrams for Design Clarification

**REQUIREMENT**: Create architecture diagrams to clarify design decisions and system interactions where needed.

- Use Mermaid diagrams for system architecture, data flow, and component interactions
- Create sequence diagrams for complex workflows and API interactions
- Generate AWS architecture diagrams using the AWS diagram MCP server when available
- Include diagrams in design documents to visualize:
  - System architecture and component relationships
  - Data flow between services
  - Authentication and authorization flows
  - Document processing pipelines
  - AI query processing workflows
- Update diagrams when system design changes during implementation

## MCP Server Utilization

**REQUIREMENT**: Leverage all available MCP (Model Context Protocol) servers where relevant to enhance development efficiency.

Available MCP servers to utilize:
- **AWS Documentation MCP**: For accessing AWS service documentation and best practices
- **AWS Diagram MCP**: For generating AWS architecture diagrams
- **Bedrock Knowledge Base MCP**: For querying AWS knowledge bases and documentation
- **EKS MCP**: For Kubernetes-related development if applicable
- **Terraform MCP**: For infrastructure as code development and validation
- **Fetch MCP**: For accessing external documentation and resources
- **Strands MCP**: For agent development patterns and tools

Usage guidelines:
- Always check available MCP servers before starting implementation tasks
- Use AWS Documentation MCP to verify service configurations and best practices
- Leverage Bedrock Knowledge Base MCP for AI/ML implementation guidance
- Utilize Terraform MCP for infrastructure validation and optimization
- Use Fetch MCP to access external libraries, frameworks, and documentation
- Apply MCP servers to reduce development time and improve code quality