# AI Assistant - Complete Implementation

This repository contains a fully deployed AI Assistant application built with AWS services, demonstrating enterprise-grade AI-powered document management and chat capabilities using Amazon Bedrock Knowledge Base.

## 🚀 **Live Application**
- **Frontend**: https://diaxl2ky359mj.cloudfront.net
- **Status**: Fully deployed and operational in AWS us-west-2

## 🏗️ **Architecture Overview**

### **Core AWS Services**
- **Amazon Bedrock Knowledge Base** - RAG (Retrieval-Augmented Generation) with Claude Sonnet 4
- **Amazon S3** - Document storage and frontend hosting
- **Amazon OpenSearch Serverless** - Vector search for semantic document retrieval
- **Amazon DynamoDB** - Document metadata and conversation storage
- **Amazon Cognito** - User authentication and authorization
- **AWS Lambda** - Serverless backend functions (6 functions)
- **Amazon API Gateway** - REST API with Cognito integration
- **Amazon CloudFront** - Global CDN for frontend delivery
- **Amazon CloudWatch** - Monitoring, logging, and alerting

### **Application Features**
- 🤖 **AI Chat Interface** - Conversational AI with document context
- 📄 **Document Management** - Upload, view, delete documents with Knowledge Base sync
- 👥 **User Authentication** - Secure login with Cognito
- 📊 **Admin Dashboard** - System analytics and user management
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔍 **Semantic Search** - AI-powered document search and retrieval

## 📁 **Repository Structure**

```
├── terraform/                 # Infrastructure as Code (Terraform)
│   ├── main.tf               # Core infrastructure definition
│   ├── modules/              # Reusable Terraform modules
│   │   ├── api-gateway/      # API Gateway configuration
│   │   ├── cloudfront/       # CDN and frontend hosting
│   │   ├── cognito/          # Authentication
│   │   ├── dynamodb/         # Database tables
│   │   ├── iam/              # IAM roles and policies
│   │   ├── lambda/           # Lambda functions (6 functions)
│   │   └── monitoring/       # CloudWatch monitoring
│   └── environments/         # Environment-specific configs
├── frontend/                 # React TypeScript application
│   ├── src/                  # Source code
│   │   ├── components/       # React components
│   │   ├── pages/            # Application pages
│   │   ├── services/         # API integration
│   │   └── contexts/         # React contexts
│   └── tests/                # Frontend tests
├── __tests__/                # End-to-end Playwright tests
└── .kiro/                    # Development configuration
    ├── specs/                # Feature specifications
    └── steering/             # Development guidelines
```

## 🛠️ **Deployment Instructions**

### **Prerequisites**
1. AWS Account with appropriate permissions
2. AWS CLI configured with `aidlc_main` profile
3. Terraform installed
4. Node.js and npm installed

### **Quick Deploy**
```bash
# Clone repository
git clone https://github.com/abhikarode/sample-ai-powered-sdlc-patterns-with-aws.git
cd sample-ai-powered-sdlc-patterns-with-aws

# Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# Deploy frontend
cd ../frontend
npm install
npm run build
# Frontend automatically deployed to S3/CloudFront via Terraform
```

### **Environment Configuration**
All resources are deployed in **us-west-2** region using the **aidlc_main** AWS profile.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.

## Disclaimer

The sample code is provided without any guarantees, and you're not recommended to use it for production-grade workloads. The intention is to provide content to build and learn. Be sure of reading the licensing terms.

