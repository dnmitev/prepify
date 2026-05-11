# SAA-C03 Practice Questions

30 exam-style questions weighted to match the real SAA-C03 distribution:
- Domain 1 — Design Secure Architectures: Q1–Q9
- Domain 2 — Design Resilient Architectures: Q10–Q17
- Domain 3 — Design High-Performing Architectures: Q18–Q24
- Domain 4 — Design Cost-Optimized Architectures: Q25–Q30

Answers and reasoning are in the companion file `SAA-C03-Practice-Answers.md`.

---

## Domain 1 — Design Secure Architectures

### Q1
A company runs a multi-account AWS environment managed through AWS Organizations. The security team needs to enforce that no member account — regardless of any IAM permissions granted within it — can disable AWS CloudTrail or delete trail logs. What is the MOST appropriate way to enforce this?

- A. Attach an IAM policy with explicit denies to every IAM user and role in each member account.
- B. Create a service control policy (SCP) at the organization root that denies `cloudtrail:StopLogging` and `cloudtrail:DeleteTrail`, and attach it to the relevant OUs.
- C. Enable AWS Config rules in each account to detect when CloudTrail is disabled and notify the security team.
- D. Use AWS IAM Identity Center permission sets to remove CloudTrail permissions from all users.

---

### Q2
A web application running on Amazon EC2 behind an Application Load Balancer is experiencing layer 7 attacks, including SQL injection attempts and HTTP floods from specific IP ranges. The solution must filter malicious requests before they reach the application. Which service should the architect use?

- A. AWS Shield Standard
- B. Amazon GuardDuty
- C. AWS WAF
- D. AWS Network Firewall

---

### Q3
A startup stores customer PII in an Amazon S3 bucket. Compliance requires that objects be encrypted at rest using keys where the company controls rotation policy and can audit every use of the key. Which encryption option meets these requirements with the LEAST operational overhead?

- A. SSE-S3 (Amazon S3 managed keys)
- B. SSE-KMS with an AWS managed key (`aws/s3`)
- C. SSE-KMS with a customer managed key (CMK) with automatic rotation enabled
- D. Client-side encryption using keys stored in AWS Secrets Manager

---

### Q4
A solutions architect is designing access for an EC2 instance that needs to read from an S3 bucket and write to a DynamoDB table. The application is currently using long-term IAM user access keys stored in a configuration file. What is the recommended way to grant these permissions?

- A. Create an IAM user with the required permissions and store its access keys in AWS Systems Manager Parameter Store.
- B. Attach an IAM role to the EC2 instance with the required permissions.
- C. Embed the access keys in the application code and encrypt the source file with AWS KMS.
- D. Store the access keys in AWS Secrets Manager and rotate them every 90 days.

---

### Q5
A company hosts a public API on Amazon API Gateway backed by AWS Lambda. The security team wants to require that only authenticated users from the company's existing user directory can call the API, and they want to avoid managing user passwords themselves. Which solution requires the LEAST development effort?

- A. Implement a Lambda authorizer that validates JWT tokens from a self-hosted identity provider.
- B. Configure API Gateway to use Amazon Cognito user pools with a federated identity provider for authentication.
- C. Place API Gateway behind an Application Load Balancer and use ALB authentication with OIDC.
- D. Use IAM authentication on API Gateway and create an IAM user for each customer.

---

### Q6
A company stores sensitive financial documents in Amazon S3. Auditors require that these documents cannot be deleted or modified by anyone — including root and administrators — for a fixed 7-year retention period. Which solution meets the requirement?

- A. Enable S3 Versioning and apply a bucket policy that denies `s3:DeleteObject`.
- B. Enable S3 Object Lock in compliance mode with a 7-year retention period.
- C. Move objects to S3 Glacier Deep Archive with a lifecycle rule.
- D. Enable S3 Object Lock in governance mode and grant `s3:BypassGovernanceRetention` only to the compliance team.

