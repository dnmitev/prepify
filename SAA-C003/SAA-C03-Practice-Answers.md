# SAA-C03 Practice Questions — Answer Key & Reasoning

Answers and explanations for the 30 questions in `SAA-C03-Practice-Questions.md`. Each entry includes the correct answer, why it's right, and why the distractors are wrong — since on the real exam, the difference between two technically correct options is usually the deciding skill.

---

## Domain 1 — Design Secure Architectures

### Q1 — Answer: **B**

Service control policies (SCPs) are the only construct in AWS Organizations that can place a hard ceiling on what any principal — including the root user of a member account — can do. An SCP denying `cloudtrail:StopLogging` and `cloudtrail:DeleteTrail` applied at the OU or organization root enforces the requirement everywhere, regardless of in-account IAM grants.

- **A** — Won't catch new users or roles created later, and the root user is not subject to IAM policies.
- **C** — AWS Config detects after the fact; it does not prevent the action.
- **D** — IAM Identity Center permission sets only affect users provisioned through it; in-account IAM users and roles are unaffected.

---

### Q2 — Answer: **C**

AWS WAF is the layer-7 firewall purpose-built to inspect HTTP/HTTPS requests and block by IP, rate, SQL injection patterns, XSS, and managed rule groups when attached to an ALB, CloudFront, or API Gateway.

- **A** — Shield Standard provides automatic L3/L4 DDoS protection but does not filter L7 application attacks.
- **B** — GuardDuty is a threat-detection service; it identifies suspicious behavior but does not block requests.
- **D** — AWS Network Firewall operates at the VPC level on L3/L4 (and limited L7), not specifically on ALB request inspection.

---

### Q3 — Answer: **C**

A customer managed KMS key gives full control over rotation, key policies, and grants. Automatic annual rotation can be enabled with one setting, and every key use is logged to CloudTrail for audit. This satisfies "control rotation" and "audit every use" with minimal overhead.

- **A** — SSE-S3 uses keys you can neither control nor audit per use.
- **B** — The AWS managed `aws/s3` key cannot have its rotation policy changed and offers limited control.
- **D** — Client-side encryption with Secrets Manager works but adds significant operational complexity (custom encryption logic, key distribution), conflicting with "least overhead."

---

### Q4 — Answer: **B**

IAM roles for EC2 (via instance profiles) provide short-lived, automatically rotated credentials with no long-term secrets on disk. This is the AWS best practice.

- **A**, **D** — Both still use long-term IAM user access keys, which the question is trying to eliminate.
- **C** — Embedding keys in code is explicitly an anti-pattern; encryption of the source doesn't fix exposure during deployment, backups, or developer access.

---

### Q5 — Answer: **B**

Cognito user pools are AWS's managed user-directory service with built-in federation to existing IdPs (SAML, OIDC, social) and native integration with API Gateway via Cognito authorizers. No code is needed to validate tokens — API Gateway does it.

- **A** — A Lambda authorizer works but requires writing and maintaining custom token-validation code.
- **C** — REST APIs on API Gateway are not deployed behind an ALB; this design doesn't fit.
- **D** — IAM authentication forces customers to have AWS credentials, which is not viable for end users.

---

### Q6 — Answer: **B**

S3 Object Lock in **compliance mode** is the only option that prevents deletion or modification by any user, including the root user, for the duration of the retention period. This is the WORM (write-once-read-many) configuration auditors require.

- **A** — A bucket policy can be modified or removed by an administrator.
- **C** — Glacier Deep Archive stores cheaply but does not prevent deletion.
- **D** — Governance mode allows users with the bypass permission to remove the lock, which fails the "no one, including admins" requirement.

---

### Q7 — Answer: **B**

Direct Connect provides a dedicated private network link, bypassing the public internet, with predictable bandwidth (1/10/100 Gbps) and consistent latency. A private VIF connects on-premises to VPC resources via private IPs.

- **A** — Site-to-Site VPN runs over the public internet; bandwidth and latency are not predictable.
- **C** — PrivateLink is for accessing AWS services from inside a VPC, not for on-premises connectivity by itself.
- **D** — VPC peering is between VPCs, not on-premises to VPC.

---

