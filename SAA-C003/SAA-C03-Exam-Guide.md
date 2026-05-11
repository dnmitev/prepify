# AWS Certified Solutions Architect – Associate (SAA-C03)

Reference document outlining the official exam format and topic domains for the SAA-C03 certification, based on the AWS Certified Solutions Architect – Associate Exam Guide (Version 1.1) and current AWS certification listings.

---

## Exam Format & Logistics

| Item | Detail |
|---|---|
| Exam code | SAA-C03 |
| Level | Associate |
| Duration | 130 minutes |
| Questions | 65 total (50 scored, 15 unscored) |
| Question types | Multiple choice (1 correct of 4) and multiple response (2+ correct of 5+) |
| Scoring | Scaled score 100–1000 |
| Passing score | 720 |
| Cost | 150 USD (50% discount voucher available after passing any prior AWS exam) |
| Delivery | Pearson VUE testing center or online proctored |
| Recommended experience | At least 1 year of hands-on experience designing cloud solutions on AWS |
| Retake policy | 14-day wait after a failed attempt |
| Validity | 3 years |

### Scoring notes

- Unanswered questions count as incorrect — there is no penalty for guessing.
- Compensatory scoring: you don't need to pass each domain individually, only the overall exam.
- The 15 unscored questions are not identified during the exam and are used by AWS to evaluate items for future use.

---

## Content Domains & Weightings

| # | Domain | Weight |
|---|---|---|
| 1 | Design Secure Architectures | 30% |
| 2 | Design Resilient Architectures | 26% |
| 3 | Design High-Performing Architectures | 24% |
| 4 | Design Cost-Optimized Architectures | 20% |

---

## Domain 1 — Design Secure Architectures (30%)

### Task 1.1: Design secure access to AWS resources

**Knowledge of:**
- Access controls and management across multiple accounts
- AWS federated access and identity services (IAM, IAM Identity Center)
- AWS global infrastructure (Availability Zones, Regions)
- AWS security best practices (principle of least privilege)
- The AWS shared responsibility model

**Skills in:**
- Applying security best practices to IAM users and root users (e.g., MFA)
- Designing a flexible authorization model with IAM users, groups, roles, and policies
- Designing a role-based access control strategy (STS, role switching, cross-account access)
- Designing a security strategy for multiple AWS accounts (AWS Control Tower, SCPs)
- Determining appropriate use of resource policies for AWS services
- Determining when to federate a directory service with IAM roles

### Task 1.2: Design secure workloads and applications

**Knowledge of:**
- Application configuration and credentials security
- AWS service endpoints
- Controlling ports, protocols, and network traffic on AWS
- Secure application access
- Security services with appropriate use cases (Cognito, GuardDuty, Macie)
- Threat vectors external to AWS (DDoS, SQL injection)

**Skills in:**
- Designing VPC architectures with security components (security groups, route tables, NACLs, NAT gateways)
- Determining network segmentation strategies (public vs. private subnets)
- Integrating AWS services to secure applications (Shield, WAF, IAM Identity Center, Secrets Manager)
- Securing external network connections to and from AWS (VPN, Direct Connect)

### Task 1.3: Determine appropriate data security controls

**Knowledge of:**
- Data access and governance
- Data recovery
- Data retention and classification
- Encryption and appropriate key management

**Skills in:**
- Aligning AWS technologies to meet compliance requirements
- Encrypting data at rest (AWS KMS)
- Encrypting data in transit (ACM with TLS)
- Implementing access policies for encryption keys
- Implementing data backups and replications
- Implementing policies for data access, lifecycle, and protection
- Rotating encryption keys and renewing certificates

---

## Domain 2 — Design Resilient Architectures (26%)

### Task 2.1: Design scalable and loosely coupled architectures