---

### Q7
A solutions architect must enable secure connections from on-premises servers to private resources in a VPC. The traffic must not traverse the public internet, and the company wants predictable bandwidth and low latency for large data transfers. Which option is MOST appropriate?

- A. AWS Site-to-Site VPN over the public internet
- B. AWS Direct Connect with a private virtual interface
- C. AWS PrivateLink with an interface VPC endpoint
- D. VPC peering between the on-premises network and the VPC

---

### Q8
A company runs an application across multiple AWS accounts. Developers in account A need temporary, auditable access to specific S3 buckets in account B without long-lived credentials. What is the recommended approach?

- A. Create an IAM user in account B and share its access keys with developers in account A.
- B. Create an IAM role in account B that trusts account A, and have developers in account A assume the role using AWS STS.
- C. Make the S3 buckets in account B publicly readable and rely on the buckets' object ACLs.
- D. Replicate the buckets to account A using S3 Cross-Region Replication so account A has its own copy.

---

### Q9
A solutions architect must encrypt database credentials used by an application and automatically rotate them every 30 days without code changes. The application currently reads credentials from environment variables. Which service is the BEST fit?

- A. AWS Systems Manager Parameter Store with `SecureString` parameters
- B. AWS KMS to encrypt a credentials file stored in S3
- C. AWS Secrets Manager with automatic rotation for the database engine
- D. AWS Certificate Manager configured with custom rotation logic

---

## Domain 2 — Design Resilient Architectures

### Q10
An e-commerce application has tightly coupled order processing where a single failure in payment processing stalls the entire order pipeline. The architect wants to decouple components so that an outage in one service does not prevent orders from being accepted. Which AWS service should be introduced between the order service and downstream processors?

- A. Amazon Kinesis Data Streams
- B. Amazon SQS Standard queue
- C. Amazon EventBridge with a default event bus
- D. AWS Step Functions

---

### Q11
A company's web application runs on EC2 instances in a single Availability Zone behind an Application Load Balancer. The business now requires the application to remain available even if an entire AZ fails. What is the MOST appropriate change?

- A. Increase the EC2 instance size and enable detailed CloudWatch monitoring.
- B. Deploy EC2 instances across at least two Availability Zones in an Auto Scaling group spanning those AZs, with the ALB configured to use the same AZs.
- C. Create an AMI of the application and store it in an S3 bucket replicated to another Region.
- D. Add a Network Load Balancer in front of the ALB to handle failover.

---

### Q12
A relational database running on Amazon RDS for PostgreSQL serves a production workload that cannot tolerate more than a few minutes of downtime if the primary database instance fails. Which configuration provides automatic failover with synchronous replication?

- A. RDS read replicas in a different AZ
- B. RDS Multi-AZ deployment
- C. Aurora Global Database
- D. RDS automated backups with point-in-time recovery

---

### Q13
A company wants to design a serverless image-processing pipeline. When users upload an image to S3, a Lambda function should process it. If processing fails, the failed events must be retained for later investigation rather than lost. What is the BEST design?

- A. Configure S3 Event Notifications to invoke Lambda directly, and rely on Lambda's built-in retries.
- B. Configure S3 Event Notifications to send events to an SQS queue, with a Lambda function consuming from the queue and a dead-letter queue for failed messages.
- C. Have S3 events trigger a Step Functions workflow that catches errors and logs them to CloudWatch Logs.
- D. Have S3 events trigger Amazon SNS, which fans out to Lambda; failed Lambda invocations are automatically retried indefinitely.

---

### Q14
A solutions architect is designing a disaster recovery plan with an RPO of a few seconds and an RTO of less than one minute. Budget is not a primary concern. Which DR strategy is appropriate?

- A. Backup and restore
- B. Pilot light
- C. Warm standby
- D. Multi-site active-active

---