### Q8 — Answer: **B**

Cross-account IAM roles assumed via STS provide temporary, auditable credentials with no long-term keys to leak. CloudTrail records every `AssumeRole` call.

- **A** — Sharing long-term access keys is an anti-pattern and unauditable.
- **C** — Public buckets violate least privilege and expose data globally.
- **D** — Replicating buckets duplicates storage cost and doesn't address access — it just moves the problem.

---

### Q9 — Answer: **C**

Secrets Manager is purpose-built for credential storage with native automatic rotation support for RDS, Aurora, Redshift, and DocumentDB engines (and custom rotation via Lambda). The application retrieves the latest credential at runtime, no code change needed beyond the SDK call.

- **A** — Parameter Store can store SecureStrings but lacks built-in automatic rotation for database engines.
- **B** — KMS encrypts data but doesn't manage rotation of database credentials.
- **D** — ACM manages TLS certificates, not database credentials.

---

## Domain 2 — Design Resilient Architectures

### Q10 — Answer: **B**

An SQS queue between the order service (producer) and the payment processor (consumer) decouples them: orders are accepted into the queue even if the consumer is down. The classic loose-coupling pattern.

- **A** — Kinesis Data Streams works for high-throughput streaming with ordered consumers and replay, but it's overkill for a simple decoupling scenario and requires consumers to manage shard iterators.
- **C** — EventBridge is event routing/filtering, useful for fan-out, but a queue is the more direct decoupling pattern for a single producer-consumer relationship.
- **D** — Step Functions orchestrates workflows; it doesn't buffer requests.

Either B or A could decouple, but SQS is the simpler, more idiomatic answer for "decouple two services with a buffer."

---

### Q11 — Answer: **B**

High availability across an AZ failure requires running in multiple AZs. An Auto Scaling group spanning two or more AZs, with the ALB enabled in those same AZs, is the textbook design.

- **A** — Bigger instances don't help if the AZ they're in fails.
- **C** — An AMI in S3 is a recovery artifact, not a running-availability solution.
- **D** — Stacking load balancers adds complexity without addressing the AZ failure.

---

### Q12 — Answer: **B**

RDS Multi-AZ keeps a synchronous standby in a different AZ and performs automatic failover (typically 60–120 seconds), satisfying the few-minutes RTO with no data loss.

- **A** — Read replicas are asynchronous, so failover risks data loss, and promotion is manual.
- **C** — Aurora Global Database is cross-Region; the question is about AZ-level failover and Aurora isn't strictly required.
- **D** — Backups support point-in-time recovery but require manual restore, easily exceeding the RTO.

---

### Q13 — Answer: **B**

Putting SQS between S3 and Lambda gives durable buffering: even if Lambda fails repeatedly, the message stays in the queue until processed or moved to the DLQ after the redrive policy threshold. This preserves failed events for investigation.

- **A** — S3 → Lambda direct invocation has limited retry behavior, and there's no clean place to land permanently failed events.
- **C** — Step Functions adds workflow complexity that's unnecessary for a single-step pipeline.
- **D** — SNS doesn't durably store messages for failed subscribers; Lambda's retries are also finite.

---

### Q14 — Answer: **D**

Multi-site active-active (also called hot standby) runs full production in two or more Regions with traffic distributed live. RPO is seconds (continuous replication), RTO is near-zero (failover by DNS/Global Accelerator). It's the most expensive option, which matches "budget is not a concern."

- **A** — Backup and restore has hours of RPO/RTO.
- **B** — Pilot light has minutes-to-hours RTO; minimal Region running.
- **C** — Warm standby has minutes RTO but isn't sized to absorb full production traffic instantly.

---

### Q15 — Answer: **A**

Target tracking on a representative metric (like average CPU) lets Auto Scaling react to actual demand patterns — including unpredictable spikes — without manual intervention.

- **B** — Massive over-provisioning is wasteful and contradicts elasticity principles.
- **C** — Scheduled scaling alone misses unpredictable marketing spikes.
- **D** — Moving to on-premises defeats the purpose of cloud elasticity.

---

### Q16 — Answer: **B**