**Knowledge of:**
- API creation and management (API Gateway, REST API)
- AWS managed services (Transfer Family, SQS, Secrets Manager)
- Caching strategies
- Microservices design principles (stateless vs. stateful)
- Event-driven architectures
- Horizontal vs. vertical scaling
- Edge accelerators (CDN)
- Application migration into containers
- Load balancing concepts (Application Load Balancer)
- Multi-tier architectures
- Queuing and messaging concepts (publish/subscribe)
- Serverless technologies and patterns (Fargate, Lambda)
- Storage types (object, file, block)
- Container orchestration (ECS, EKS)
- When to use read replicas
- Workflow orchestration (Step Functions)

**Skills in:**
- Designing event-driven, microservice, and multi-tier architectures
- Determining scaling strategies for components
- Determining AWS services needed for loose coupling
- Determining when to use containers and when to use serverless
- Recommending compute, storage, networking, and database technologies
- Using purpose-built AWS services for workloads

### Task 2.2: Design highly available and/or fault-tolerant architectures

**Knowledge of:**
- AWS global infrastructure (AZs, Regions, Route 53)
- AWS managed services (Comprehend, Polly)
- Basic networking concepts (route tables)
- Disaster recovery strategies (backup and restore, pilot light, warm standby, active-active, RPO, RTO)
- Distributed design patterns
- Failover strategies
- Immutable infrastructure
- Load balancing concepts
- Proxy concepts (RDS Proxy)
- Service quotas and throttling
- Storage options and characteristics (durability, replication)
- Workload visibility (X-Ray)

**Skills in:**
- Determining automation strategies to ensure infrastructure integrity
- Determining AWS services for HA/FT architectures across Regions or AZs
- Identifying metrics for HA solutions
- Implementing designs to mitigate single points of failure
- Implementing strategies for data durability and availability (backups)
- Selecting an appropriate DR strategy
- Using AWS services to improve reliability of legacy applications

---

## Domain 3 — Design High-Performing Architectures (24%)

### Task 3.1: Determine high-performing and/or scalable storage solutions

**Knowledge of:**
- Hybrid storage solutions
- Storage services (S3, EFS, EBS)
- Storage types (object, file, block)

**Skills in:**
- Determining storage services that meet performance demands
- Determining storage services that scale for future needs

### Task 3.2: Design high-performing and elastic compute solutions

**Knowledge of:**
- AWS compute services (Batch, EMR, Fargate)
- Distributed computing concepts
- Queuing and messaging concepts
- Scalability capabilities (EC2 Auto Scaling, AWS Auto Scaling)
- Serverless technologies and patterns (Lambda, Fargate)
- Container orchestration (ECS, EKS)

**Skills in:**
- Decoupling workloads so components scale independently
- Identifying metrics and conditions for scaling actions
- Selecting appropriate compute options and features (EC2 instance types)
- Selecting appropriate resource type and size (e.g., Lambda memory)

### Task 3.3: Determine high-performing database solutions

**Knowledge of:**
- AWS global infrastructure
- Caching strategies and services (ElastiCache)
- Data access patterns (read- vs. write-intensive)
- Database capacity planning (capacity units, instance types, Provisioned IOPS)
- Database connections and proxies
- Database engines (heterogeneous vs. homogeneous migrations)
- Database replication (read replicas)
- Database types and services (serverless, relational vs. non-relational, in-memory)

**Skills in:**
- Configuring read replicas
- Designing database architectures
- Determining appropriate database engine (e.g., MySQL vs. PostgreSQL)
- Determining appropriate database type (Aurora, DynamoDB)
- Integrating caching

### Task 3.4: Determine high-performing and/or scalable network architectures

**Knowledge of:**
- Edge networking services (CloudFront, Global Accelerator)
- Network architecture design (subnet tiers, routing, IP addressing)
- Load balancing concepts
- Network connection options (VPN, Direct Connect, PrivateLink)

**Skills in:**
- Creating network topologies (global, hybrid, multi-tier)
- Determining scalable network configurations
- Determining appropriate placement of resources
- Selecting the appropriate load balancing strategy

### Task 3.5: Determine high-performing data ingestion and transformation solutions