### Q15
A REST API runs on EC2 instances behind an Application Load Balancer. Traffic varies significantly: low during nights and weekends, very high during weekday business hours, with unpredictable spikes during marketing campaigns. The architect needs to ensure capacity matches demand. Which solution is MOST appropriate?

- A. Configure an EC2 Auto Scaling group with target-tracking scaling on average CPU utilization.
- B. Provision EC2 instances at peak capacity at all times to ensure availability.
- C. Use scheduled scaling alone, configured to scale up at 8 a.m. and scale down at 6 p.m.
- D. Replace EC2 with an on-premises server cluster sized for peak load.

---

### Q16
A globally distributed mobile game requires low-latency reads and writes from players in multiple Regions for player session data such as scores and inventory. Strong consistency within a Region is required, and the architecture must remain resilient to a Region failure. Which database service is the BEST fit?

- A. Amazon RDS for MySQL with cross-Region read replicas
- B. Amazon DynamoDB global tables
- C. Amazon Aurora Serverless v2 in a single Region
- D. Amazon Redshift cluster with cross-Region snapshots

---

### Q17
A monolithic application currently runs on a single large EC2 instance. The team wants to refactor it into independently deployable, stateless components that can scale separately and communicate via well-defined APIs. Which architectural pattern is being described?

- A. Multi-tier monolithic architecture
- B. Microservices architecture
- C. Active-passive failover architecture
- D. Lift-and-shift architecture

---

## Domain 3 — Design High-Performing Architectures

### Q18
A read-heavy web application backed by Amazon RDS for MySQL is experiencing database CPU saturation during peak hours. Profiling shows that 90% of queries are repetitive product-catalog reads. Which change provides the BEST performance improvement with minimal application redesign?

- A. Add Amazon ElastiCache (Redis or Memcached) in front of RDS and cache catalog query results.
- B. Migrate the database to DynamoDB and rewrite all queries.
- C. Increase the RDS instance to the largest available size.
- D. Enable RDS automated backups and snapshot replication.

---

### Q19
A global media company serves static images and videos to users worldwide from an S3 bucket in `us-east-1`. Users outside North America report slow load times. Which solution improves performance for global users with the LEAST operational overhead?

- A. Enable S3 Transfer Acceleration on the bucket.
- B. Replicate the S3 bucket to multiple Regions and use Route 53 latency-based routing to the closest bucket.
- C. Create an Amazon CloudFront distribution with the S3 bucket as the origin.
- D. Use AWS Global Accelerator pointed at the S3 bucket.

---

### Q20
A data analytics workload requires ad-hoc SQL queries directly against tens of terabytes of structured logs stored in Amazon S3. The team does not want to provision or manage any database servers, and queries are run only a few times per day. Which service is MOST cost-effective and performant for this access pattern?

- A. Amazon Redshift provisioned cluster
- B. Amazon RDS for PostgreSQL with `aws_s3` extension
- C. Amazon Athena
- D. Amazon EMR with persistent Hadoop clusters

---

### Q21
A high-throughput logging system ingests millions of small records per second from thousands of IoT devices. Records must be processed by multiple independent downstream consumers in near real-time, with the ability to replay events from the past 24 hours. Which service is MOST appropriate?

- A. Amazon SQS Standard queue
- B. Amazon Kinesis Data Streams
- C. Amazon SNS topic with multiple subscribers
- D. AWS Step Functions

---

### Q22
A solutions architect must select storage for a high-performance computing (HPC) workload requiring sub-millisecond latency, hundreds of GB/s throughput, and POSIX-compliant access shared across thousands of EC2 instances. Which storage option is the BEST fit?

- A. Amazon S3 with S3 Transfer Acceleration
- B. Amazon EFS with the General Purpose performance mode
- C. Amazon FSx for Lustre
- D. Amazon EBS `gp3` volumes attached to each instance

---