DynamoDB global tables provide multi-Region, multi-active replication with single-digit-millisecond local reads and writes. Strong consistency is supported within a Region (eventual across Regions, which is acceptable for game session data). A Region failure is handled by routing traffic to a healthy Region.

- **A** — RDS cross-Region read replicas serve reads, but writes go to the primary Region — adding latency for distant users and exposing a single point of failure.
- **C** — Single-Region Aurora Serverless doesn't survive a Region failure.
- **D** — Redshift is a data warehouse, not a transactional player-data store.

---

### Q17 — Answer: **B**

The defining traits of microservices — independently deployable, stateless, scaling separately, communicating via APIs — match exactly.

- **A** — Multi-tier monolithic still deploys as one unit.
- **C** — Active-passive describes failover, not decomposition.
- **D** — Lift-and-shift means moving the existing application as-is, not refactoring.

---

## Domain 3 — Design High-Performing Architectures

### Q18 — Answer: **A**

A caching layer is the canonical fix for repetitive read-heavy traffic. ElastiCache (Redis or Memcached) absorbs the hot reads, dropping load on RDS dramatically. Minimal application change is needed (cache-aside pattern).

- **B** — Migrating to DynamoDB plus rewriting queries is a massive change and possibly inappropriate for relational data.
- **C** — Scaling up the instance only buys time and is more expensive long-term.
- **D** — Backups address durability, not performance.

---

### Q19 — Answer: **C**

CloudFront caches content at hundreds of edge locations worldwide, dramatically reducing latency for static content from S3. It's the standard pattern with very low operational overhead — just create the distribution and point it at the bucket.

- **A** — S3 Transfer Acceleration speeds up **uploads** to S3 via CloudFront edges, not downloads to end users.
- **B** — Multi-Region replication plus Route 53 works but is operationally heavier (replication, consistency, multiple buckets to manage).
- **D** — Global Accelerator routes TCP/UDP via AWS's backbone, but for static-content delivery CloudFront is the right tool (and Global Accelerator doesn't target S3 directly).

---

### Q20 — Answer: **C**

Athena is serverless SQL on S3. You pay only per query (per terabyte scanned), there are no servers to manage, and it's well-suited to ad-hoc workloads that run intermittently.

- **A** — Redshift provisioned clusters cost continuously even when idle; overkill for "few queries per day."
- **B** — `aws_s3` on RDS imports data into RDS first; not a direct query mechanism for tens of TB.
- **D** — Persistent EMR clusters are expensive when idle and require Hadoop expertise.

---

### Q21 — Answer: **B**

Kinesis Data Streams handles high-throughput ingestion (millions of records/sec), supports multiple independent consumers reading from the same stream, and retains data for up to 365 days (24 hours by default) — enabling replay.

- **A** — SQS Standard supports high throughput but does not allow multiple independent consumers to read the same message, and messages disappear once processed.
- **C** — SNS fan-outs to multiple subscribers but has no replay; missed messages are lost.
- **D** — Step Functions orchestrates state machines, not high-throughput streaming.

---

### Q22 — Answer: **C**

FSx for Lustre is purpose-built for HPC and ML workloads requiring sub-millisecond latency and hundreds of GB/s throughput on a POSIX file system shared across many compute nodes.