**Knowledge of:**
- Data analytics and visualization services (Athena, Lake Formation, QuickSight)
- Data ingestion patterns (frequency)
- Data transfer services (DataSync, Storage Gateway)
- Data transformation services (Glue)
- Secure access to ingestion access points
- Sizes and speeds for business requirements
- Streaming data services (Kinesis)

**Skills in:**
- Building and securing data lakes
- Designing data streaming architectures
- Designing data transfer solutions
- Implementing visualization strategies
- Selecting compute for data processing (EMR)
- Selecting ingestion configurations
- Transforming data between formats (e.g., CSV to Parquet)

---

## Domain 4 — Design Cost-Optimized Architectures (20%)

### Task 4.1: Design cost-optimized storage solutions

**Knowledge of:**
- Access options (S3 Requester Pays)
- AWS cost management features (cost allocation tags, multi-account billing)
- Cost management tools (Cost Explorer, Budgets, Cost and Usage Report)
- Storage services (FSx, EFS, S3, EBS)
- Backup strategies
- Block storage options (HDD vs. SSD)
- Data lifecycles
- Hybrid storage (DataSync, Transfer Family, Storage Gateway)
- Storage access patterns
- Storage tiering (cold tiering for object storage)
- Storage types (object, file, block)

**Skills in:**
- Designing storage strategies (batch vs. individual uploads to S3)
- Determining correct storage size
- Determining lowest-cost data transfer method
- Determining when storage auto scaling is required
- Managing S3 object lifecycles
- Selecting appropriate backup/archival solution
- Selecting the appropriate storage tier and data lifecycle
- Selecting the most cost-effective storage service

### Task 4.2: Design cost-optimized compute solutions

**Knowledge of:**
- AWS cost management features and tools
- AWS global infrastructure
- Purchasing options (Spot, Reserved Instances, Savings Plans)
- Distributed compute strategies (edge processing)
- Hybrid compute options (Outposts, Snowball Edge)
- Instance types, families, and sizes
- Optimization of compute utilization (containers, serverless, microservices)
- Scaling strategies (auto scaling, hibernation)

**Skills in:**
- Determining load balancing strategy (ALB vs. NLB vs. GWLB)
- Determining scaling methods (horizontal vs. vertical, EC2 hibernation)
- Determining cost-effective compute services (Lambda, EC2, Fargate)
- Determining required availability for workload classes
- Selecting the appropriate instance family and size

### Task 4.3: Design cost-optimized database solutions

**Knowledge of:**
- AWS cost management features and tools
- Caching strategies
- Data retention policies
- Database capacity planning
- Database connections and proxies
- Database engines (heterogeneous vs. homogeneous migrations)
- Database replication (read replicas)
- Database types (relational vs. non-relational, Aurora, DynamoDB)

**Skills in:**
- Designing appropriate backup and retention policies
- Determining appropriate database engine
- Determining cost-effective database services (DynamoDB vs. RDS, serverless)
- Determining cost-effective database types (time series, columnar)
- Migrating database schemas and data

### Task 4.4: Design cost-optimized network architectures

**Knowledge of:**
- AWS cost management features and tools
- Load balancing concepts
- NAT gateways (NAT instance vs. NAT gateway costs)
- Network connectivity (private lines, dedicated lines, VPNs)
- Network routing, topology, and peering (Transit Gateway, VPC peering)
- Network services (DNS)

**Skills in:**
- Configuring appropriate NAT gateway types (single shared vs. per-AZ)
- Configuring network connections (Direct Connect vs. VPN vs. internet)
- Configuring routes to minimize transfer costs (Region to Region, AZ to AZ, private to public, Global Accelerator, VPC endpoints)
- Determining strategic needs for CDNs and edge caching
- Reviewing workloads for network optimizations
- Selecting throttling strategy
- Selecting appropriate bandwidth allocation (single vs. multiple VPNs, Direct Connect speed)

---

## In-Scope AWS Services

### Analytics
Athena · Data Exchange · Data Pipeline · EMR · Glue · Kinesis · Lake Formation · MSK · OpenSearch Service · QuickSight · Redshift