### Q23
An application stores user-uploaded files that are accessed frequently for the first 30 days, occasionally between 30 and 90 days, and rarely after that, but must be retrievable within minutes. The team wants automated cost optimization without code changes. Which solution is BEST?

- A. Manually move objects to different storage classes based on monitoring.
- B. Configure an S3 Lifecycle policy that transitions objects to S3 Standard-IA at 30 days and to S3 Glacier Flexible Retrieval at 90 days.
- C. Use S3 Intelligent-Tiering, which automatically moves objects between access tiers based on usage.
- D. Store all files in S3 Glacier Deep Archive from the start.

---

### Q24
A solutions architect needs to provide low-latency, deterministic network performance for a globally distributed application running on EC2 instances in three AWS Regions. End users connect over the public internet and need traffic routed to the closest healthy Regional endpoint. Which service is the BEST fit?

- A. Amazon CloudFront
- B. AWS Global Accelerator
- C. Amazon Route 53 simple routing
- D. AWS PrivateLink

---

## Domain 4 — Design Cost-Optimized Architectures

### Q25
A development team uses EC2 instances for non-production workloads that run only during business hours and can tolerate interruptions. The team wants to minimize compute cost. Which purchasing option is MOST cost-effective?

- A. On-Demand Instances
- B. 1-year No Upfront Reserved Instances
- C. Spot Instances combined with start/stop automation
- D. Dedicated Hosts

---

### Q26
A solutions architect notices that a NAT gateway in each of three Availability Zones is generating high data-transfer charges because all egress traffic for a private workload routes through it. The workload mostly fetches public package updates and writes to S3 in the same Region. Which change reduces cost MOST without sacrificing availability?

- A. Replace the three NAT gateways with a single NAT gateway shared across all AZs.
- B. Create an S3 gateway endpoint so traffic to S3 bypasses the NAT gateways, and keep the NAT gateways for other egress.
- C. Remove all NAT gateways and route traffic through an internet gateway directly.
- D. Use AWS Global Accelerator to route the S3 traffic.

---

### Q27
A company has a steady-state production workload running 24/7 on EC2 for the next three years. They want maximum savings with no operational changes to the workload. Which option is MOST cost-effective?

- A. 3-year All Upfront Compute Savings Plan
- B. Spot Instances with capacity reservations
- C. On-Demand Instances paid monthly
- D. 1-year No Upfront Standard Reserved Instances renewed annually

---

### Q28
A company stores 50 TB of backup data that must be retained for compliance for 7 years. Retrieval is expected only in rare audit cases, and retrieval times of up to 12 hours are acceptable. Which storage class is MOST cost-effective?

- A. S3 Standard
- B. S3 Standard-IA
- C. S3 Glacier Flexible Retrieval
- D. S3 Glacier Deep Archive

---

### Q29
A development team runs short-lived batch jobs that take 5–10 minutes each and execute several times per hour. Each job currently runs on a dedicated EC2 instance that remains idle most of the time. The team wants to minimize cost and operational overhead. Which compute option is the BEST fit?

- A. Keep EC2 instances and use detailed CloudWatch monitoring.
- B. Move the jobs to AWS Lambda.
- C. Migrate the jobs to ECS on Fargate Spot, packaging the workload as containers.
- D. Provision a Kubernetes cluster on EKS with permanent node groups.

---

### Q30
A solutions architect needs to give the finance team visibility into AWS spend broken down by project, team, and environment across a multi-account AWS Organization. Costs must be analyzable in dashboards, and alerts must be sent when monthly spend exceeds a threshold. Which combination of services should be used?

- A. AWS Cost Explorer with cost allocation tags, plus AWS Budgets for threshold alerts.
- B. AWS CloudTrail with Amazon Athena queries for cost reporting.
- C. AWS Config rules to detect overspending and trigger SNS notifications.
- D. AWS Trusted Advisor alone, with manual review by the finance team.

---

*Companion answers and reasoning: `SAA-C03-Practice-Answers.md`*