- **A** — S3 is object storage, not POSIX, and has higher latency.
- **B** — EFS scales but tops out far below Lustre's HPC throughput targets.
- **D** — EBS is block storage, attached to one instance at a time (Multi-Attach exists but doesn't scale to thousands of instances).

---

### Q23 — Answer: **C**

S3 Intelligent-Tiering automatically moves objects between frequent, infrequent, archive instant access, and (optionally) deep archive tiers based on access patterns, with no retrieval fees from the instant tiers. It fits "frequent → occasional → rare with minute-level retrieval" automatically, with no code change.

- **A** — Manual movement is operationally heavy and error-prone.
- **B** — Lifecycle to Glacier Flexible Retrieval has minutes-to-hours retrieval; it works but is less flexible than Intelligent-Tiering, which adapts to actual usage rather than fixed-age assumptions.
- **D** — Deep Archive has 12-hour retrieval, violating the "retrievable within minutes" requirement and inappropriate for objects that start as frequently accessed.

---

### Q24 — Answer: **B**

Global Accelerator provides anycast IP addresses that route users over the AWS global backbone to the closest healthy Regional endpoint, with fast failover. It's designed for non-HTTP and HTTP applications needing deterministic performance and Regional failover.

- **A** — CloudFront is for cached content delivery (HTTP/HTTPS); not the right fit for arbitrary Regional endpoint routing of an application.
- **C** — Route 53 simple routing has no health-based routing or backbone optimization.
- **D** — PrivateLink is for private connectivity, not global public-internet routing.

---

## Domain 4 — Design Cost-Optimized Architectures

### Q25 — Answer: **C**

Spot Instances offer up to ~90% discount versus On-Demand and are perfect for interruptible non-production workloads. Combining with start/stop automation (only running during business hours) compounds the savings.

- **A** — On-Demand is the most expensive option.
- **B** — Reserved Instances commit to 24/7 capacity; wasted during nights/weekends.
- **D** — Dedicated Hosts are for licensing/compliance scenarios and are very expensive.

---

### Q26 — Answer: **B**

S3 gateway endpoints are free and route S3 traffic from the VPC directly via AWS's internal network, bypassing the NAT gateway. NAT gateway charges (per-hour and per-GB) drop sharply because S3 traffic — typically the largest egress driver — no longer transits NAT.

- **A** — Consolidating NAT gateways into a single AZ saves hourly cost but creates cross-AZ data transfer charges and a single-AZ point of failure — it sacrifices availability.
- **C** — Removing NAT gateways breaks private instances' outbound internet access for non-S3 traffic.
- **D** — Global Accelerator is for inbound user traffic to applications, not egress data transfer.

---

### Q27 — Answer: **A**

3-year All Upfront Compute Savings Plans deliver the deepest discounts (up to ~66% versus On-Demand) for steady-state workloads and apply flexibly across EC2, Lambda, and Fargate.

- **B** — Spot is cheapest per hour but production workloads typically can't tolerate interruption.
- **C** — On-Demand is the most expensive option for steady state.
- **D** — 1-year No Upfront RIs save less than 3-year All Upfront and require yearly renewal effort.

---

### Q28 — Answer: **D**

Deep Archive is the lowest-cost S3 storage class, designed for rarely accessed long-term retention with retrieval times of 12 hours (standard) or 48 hours (bulk). It matches the requirements precisely.

- **A**, **B** — Standard and Standard-IA are far more expensive for cold data.
- **C** — Glacier Flexible Retrieval is cheaper than Standard-IA but more expensive than Deep Archive; with 12-hour retrieval acceptable, Deep Archive wins on cost.

---

### Q29 — Answer: **B**

Lambda charges per-millisecond of execution and zero when idle, which is ideal for short, frequent jobs. No instance management. 5–10 minute jobs fit within Lambda's 15-minute timeout.

- **A** — Keeping idle EC2 instances wastes money; the question explicitly notes idle time.
- **C** — Fargate Spot works but adds container packaging overhead; Lambda is simpler for jobs that already fit.
- **D** — EKS with permanent nodes pays continuously for idle capacity.

---

### Q30 — Answer: **A**

Cost Explorer with cost allocation tags is the native way to break down spend by tag dimensions like project, team, and environment, and supports dashboards and saved reports. AWS Budgets sends alerts (SNS, email) when actual or forecasted spend crosses thresholds.

- **B** — CloudTrail logs API activity, not cost data; Athena queries against CloudTrail won't yield meaningful cost analysis.
- **C** — Config tracks resource configuration compliance, not spend.
- **D** — Trusted Advisor flags cost-optimization opportunities but is not a spend-analytics dashboard.

---

## Scoring Guide

| Score | Interpretation |
|---|---|
| 27–30 (90%+) | Strong — likely ready for the exam |
| 24–26 (80–89%) | Solid — review missed domains, then sit the exam |
| 21–23 (70–79%) | Borderline — at or near the 720/1000 pass mark; more study advised |
| Below 21 (<70%) | Not yet — identify weak domains and revisit task statements |

Focus your follow-up study on domains where you missed multiple questions — the real exam is weighted, so a single weak domain (especially Security at 30%) hurts more than the others.