### Application Integration
AppFlow · AppSync · EventBridge · MQ · SNS · SQS · Step Functions

### Cost Management
Budgets · Cost and Usage Report · Cost Explorer · Savings Plans

### Compute
Batch · EC2 · EC2 Auto Scaling · Elastic Beanstalk · Outposts · Serverless Application Repository · VMware Cloud on AWS · Wavelength

### Containers
ECS Anywhere · EKS Anywhere · EKS Distro · ECR · ECS · EKS

### Database
Aurora · Aurora Serverless · DocumentDB · DynamoDB · ElastiCache · Keyspaces · Neptune · QLDB · RDS · Redshift

### Developer Tools
X-Ray

### Front-End Web & Mobile
Amplify · API Gateway · Device Farm · Pinpoint

### Machine Learning
Comprehend · Forecast · Fraud Detector · Kendra · Lex · Polly · Rekognition · SageMaker · Textract · Transcribe · Translate

### Management & Governance
Auto Scaling · CloudFormation · CloudTrail · CloudWatch · CLI · Compute Optimizer · Config · Control Tower · Health Dashboard · License Manager · Managed Grafana · Managed Service for Prometheus · Management Console · Organizations · Proton · Service Catalog · Systems Manager · Trusted Advisor · Well-Architected Tool

### Media Services
Elastic Transcoder · Kinesis Video Streams

### Migration & Transfer
Application Discovery Service · Application Migration Service · DMS · DataSync · Migration Hub · Snow Family · Transfer Family

### Networking & Content Delivery
Client VPN · CloudFront · Direct Connect · ELB · Global Accelerator · PrivateLink · Route 53 · Site-to-Site VPN · Transit Gateway · VPC

### Security, Identity & Compliance
Artifact · Audit Manager · ACM · CloudHSM · Cognito · Detective · Directory Service · Firewall Manager · GuardDuty · IAM Identity Center · IAM · Inspector · KMS · Macie · Network Firewall · RAM · Secrets Manager · Security Hub · Shield · WAF

### Serverless
AppSync · Fargate · Lambda

### Storage
Backup · EBS · EFS · FSx · S3 · S3 Glacier · Storage Gateway

---

## Out-of-Scope Services (Selected)

These services will **not** appear on the exam:

- **Compute:** Lightsail
- **Database:** RDS on VMware
- **Developer Tools:** Cloud9, CDK, CloudShell, CodeArtifact, CodeBuild, CodeCommit, CodeDeploy, CodeGuru, CodeStar, FIS
- **Management & Governance:** Chatbot, OpsWorks, Distro for OpenTelemetry
- **Networking:** App Mesh, Cloud Map
- **Media:** All Elemental services, IVS
- **IoT:** All services
- **Game Tech, Robotics, Satellite, Quantum (Braket), AR/VR (Sumerian), Blockchain:** Out of scope

---

## Preparation Tips

- **Anchor to the Well-Architected Framework.** The exam evaluates decisions through the lens of its pillars (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability).
- **Expect scenario-based questions.** Stems are long paragraphs ending in qualifiers like "most cost-effectively," "with the least operational overhead," or "highest availability." The qualifier picks the right answer among technically correct options.
- **Practice trade-offs.** Many questions hinge on choosing between two reasonable services (e.g., DynamoDB vs. RDS, NLB vs. ALB, Direct Connect vs. VPN).
- **Time management.** ~2 minutes per question; flag uncertain ones and revisit at the end.
- **Hands-on practice** with EC2, S3, IAM, VPC, RDS, and Lambda on the AWS Free Tier reinforces concepts far better than reading alone.

---

*Sources: [AWS Certified Solutions Architect – Associate Exam Guide (Version 1.1, SAA-C03)](https://d1.awsstatic.com/training-and-certification/docs-sa-assoc/AWS-Certified-Solutions-Architect-Associate_Exam-Guide.pdf); [AWS Certification — SAA-C03 overview](https://aws.amazon.com/certification/certified-solutions-architect-associate/).*
