import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jiraInitiativesTable, leanixInitiativesTable, architectureRequestsTable, kpiMetricsTable, knowledgeBaseArticlesTable } from "@workspace/db";
import { eq, inArray } from "drizzle-orm";

const router: IRouter = Router();

const SEED_TOKEN = "arc-demo-seed-2026";

const PATTERNS_SEED = [
  {
    title: "Enterprise API Gateway Pattern",
    category: "pattern",
    owner: "Platform Architecture Team",
    status: "published",
    technologies: ["Kong Gateway", "AWS API Gateway", "Azure API Management", "MuleSoft"],
    tags: ["api", "gateway", "security", "integration", "enterprise"],
    externalUrl: null,
    content: `## Overview
The Enterprise API Gateway pattern provides a single, managed entry point for all north-south API traffic. The gateway handles cross-cutting concerns — authentication, authorisation, rate limiting, TLS termination, logging, and routing — so that individual microservices do not need to implement these themselves.

## When to Use
- Exposing internal services to external consumers (partners, mobile apps, public APIs)
- Enforcing consistent security policy across multiple backend services
- Requiring traffic analytics, throttling, or monetisation of API calls
- Migrating from monolith to microservices (strangler fig pattern)

## Architecture
\`\`\`
Client → [WAF] → API Gateway → [Auth / Rate Limit / Transform] → Backend Services
                                       ↓
                               Identity Provider (OAuth 2.0 / OIDC)
\`\`\`

## Key Components
1. **WAF (Web Application Firewall)**: Cloudflare or AWS WAF in front of the gateway for L7 threat protection
2. **API Gateway**: Kong (self-managed) or AWS API Gateway / Azure APIM (managed)
3. **Identity Provider**: Enterprise IdP (Okta / Azure Entra ID) for OAuth 2.0 token validation
4. **Developer Portal**: Self-service onboarding for internal and external API consumers
5. **Observability**: Centralised logging to Datadog/Splunk; metrics to Prometheus/Grafana

## Enterprise Standards
- All APIs must be registered in the API Catalogue before gateway publishing
- OAuth 2.0 with PKCE mandatory for all external-facing APIs
- Rate limiting default: 1,000 req/min per consumer key; exceptions require EA approval
- mTLS required for all service-to-service (east-west) calls where available

## Common Pitfalls
- Using the gateway for east-west (service mesh) traffic — use a service mesh (Istio/Linkerd) instead
- Storing business logic in gateway transformation policies — keep transformations thin
- Single-region gateway deployment without active-active failover for HA requirements

## Approved Products (2025)
| Use Case | Approved Product |
|---|---|
| Cloud-managed (AWS) | AWS API Gateway v2 |
| Cloud-managed (Azure) | Azure API Management |
| Self-managed on-prem | Kong Gateway Enterprise |
| Integration Platform | MuleSoft Anypoint Platform |`,
  },
  {
    title: "Event-Driven Architecture with Apache Kafka",
    category: "reference_architecture",
    owner: "Integration Architecture CoE",
    status: "published",
    technologies: ["Apache Kafka", "AWS MSK", "Azure Event Hubs", "Confluent Platform", "Schema Registry"],
    tags: ["events", "streaming", "async", "integration", "kafka", "pub-sub"],
    externalUrl: null,
    content: `## Overview
Event-Driven Architecture (EDA) decouples producers and consumers via an immutable, ordered event log. Apache Kafka (or managed equivalents) is the enterprise-approved backbone for high-throughput, durable event streaming.

## When to Use
- Decoupling services that would otherwise be synchronously coupled via REST/SOAP
- High-throughput data pipelines (>10,000 events/second)
- Audit-trail and event-sourcing requirements
- Cross-domain data replication (e.g. operational data store → analytics platform)
- Replacing point-to-point MQ integrations with fan-out publish/subscribe

## When NOT to Use
- Request/response interactions requiring immediate responses — use REST/gRPC
- Small-scale integrations with <100 events/day — overhead is not justified
- Simple file transfer — use SFTP or object storage events

## Reference Architecture
\`\`\`
Producers (Services / Databases / Sensors)
       ↓
[Schema Registry] ← validate schema
       ↓
Apache Kafka / Confluent Platform
  - Topic per domain entity (e.g. orders.v1, inventory.v1)
  - Retention: 7 days default, 30 days for audit domains
       ↓
Consumers (Microservices / Analytics / Data Warehouse)
       ↓
[Dead Letter Queue] → alerting on poison messages
\`\`\`

## Kafka Topic Naming Convention
\`<domain>.<entity>.<version>\`
Examples: \`finance.invoices.v1\`, \`manufacturing.production-orders.v2\`

## Enterprise Standards
- **Schema Registry is mandatory**: All topics must use Avro or Protobuf with a registered schema. Breaking schema changes are prohibited without a new topic version.
- **Managed Kafka preferred**: AWS MSK or Azure Event Hubs preferred over self-managed Kafka clusters unless workload requires Kafka-specific features.
- **Exactly-once semantics**: Enable idempotent producers and transactional consumers for financial and operational domains.
- **Multi-AZ deployment required** for all production topics.
- **Consumer lag alerting**: Alert at >10,000 messages lag for critical consumers.

## Data Sovereignty Considerations
For EU workloads, Kafka brokers must reside in EU regions. Cross-region replication (MirrorMaker 2) must not replicate topics containing personal data unless GDPR transfer mechanisms are in place.`,
  },
  {
    title: "OT/IT Security DMZ Pattern",
    category: "pattern",
    owner: "Cyber Security Architecture",
    status: "published",
    technologies: ["OPC-UA", "Palo Alto NGFW", "Cisco ISE", "Fortinet FortiGate", "MQTT", "OSIsoft PI"],
    tags: ["security", "ot-it", "manufacturing", "scada", "dmz", "industrial"],
    externalUrl: null,
    content: `## Overview
The OT/IT Security DMZ pattern establishes a secure, auditable bridge between Operational Technology (OT) networks (PLCs, SCADA, DCS) and Information Technology (IT) networks (ERP, cloud platforms). This pattern is mandatory for any architecture crossing the OT/IT boundary.

## Security Classification
**CRITICAL**: This pattern is a security-mandated standard. Deviations require written approval from the CISO and Enterprise Architecture.

## Architecture
\`\`\`
[OT Network - Level 3]          [DMZ - Isolated Segment]         [IT Network]
  SCADA / PLCs                    OPC-UA Proxy Server               SAP ERP
  Historians (PI)    ←→ OPC-UA →  (Protocol Break)   ← REST/MQTT → MES Platform
  DCS Systems                     Data Diode (optional)             Corporate Data
  (Purdue Model L0-L2)            NGFW (Palo Alto)                  Platform
\`\`\`

## Mandatory Controls
1. **Physical/Logical Isolation**: OT and IT networks must be on separate VLANs with no direct routing. All traffic must pass through the DMZ.
2. **Protocol Break**: A dedicated proxy (e.g., Kepware, Inductive Automation Ignition Gateway) must translate OT protocols (OPC-UA, Modbus, EtherNet/IP) to IT-friendly protocols (REST, MQTT, OPC-UA over TLS). No native OT protocols may traverse the DMZ.
3. **Next-Generation Firewall**: Palo Alto NGFW (primary) or Fortinet FortiGate with IDS/IPS, application-aware policies, and OT protocol signatures enabled.
4. **Data Diode (where required)**: Unidirectional gateway (e.g., Waterfall Security) for unidirectional flows from OT to IT where data must never flow IT→OT.
5. **Jump Server / PAM**: All OT network access from IT must traverse a privileged access management (PAM) jump server with session recording. No direct RDP/VNC to OT assets from IT.
6. **Network Traffic Monitoring**: OT-aware IDS (Claroty, Dragos, or Nozomi) deployed in passive monitoring mode on the OT network.

## Approved Integration Protocols
| Layer | Approved | Prohibited |
|---|---|---|
| OT side | OPC-UA, Modbus TCP, EtherNet/IP | HTTP, MQTT (native) |
| DMZ bridge | OPC-UA Proxy → REST/MQTT | Direct protocol pass-through |
| IT side | REST over HTTPS, MQTT over TLS, AMQP | Unencrypted protocols |

## ARC Requirements
Any new OT/IT integration must complete an ARC Deep Dive review. Security Architecture and the OT/IT Security SME must attend. Architecture exception process applies for any deviation from this pattern.`,
  },
  {
    title: "Cloud Landing Zone – ANZ Multi-Account Foundation",
    category: "reference_architecture",
    owner: "Cloud Platform Engineering",
    status: "published",
    technologies: ["AWS Control Tower", "AWS Organizations", "Azure Management Groups", "Terraform", "AWS Config", "Azure Policy"],
    tags: ["cloud", "landing-zone", "aws", "azure", "governance", "iac", "foundation"],
    externalUrl: null,
    content: `## Overview
The Cloud Landing Zone (CLZ) defines the pre-approved, security-hardened account/subscription structure and guardrails that all new cloud workloads must deploy into. The CLZ eliminates bespoke cloud account setup and ensures consistent compliance, network topology, and identity federation from day one.

## Scope
- **ANZ Region**: AWS (ap-southeast-2 primary, ap-southeast-4 DR) and Azure (Australia East primary, Australia Southeast DR)
- **Platform Owner**: Cloud Platform Engineering (CPE)
- **Mandatory for**: All new cloud-hosted workloads classified business-valuable or above

## Account Structure (AWS)
\`\`\`
Root (Management Account)
├── Security OU
│   ├── Log Archive Account (read-only, immutable CloudTrail / Config)
│   └── Security Tooling Account (GuardDuty, Security Hub master)
├── Infrastructure OU
│   ├── Network Account (Transit Gateway, Direct Connect, DNS)
│   └── Shared Services Account (Active Directory, Artifactory, monitoring)
├── Workloads OU
│   ├── Production OU → prod-<workload> accounts
│   ├── Non-Production OU → dev/test/staging-<workload> accounts
│   └── Sandbox OU → ephemeral developer accounts (auto-terminate 30 days)
└── Suspended OU (decommissioned accounts)
\`\`\`

## Guardrails (Always-On)
- MFA required for all IAM user console access (SCPs enforced)
- No public S3 buckets (SCP + AWS Config rule)
- CloudTrail enabled and log archive account only (cannot be disabled)
- AWS Config rules: mandatory tagging, encryption at rest, VPC flow logs
- No root account API keys (preventive SCP)

## Networking
- All workload VPCs connect to the Network Account via Transit Gateway (no VPC peering)
- Internet egress centralised through the Network Account (no workload-level IGWs for production)
- DNS: Route 53 Resolver with centralised private hosted zones
- Direct Connect: 2 × 1Gbps to ANZ on-prem datacentres (primary + failover)

## How to Request a New Account
Submit an ARR (Architecture Review Request) via the ARC Portal with the Cloud Account Request form. CPE will provision the account into the CLZ within 5 business days of ARC approval.`,
  },
  {
    title: "Data Mesh Architecture",
    category: "reference_architecture",
    owner: "Data Architecture Team",
    status: "published",
    technologies: ["Databricks", "dbt", "Apache Iceberg", "AWS Glue", "Apache Kafka", "AWS Lake Formation"],
    tags: ["data", "mesh", "governance", "platform", "analytics", "domain-driven"],
    externalUrl: null,
    content: `## Overview
The Data Mesh pattern distributes data ownership to domain teams while providing centralised data platform infrastructure and governance. Each domain becomes the "data product owner" for datasets they produce, exposing them via standardised, discoverable interfaces.

## Core Principles (after Zhamak Dehghani)
1. **Domain-oriented data ownership**: Domains own their data products end-to-end (ingest, model, publish, SLA)
2. **Data as a product**: Each dataset is a product with an owner, SLO, documentation, and a contract
3. **Self-serve data platform**: CPE provides infrastructure primitives (compute, storage, cataloguing); domains self-serve
4. **Federated computational governance**: Central governance policies (PII tagging, retention, access) are enforced by the platform; domains operate within them

## Reference Architecture
\`\`\`
Domain Teams (Producers)
  Manufacturing → [dbt + Databricks] → Iceberg tables → Data Catalogue (Unity Catalog)
  Finance       → [dbt + Databricks] → Iceberg tables → Data Catalogue
  Marketing     → [Kafka + Glue]     → Iceberg tables → Data Catalogue
                                               ↓
                                    [AWS Lake Formation - access control]
                                               ↓
Consumer Teams (Analytics / ML / Reporting)
\`\`\`

## Data Product Contract (Mandatory Fields)
Each data product must define:
- **Owner**: Domain team and named data product owner
- **SLO**: Freshness SLA, completeness target, availability target
- **Schema**: Registered in Unity Catalog with column-level documentation
- **PII Classification**: Fields tagged via the enterprise data classification standard
- **Retention**: Aligned to the enterprise data retention schedule
- **Access Policy**: Row/column security implemented via Lake Formation

## Governance Rules
- PII data products require GDPR/Privacy Act impact assessment before publishing
- Cross-domain data joins must be documented as a data product dependency
- Breaking schema changes require a 30-day deprecation notice and a new major version

## Anti-Patterns to Avoid
- Central "data team" building all pipelines (reverts to data warehouse monolith)
- Domain teams bypassing the data catalogue (shadow data)
- Data products with no named owner (orphaned datasets)`,
  },
  {
    title: "Zero-Trust Network Architecture",
    category: "best_practice",
    owner: "Cyber Security Architecture",
    status: "published",
    technologies: ["Azure Entra ID", "Zscaler ZIA/ZPA", "Cloudflare Access", "Okta", "CrowdStrike", "Palo Alto Prisma"],
    tags: ["security", "zero-trust", "iam", "network", "identity", "ztna"],
    externalUrl: null,
    content: `## Overview
Zero-Trust Architecture (ZTA) replaces perimeter-based security with identity-centric, context-aware access controls. The principle is "never trust, always verify" — no implicit trust is granted based on network location.

## Why This Matters
Traditional VPN-based remote access creates a flat, implicitly trusted internal network once a user connects. A single compromised endpoint can move laterally across the entire network. ZTA eliminates this by enforcing per-session, per-resource authorisation decisions.

## Five Pillars of Zero Trust (NIST SP 800-207)
1. **Identity**: Strong multi-factor authentication (MFA) for all users and service accounts. Continuous identity verification, not just at login.
2. **Device**: Device health evaluated before access is granted (CrowdStrike Falcon sensor status, patch level, encryption state).
3. **Network**: Micro-segmentation; no implicit east-west trust. Application-layer inspection for all traffic.
4. **Application**: Applications published via identity-aware proxy (Zscaler ZPA / Cloudflare Access), not exposed to the internet directly.
5. **Data**: Data classified and access granted based on classification, not role alone. DLP controls for sensitive data exfiltration prevention.

## Enterprise Implementation Standards

### Identity & Access
- **MFA mandatory** for all staff (Microsoft Entra ID Conditional Access + phishing-resistant MFA preferred)
- Privileged accounts: Entra ID PIM with just-in-time (JIT) access — no standing admin access
- Service accounts: Managed Identities (Azure) or IAM Roles (AWS) preferred over static credentials

### Remote Access (replacing VPN)
- **Zscaler ZPA** is the approved ZTNA solution for enterprise application access
- Legacy VPN permitted only for OT/industrial access (see OT/IT DMZ Pattern)
- Device posture check required before ZPA access (CrowdStrike agent + patch compliance)

### Network Segmentation
- Production environments: All east-west traffic blocked by default; allow-listing per application flow
- Cloud environments: Security Groups / NSGs with least-privilege allow rules only
- Servers must not have public IPs (use load balancers + private link)

## Compliance Mapping
| Framework | Zero-Trust Requirement |
|---|---|
| ISO 27001:2022 | A.8.3 Information access restriction |
| NIST CSF 2.0 | PR.AA (Access Control), PR.IR (Isolation) |
| ACSC Essential 8 | Multi-factor Authentication (MFA) maturity level |
| PCI DSS v4.0 | Requirement 1 (network security), Requirement 8 (identity) |`,
  },
  {
    title: "Peppol E-Invoicing Integration Pattern",
    category: "pattern",
    owner: "Finance Technology Architecture",
    status: "published",
    technologies: ["Peppol BIS 3.0", "SAP S/4HANA", "MuleSoft Anypoint", "Azure Service Bus", "AS4 Messaging"],
    tags: ["e-invoicing", "peppol", "regulatory", "finance", "edi", "ato", "compliance"],
    externalUrl: null,
    content: `## Overview
The Peppol E-Invoicing pattern describes the approved architecture for compliant electronic invoice exchange over the Peppol network. It covers ANZ (ATO mandate) and EU (EN 16931) requirements and is the reference design for all projects implementing e-invoicing capability.

## Regulatory Context
- **Australia (ATO)**: Peppol BIS Billing 3.0 mandatory for B2B transactions with registered trading partners. Peppol Access Point (AP) accreditation required.
- **European Union**: EN 16931 standard (UBL 2.1 or CII D16B syntax). Receiving e-invoices mandatory for public sector suppliers in most EU member states.
- **Compliance deadline**: Check ATO and relevant EU authority mandates for current obligations.

## Architecture
\`\`\`
[SAP S/4HANA FI]
      ↓ iDoc / BAPI (via MuleSoft)
[Enterprise Integration Platform (MuleSoft)]
      ↓ Transform to UBL 2.1 / Peppol BIS 3.0
[Peppol Access Point (Certified AP Provider)]
      ↓ AS4 over Peppol network
[Trading Partner's AP]
      ↓
[Trading Partner ERP]
\`\`\`

## Approved AP Providers (Shortlist)
| Provider | Region | SAP Certified | Notes |
|---|---|---|---|
| Tickstar (Pagero) | ANZ, EU | Yes | Recommended — native SAP connector |
| Ecosio | EU | Yes | Strong EU mandate coverage |
| Ariba Network | Global | Yes | For SAP-to-SAP trading partners |

## Integration Standards
1. **SAP Integration**: MuleSoft Anypoint Platform is the mandatory middleware. Native RFC/BAPI calls from SAP to MuleSoft. SOAP/RFC direct-to-AP is prohibited (conflicts with API-first standard).
2. **Message Format**: UBL 2.1 for ANZ and EU. No proprietary formats.
3. **Validation**: Schema validation and Schematron rules applied at MuleSoft layer before submission to AP.
4. **Error Handling**: Failed invoices must not silently drop — route to Azure Service Bus DLQ with alerting.
5. **Audit Trail**: All invoice events (sent, acknowledged, rejected) must be logged to the enterprise audit store with 7-year retention.

## Data Sovereignty
- ANZ invoice data: must remain in ap-southeast-2 (AWS Sydney) or Australia East (Azure)
- EU invoice data: must remain within EU boundary — do not replicate to ANZ infrastructure
- PII in invoice fields (ABN, IBAN, address): classified HIGH; GDPR/Privacy Act controls apply

## GDPR vs. Tax Retention Conflict
GDPR Art. 17 (right to erasure) conflicts with ATO/EU tax retention obligations (typically 7 years). Resolution: tax document retention obligation overrides erasure requests for invoice data. Legal must be consulted before any erasure of invoice records. Document this as a privacy exception in the system's DPIA.`,
  },
  {
    title: "ML Model Lifecycle Management",
    category: "best_practice",
    owner: "AI/ML Architecture CoE",
    status: "published",
    technologies: ["MLflow", "AWS SageMaker", "Azure Machine Learning", "Databricks MLflow", "Feature Store", "Evidently AI"],
    tags: ["ai", "ml", "mlops", "governance", "model-management", "responsible-ai"],
    externalUrl: null,
    content: `## Overview
This pattern defines the approved MLOps lifecycle for machine learning models from experiment to production, covering governance gates, monitoring, and responsible AI controls required for enterprise deployment.

## Why This Matters
ML models degrade over time (data drift, concept drift). Without structured lifecycle management, models in production can silently produce biased, inaccurate, or non-compliant outputs. This pattern provides guardrails to detect and respond to model degradation before it causes business harm.

## ML Model Risk Tiers
| Tier | Criteria | Governance Required |
|---|---|---|
| Tier 1 – Critical | Output influences financial decisions, HR decisions, or regulatory filings | ARC Deep Dive + Ethics Review + CISO sign-off |
| Tier 2 – High | Customer-facing personalisation, credit, pricing | ARC Standard Review + Model Card + Bias Assessment |
| Tier 3 – Operational | Internal tooling, operational optimisation | ARC Light Review + Model Card |
| Tier 4 – Experimental | PoC / R&D (not in production) | No ARC required; register in AI Inventory |

## Lifecycle Stages

### 1. Experiment & Development
- All experiments tracked in MLflow (Databricks-managed instance preferred)
- Training data must be documented: source, vintage, applied transformations
- Bias and fairness evaluation required before proceeding to review

### 2. Model Review (ARC Gate)
- **Model Card mandatory**: Documents model purpose, performance metrics, limitations, fairness evaluation, intended use, and out-of-scope uses
- **AI Risk Register entry**: All Tier 1–3 models logged in the enterprise AI risk register
- **Explainability**: SHAP or LIME feature importance required for Tier 1–2 models

### 3. Deployment
- Approved serving infrastructure: AWS SageMaker Endpoints, Azure ML Online Endpoints, or Databricks Model Serving
- A/B testing or shadow mode deployment recommended before full cutover
- Feature Store integration required for models sharing features across pipelines

### 4. Monitoring & Retraining
- **Data drift**: Evidently AI or SageMaker Model Monitor — alert at >15% PSI drift
- **Prediction drift**: Monitor output distribution weekly
- **Performance degradation**: Automated retraining trigger when accuracy drops below defined threshold
- **Retraining cadence**: Monthly minimum for Tier 1–2 models

## Responsible AI Requirements
- Bias evaluation: Required for any model processing protected attributes (gender, age, ethnicity, disability)
- Explainability: Users affected by a model decision have the right to an explanation (GDPR Art. 22)
- Human-in-the-loop: All Tier 1 decisions must have a human review step; models cannot be the sole decision-maker
- Opt-out mechanism: Customers must be able to opt out of automated decision-making`,
  },
];


const LEANIX_SEED = [
  {
    leanixId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Digital Agriculture Platform",
    description: "Enterprise initiative to build an IoT-enabled smart farming platform with sensor telemetry, agronomic analytics, and mobile grower advisory services.",
    lifecycle: "active",
    status: "Active",
    responsible: "Sarah Chen",
    tags: '["IoT","Cloud","Agriculture","Analytics"]',
    leanixUrl: "https://demo.leanix.net/pathfinder/factsheet/Project/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    leanixId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "MES Modernisation Programme",
    description: "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating OT/IT boundaries, SAP ERP, and quality management.",
    lifecycle: "plan",
    status: "Active",
    responsible: "James Walker",
    tags: '["Manufacturing","OT/IT","ERP","Integration"]',
    leanixUrl: "https://demo.leanix.net/pathfinder/factsheet/Project/b2c3d4e5-f6a7-8901-bcde-f12345678901",
  },
  {
    leanixId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "E-Invoicing Regulatory Compliance",
    description: "Implement government-mandated electronic invoicing across all operating regions to meet statutory compliance deadlines.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Priya Nair",
    tags: '["Regulatory","Finance","Compliance"]',
    leanixUrl: "https://demo.leanix.net/pathfinder/factsheet/Project/c3d4e5f6-a7b8-9012-cdef-123456789012",
  },
  {
    leanixId: "d4e5f6a7-b8c9-0123-def0-234567890123",
    name: "AI Marketing Personalisation Pilot",
    description: "Proof-of-concept AI/ML engine for customer-segment personalisation, content recommendations, and campaign targeting at scale.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Tom Reilly",
    tags: '["AI","ML","Marketing","Pilot"]',
    leanixUrl: "https://demo.leanix.net/pathfinder/factsheet/Project/d4e5f6a7-b8c9-0123-def0-234567890123",
  },
  {
    leanixId: "e5f6a7b8-c9d0-1234-ef01-345678901234",
    name: "Zero Trust Network Access Rollout",
    description: "Replace VPN-based remote access with identity-aware zero trust network access across the enterprise perimeter.",
    lifecycle: "active",
    status: "Active",
    responsible: "Mehak Singh",
    tags: '["Security","Zero Trust","Identity","Network"]',
    leanixUrl: "https://demo.leanix.net/pathfinder/factsheet/Project/e5f6a7b8-c9d0-1234-ef01-345678901234",
  },
];

const JIRA_SEED = [
  { jiraKey: "DAG-101", summary: "Digital Agriculture Platform", description: "End-to-end IoT-enabled platform for smart farming: sensor telemetry ingestion, agronomic analytics, and mobile advisory services for growers.", projectKey: "DAG", projectName: "Digital Agriculture", status: "In Progress", priority: "High", assignee: "sarah.chen@company.com", issueType: "Epic", labels: '["IoT","Cloud","Analytics"]', jiraUrl: "https://jira.company.com/browse/DAG-101" },
  { jiraKey: "MES-001", summary: "MES Modernisation – OT/IT Integration", description: "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating real-time production data with ERP and quality systems.", projectKey: "MES", projectName: "Manufacturing Execution System", status: "In Progress", priority: "Critical", assignee: "james.walker@company.com", issueType: "Epic", labels: '["OT","Manufacturing","ERP","Integration"]', jiraUrl: "https://jira.company.com/browse/MES-001" },
  { jiraKey: "EINV-001", summary: "E-Invoicing Regulatory Compliance", description: "Implement e-invoicing capability to meet government-mandated electronic invoicing requirements across all operating regions by the statutory deadline.", projectKey: "EINV", projectName: "E-Invoicing", status: "To Do", priority: "High", assignee: "priya.nair@company.com", issueType: "Epic", labels: '["Regulatory","Finance","Compliance"]', jiraUrl: "https://jira.company.com/browse/EINV-001" },
  { jiraKey: "AIM-001", summary: "AI Pilot – Marketing Personalisation Engine", description: "Proof-of-concept AI/ML personalisation engine to generate customer-segment-specific content recommendations, discount offers, and campaign targeting at scale.", projectKey: "AIM", projectName: "AI Pilot for Marketing", status: "To Do", priority: "Medium", assignee: "tom.reilly@company.com", issueType: "Epic", labels: '["AI","ML","Marketing","Pilot"]', jiraUrl: "https://jira.company.com/browse/AIM-001" },
];

const KPI_SEED = [
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Reference Architecture Adoption Rate", whatToMeasure: "% of solutions using approved reference architectures", howToMeasure: "Solutions aligned with approved patterns / Total solutions reviewed", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Standardization & Pattern Adoption", kpiName: "Architecture Exception Rate", whatToMeasure: "Architecture Exception Rate", howToMeasure: "# of approved deviations / Total solutions reviewed", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Security Findings Reduction", whatToMeasure: "Security Findings Reduction", howToMeasure: "Security Assessment results (Cyber Risk Team)", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Risk & Security Exposure Reduction", kpiName: "Compliance Audit Findings Reduction", whatToMeasure: "Compliance Audit Findings Reduction", howToMeasure: "Audit reports (Internal Audit Team)", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Delivery Cycle Time Improvement", whatToMeasure: "Delivery Cycle time improvement", howToMeasure: "Delivery time for projects using standard patterns vs without", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Post-Go-Live Change Volume", whatToMeasure: "Post-Go-Live Change Volume", howToMeasure: "No. of change requests and incidents recorded", status: "not_started" },
  { outcomeNumber: 1, outcomeName: "Ensure technology investments are built on approved patterns, reducing long-term operational cost, security exposure, and rework.", kpiCategory: "Delivery Efficiency & Cost Avoidance", kpiName: "Technology Sprawl Reduction", whatToMeasure: "Technology Sprawl Reduction", howToMeasure: "# of technologies reduced or consolidated", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "ADR Coverage", whatToMeasure: "Architecture Decision Records (ADR) coverage", howToMeasure: "% of significant architectural decisions captured as ADRs", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Architectural Knowledge Capture", kpiName: "Architecture Drift Detection", whatToMeasure: "Architecture Drift Detection", howToMeasure: "# of undocumented architecture changes discovered post-implementation", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Decision Reuse Rate", whatToMeasure: "Decision Reuse Rate", howToMeasure: "% of architecture reviews referencing existing ADRs", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Fast-Track Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of solutions approved with light or no review due to existing pattern", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Decision Traceability & Speed", kpiName: "Re-decision Avoidance", whatToMeasure: "Re-decision Avoidance", howToMeasure: "# of decisions not re-litigated because rationale is already documented", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Onboarding Time for New Architects", whatToMeasure: "Onboarding Time for New Architects", howToMeasure: "Time for new architect to confidently review existing solution", status: "not_started" },
  { outcomeNumber: 2, outcomeName: "Preserve architectural intent, accelerate future decision-making, and reduce dependency on individual knowledge.", kpiCategory: "Organizational Dependency Risk", kpiName: "Architecture Question Recurrence", whatToMeasure: "Architecture Question Recurrence", howToMeasure: "Frequency of repeated questions about the same architectural decisions", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Exception Approval Lead Time", whatToMeasure: "Exception Approval Lead Time", howToMeasure: "Average time to approve or reject architecture exception", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Lightweight Review Approval Rate", whatToMeasure: "Fast-Track Approval Rate", howToMeasure: "% of initiatives approved via lightweight review", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Delivery Flexibility", kpiName: "Delivery Block Rate", whatToMeasure: "Delivery Block Rate", howToMeasure: "% of initiatives delayed due to architecture indecision", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Registration Coverage", whatToMeasure: "Exception Registration Coverage", howToMeasure: "% of architecture deviations formally logged", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Visibility", kpiName: "Exception Traceability Completeness", whatToMeasure: "Exception Traceability Completeness", howToMeasure: "% of exceptions with complete metadata", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Exception Ownership Assignment Rate", whatToMeasure: "Exception Ownership Assignment Rate", howToMeasure: "% of deviations with named business or technical owner", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Deviation Ownership & Governance", kpiName: "Remediation Compliance Rate", whatToMeasure: "Remediation Compliance Rate", howToMeasure: "% of deviations retired or remediated within agreed timeframe", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Technical Debt Growth Rate", whatToMeasure: "Technical Debt Growth Rate", howToMeasure: "New deviations created vs resolved deviations", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Incident Cost Impact from Deviations", whatToMeasure: "Incident or Cost Impact Linked to Deviations", howToMeasure: "% incidents traced to known architecture deviations", status: "not_started" },
  { outcomeNumber: 3, outcomeName: "Enable delivery flexibility while ensuring deviations are visible, owned, and actively managed, preventing uncontrolled technical debt.", kpiCategory: "Technical Debt Containment", kpiName: "Debt Remediation Completion Rate", whatToMeasure: "Debt Remediation Completion Rate", howToMeasure: "% of planned architecture remediation actions completed", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Ownership Assignment Rate", whatToMeasure: "Risk Ownership Assignment Rate", howToMeasure: "% of identified architecture risks with formally assigned owner", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Explicit Risk Ownership", kpiName: "Risk Acceptance Documentation Coverage", whatToMeasure: "Risk Acceptance Documentation Coverage", howToMeasure: "% of accepted risks with documented rationale and approval", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Register Capture Rate", whatToMeasure: "Risk Register Capture Rate", howToMeasure: "% of architecture risks logged in central risk register", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Unregistered Risk Discovery Rate", whatToMeasure: "Unregistered Risk Discovery Rate", howToMeasure: "# risks discovered post-deployment that were never recorded", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Risk Visibility", kpiName: "Risk Identification Effectiveness", whatToMeasure: "Architecture Review Risk Identification Effectiveness", howToMeasure: "Average number of risks identified during design vs discovered later", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Risk Mitigation Progress Rate", whatToMeasure: "Risk Mitigation Progress Rate", howToMeasure: "% of risks with active mitigation plans tracked", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Active Risk Governance", kpiName: "Expired Risk Acceptance Detection", whatToMeasure: "Expired Risk Acceptance Detection", howToMeasure: "# risks exceeding review or acceptance expiry", status: "not_started" },
  { outcomeNumber: 4, outcomeName: "Make risk ownership explicit and prevent unacknowledged exposure from surfacing later as incidents or audit findings.", kpiCategory: "Incident & Audit Prevention", kpiName: "Audit Finding Traceability", whatToMeasure: "Audit Finding Traceability", howToMeasure: "% audit findings caused by unacknowledged architecture risk", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Decision Classification Coverage", whatToMeasure: "% of architecture submissions that include decision impact classification", howToMeasure: "ARR submissions with impact classification / Total ARR submissions", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Post-Implementation Escalation Rate", whatToMeasure: "Post-Implementation Escalation Rate", howToMeasure: "% of incidents or audit findings caused by decisions NOT reviewed by architecture governance", status: "not_started" },
  { outcomeNumber: 5, outcomeName: "Ensure high-impact architectural decisions are taken at the right level with full transparency of trade-offs and consequences.", kpiCategory: "Decision Governance", kpiName: "Re-Architecture Rate", whatToMeasure: "Re-Architecture Rate", howToMeasure: "Number of major rework efforts due to poor early design decisions", status: "not_started" },
];

router.get("/admin/seed-demo", async (req, res) => {
  const token = req.query["token"] || req.headers["x-seed-token"];
  if (token !== SEED_TOKEN) {
    res.status(401).json({ error: "Unauthorized – add ?token=arc-demo-seed-2026 to the URL" });
    return;
  }

  try {
    const results: Record<string, number> = {};

    // 1. Seed JIRA initiatives
    const jiraInserted = await db.insert(jiraInitiativesTable)
      .values(JIRA_SEED)
      .onConflictDoNothing()
      .returning();
    results.jiraInitiatives = jiraInserted.length;

    // 2. Look up the IDs for our 4 target initiatives
    const allJira = await db.select().from(jiraInitiativesTable);
    const jiraMap = Object.fromEntries(allJira.map(j => [j.jiraKey, j.id]));

    // 3. Seed architecture requests
    const existingRequests = await db.select().from(architectureRequestsTable);
    const existingTitles = new Set(existingRequests.map(r => r.title));

    const requests = [
      {
        title: "Digital Agriculture Platform – Grower IoT & Advisory",
        description: "Build a cloud-native IoT data platform that ingests telemetry from soil moisture, weather, and drone sensors deployed across grower properties, applies agronomic models, and surfaces planting and irrigation recommendations via a mobile advisory app.",
        businessUnit: "Agri-Digital Business Unit",
        submittedBy: "sarah.chen@company.com",
        sponsorProductOwner: "Michael Tan (Head of Digital Agriculture)",
        solutionArchitect: "Liam Foster",
        requestType: "new_application", status: "approved", priority: "high",
        businessContext: "Our grower network lacks real-time agronomic insights, leading to suboptimal yield decisions and reactive field interventions.",
        businessValueHypothesis: '["Increase average crop yield recommendations effectiveness by 15%","Reduce agronomist manual field visit workload by 40%","Enable data-driven planting and irrigation advisory at scale"]',
        businessCapability: '["Precision Agriculture","IoT Data Management","Grower Advisory Services"]',
        businessCriticality: "business_critical", costEstimate: "$2.8M",
        inScopeRegions: '["ANZ","Southeast Asia"]',
        expectedUserBase: "500 growers, 50 agronomists", deploymentModel: "cloud_saas", targetGoLiveDate: "2026-09-30",
        securityImpactLevel: "medium", securityImpactDetails: "External-facing mobile API requires robust auth (OAuth 2.0 / API Gateway).",
        dataImpactLevel: "medium", dataImpactDetails: "Agronomic data classified as business-sensitive. Grower property data requires consent management.",
        integrationImpactLevel: "high", integrationImpactDetails: "Integrates with IoT device management (AWS IoT Core), ERP for grower data, external weather APIs, and mobile advisory app.",
        regulatoryImpactLevel: "none", aiImpactLevel: "none",
        eaAssignee: "Jane Mitchell",
        eaSecurityRiskRating: "medium", eaDataComplexityRating: "medium", eaIntegrationComplexityRating: "high",
        eaRegulatoryRiskRating: "low", eaAiRiskRating: "none",
        eaOverallComplexity: "medium", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Integration Architecture","Infrastructure Architecture","Data Architecture","Security Architecture"]',
        eaRequiredSmes: '["Integration Architect","Cloud Infrastructure SME","Security Architect","Data Architect"]',
        eaArcSchedule: "2026-01-28 10:00:00",
        jiraInitiativeId: jiraMap["DAG-101"] || null, jiraKey: "DAG-101", phase: "ph1",
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
      {
        title: "MES Modernisation – OT/IT Integration & ERP Connectivity",
        description: "Replace the current legacy SCADA-linked MES with a modern cloud-connected Manufacturing Execution System that integrates real-time production data with SAP ERP, quality management systems, and the corporate data platform.",
        businessUnit: "Global Manufacturing Operations",
        submittedBy: "james.walker@company.com",
        sponsorProductOwner: "Angela Ross (VP Manufacturing Technology)",
        solutionArchitect: "Deepak Sharma",
        requestType: "application_replacement", status: "arc_scheduled", priority: "critical",
        businessContext: "The existing MES is end-of-vendor-support in Q3 2026. Unplanned downtime costs ~$1.2M/month and cannot be correlated to production events without significant manual investigation.",
        businessValueHypothesis: '["Reduce unplanned production downtime by 20%","Eliminate manual production data re-entry into SAP ERP","Enable real-time quality tracing from raw material to finished goods"]',
        businessCapability: '["Manufacturing Operations","Quality Management","OT/IT Integration","Supply Chain Visibility"]',
        businessCriticality: "mission_critical", costEstimate: "$5.4M",
        inScopeRegions: '["Europe","North America"]',
        expectedUserBase: "2,000 plant operators, 150 supervisors", deploymentModel: "hybrid", targetGoLiveDate: "2027-03-31",
        securityImpactLevel: "high", securityImpactDetails: "OT/IT convergence introduces significant attack surface. SCADA protocol bridging must be isolated via DMZ.",
        dataImpactLevel: "medium", dataImpactDetails: "Production batch records may fall under GMP regulatory retention requirements. Data sovereignty review needed for EU sites.",
        integrationImpactLevel: "high", integrationImpactDetails: "Integrates with SAP ERP, SCADA/OPC-UA bridge, quality management system, corporate Historian (OSIsoft PI).",
        regulatoryImpactLevel: "medium", regulatoryImpactDetails: "ISO 9001 quality data retention. US site may be subject to FDA 21 CFR Part 11.",
        aiImpactLevel: "none",
        eaAssignee: "Robert Brown",
        eaSecurityRiskRating: "high", eaDataComplexityRating: "medium", eaIntegrationComplexityRating: "high",
        eaRegulatoryRiskRating: "medium", eaAiRiskRating: "none",
        eaOverallComplexity: "high", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Security Architecture","Integration Architecture","Infrastructure Architecture","Data Architecture"]',
        eaRequiredSmes: '["OT/IT Security SME","SAP Integration Architect","Industrial Networking SME","Regulatory / GMP SME"]',
        eaArcSchedule: "2026-04-08 09:00:00",
        scopeNotes: `EA triage completed 12 March 2026. Classified as MISSION CRITICAL / DEEP DIVE — highest risk profile in the current ARR portfolio.

Primary risk vectors:

1. OT/IT Security Boundary: Bridging OT (SCADA/OPC-UA) and IT (SAP ERP) networks is a significant security boundary crossing. A dedicated DMZ with protocol break (OPC-UA Proxy → REST/MQTT) is mandatory per the enterprise security standard. The OT/IT Security SME from Cyber Risk must participate in ARC — this is a non-negotiable attendance requirement.

2. SAP ERP Integration Pattern: The proposed real-time production order confirmation via SAP PP/QM IDocs has not been used at this scale in our environment. The SAP Integration Architect must review the proposed design against the enterprise integration platform (MuleSoft) and confirm whether a new integration pattern approval is required.

3. Regulatory / GMP (FDA 21 CFR Part 11): North American sites producing regulated medical devices must comply with FDA 21 CFR Part 11 for electronic batch records. The MES vendor's Part 11 validation pack must be reviewed by the Regulatory/GMP SME before ARC sign-off can be granted.

4. Data Sovereignty (EU GDPR): Production batch records for EU sites must not be replicated to US-hosted cloud components. The data residency architecture must be explicitly documented in the Integration view — this has not yet been addressed in the submission.

5. Vendor shortlist: Project has shortlisted Sight Machine and Rockwell FactoryTalk. EA will assess both against enterprise reference architecture as part of the ARC review — vendor scoring matrix to be presented at the session.

ARC Review confirmed: 8 April 2026, 09:00 AEST (Conference Room B / Teams bridge).
Required attendees: James Walker (PM), Deepak Sharma (SA), Angela Ross (Sponsor), OT/IT Security SME, SAP Integration Architect, Industrial Networking SME, Regulatory/GMP SME.`,
        jiraInitiativeId: jiraMap["MES-001"] || null, jiraKey: "MES-001", phase: "ph1",
        createdAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        title: "E-Invoicing Regulatory Compliance Implementation",
        description: "Implement a statutory e-invoicing capability to comply with government-mandated electronic invoicing regulations across Australia (ATO Peppol network) and selected European jurisdictions (EN 16931 standard).",
        businessUnit: "Finance & Corporate Technology",
        submittedBy: "priya.nair@company.com",
        sponsorProductOwner: "Karen Lewis (CFO Office)",
        solutionArchitect: null,
        requestType: "new_capability", status: "ea_triage", priority: "high",
        businessContext: "ATO and several EU member states have issued mandates requiring businesses to exchange invoices electronically. Non-compliance will result in penalties and potential loss of government contracts.",
        businessValueHypothesis: '["Achieve full compliance with ATO e-invoicing mandate by January 2027","Reduce invoice processing cost per document by 30%","Enable Straight-Through Processing (STP) for 80% of supplier invoices"]',
        businessCapability: '["Finance & Accounts Payable","Accounts Receivable","Regulatory Compliance"]',
        businessCriticality: "business_critical", costEstimate: "$1.2M",
        inScopeRegions: '["ANZ","Europe"]',
        expectedUserBase: "80 finance staff, 1,200 suppliers", deploymentModel: "cloud_saas", targetGoLiveDate: "2026-12-31",
        securityImpactLevel: "medium", securityImpactDetails: "Financial transaction data transmitted over public Peppol network. TLS 1.3 and message-level encryption required.",
        dataImpactLevel: "high", dataImpactDetails: "Invoice data contains financial PII (ABN/VAT numbers, bank account details). GDPR Art. 17 conflicts with tax record retention obligations.",
        integrationImpactLevel: "medium", integrationImpactDetails: "Integrates with SAP S/4HANA (FI module), Peppol Access Point provider, EU national e-invoicing platforms.",
        regulatoryImpactLevel: "high", regulatoryImpactDetails: "ATO Peppol accreditation required. EU: EN 16931 standard. Australia: RCTI rules, GST compliance. Privacy Act 2025 applies.",
        aiImpactLevel: "none",
        eaAssignee: "Mehak Suri",
        eaSecurityRiskRating: "medium", eaDataComplexityRating: "high", eaIntegrationComplexityRating: "medium",
        eaRegulatoryRiskRating: "high", eaAiRiskRating: "none",
        eaOverallComplexity: "high", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Data Architecture","Integration Architecture","Compliance & Regulatory","Infrastructure / Cloud Architecture"]',
        eaRequiredSmes: '["SAP Integration Architect","Data Privacy SME (GDPR / Privacy Act)","Compliance & Legal SME","Security Architect"]',
        scopeNotes: `Initial triage completed 18 March 2026. Classified as HIGH RISK / DEEP DIVE based on dual-jurisdiction regulatory exposure and direct SAP S/4HANA integration dependency.

Key concerns identified:

1. Regulatory dual-track risk: ATO Peppol accreditation requires a certified Access Point (AP). AP provider selection has not been confirmed — this is on the critical path to go-live by Dec 2026.

2. GDPR / Privacy Act data residency: Invoice PII (ABN, bank account details) must not leave the jurisdiction of origin. Cloud hosting region selection for ANZ vs. EU instances must be validated before vendor is engaged.

3. SAP S/4HANA coupling: The proposed approach (SOAP/RFC via middleware) conflicts with the enterprise API-first standard. An architecture exception will likely be required and must be raised before ARC.

4. Supplier onboarding gap: 1,200 suppliers require Peppol network onboarding. No self-service portal has been proposed — this must be addressed in the solution architecture.

Pre-ARC deliverables required from project team:
- Draft solution architecture (Application + Integration views)
- Peppol Access Point provider shortlist with vendor assessment
- Data residency and GDPR DPIA outline
- SAP integration approach paper and exception request (if proceeding with SOAP/RFC)

ARC review targeting Q2 2026 pending receipt of above.`,
        jiraInitiativeId: jiraMap["EINV-001"] || null, jiraKey: "EINV-001", phase: "ph1",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        title: "AI Personalisation Engine – Marketing Pilot",
        description: "Design and deploy a proof-of-concept AI/ML personalisation engine that generates customer-segment-specific content recommendations, dynamic discount offers, and campaign targeting signals across ANZ and UK digital channels.",
        businessUnit: "Digital Marketing & Customer Experience",
        submittedBy: "tom.reilly@company.com",
        sponsorProductOwner: "Fiona Blake (CMO)",
        solutionArchitect: "Aisha Rahman",
        requestType: "technology_selection", status: "ea_triage", priority: "medium",
        businessContext: "Our current marketing campaigns are segment-based with no real-time personalisation. This pilot will validate the business case for a full personalisation platform investment.",
        businessValueHypothesis: '["Improve digital campaign conversion rate by 25% vs control group","Reduce manual marketing segmentation effort by 60%","Produce a board-ready business case for full platform investment"]',
        businessCapability: '["Customer Marketing","AI/ML Enablement","Digital Personalisation"]',
        businessCriticality: "business_valuable", costEstimate: "$450K",
        inScopeRegions: '["ANZ","UK"]',
        expectedUserBase: "15 marketing analysts, 3 data scientists, 2M+ customer profiles", deploymentModel: "cloud_managed", targetGoLiveDate: "2026-08-31",
        securityImpactLevel: "medium", securityImpactDetails: "AI Act (EU) preliminary scoping required. Model outputs must not reveal protected characteristics.",
        dataImpactLevel: "high", dataImpactDetails: "Processes customer PII. GDPR/Privacy Act consent required for behavioural profiling. Data minimisation controls required.",
        integrationImpactLevel: "low", integrationImpactDetails: "Reads from CDP via batch API. Writes recommendation signals to CRM and email platform.",
        regulatoryImpactLevel: "medium", regulatoryImpactDetails: "GDPR Art. 22 – personalised offers require explainability and opt-out. Privacy Act 2025 (AU).",
        aiImpactLevel: "high", aiImpactDetails: "ML models trained on customer behavioural data. Bias and fairness testing mandatory. Model card and AI risk register entry required.",
        eaAssignee: "Jane Mitchell",
        eaSecurityRiskRating: "medium", eaDataComplexityRating: "high", eaIntegrationComplexityRating: "low",
        eaRegulatoryRiskRating: "medium", eaAiRiskRating: "high",
        eaOverallComplexity: "high", eaOverallRiskLevel: "high", eaReviewType: "deep_dive",
        eaRequiredArchitectureViews: '["Application Architecture","Data Architecture","AI/ML Architecture","Security Architecture"]',
        eaRequiredSmes: '["AI/ML Architect","Data Privacy SME","Security Architect","Customer Data Platform SME"]',
        jiraInitiativeId: jiraMap["AIM-001"] || null, jiraKey: "AIM-001", phase: "ph1",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
    ];

    let requestsInserted = 0;
    for (const req of requests) {
      if (!existingTitles.has(req.title)) {
        await db.insert(architectureRequestsTable).values(req as any);
        requestsInserted++;
      }
    }
    results.architectureRequests = requestsInserted;

    // 4. Always enrich E-Invoicing and MES with full EA triage content (idempotent update)
    const einvEnrich = {
      status: "ea_triage",
      eaAssignee: "Mehak Suri",
      eaSecurityRiskRating: "medium",
      eaDataComplexityRating: "high",
      eaIntegrationComplexityRating: "medium",
      eaRegulatoryRiskRating: "high",
      eaAiRiskRating: "none",
      eaOverallComplexity: "high",
      eaOverallRiskLevel: "high",
      eaReviewType: "deep_dive",
      eaRequiredArchitectureViews: JSON.stringify(["Application Architecture","Data Architecture","Integration Architecture","Compliance & Regulatory","Infrastructure / Cloud Architecture"]),
      eaRequiredSmes: JSON.stringify(["SAP Integration Architect","Data Privacy SME (GDPR / Privacy Act)","Compliance & Legal SME","Security Architect"]),
      scopeNotes: `Initial triage completed 18 March 2026. Classified as HIGH RISK / DEEP DIVE based on dual-jurisdiction regulatory exposure and direct SAP S/4HANA integration dependency.

Key concerns identified:

1. Regulatory dual-track risk: ATO Peppol accreditation requires a certified Access Point (AP). AP provider selection has not been confirmed — this is on the critical path to go-live by Dec 2026.

2. GDPR / Privacy Act data residency: Invoice PII (ABN, bank account details) must not leave the jurisdiction of origin. Cloud hosting region selection for ANZ vs. EU instances must be validated before vendor is engaged.

3. SAP S/4HANA coupling: The proposed approach (SOAP/RFC via middleware) conflicts with the enterprise API-first standard. An architecture exception will likely be required and must be raised before ARC.

4. Supplier onboarding gap: 1,200 suppliers require Peppol network onboarding. No self-service portal has been proposed — this must be addressed in the solution architecture.

Pre-ARC deliverables required from project team:
- Draft solution architecture (Application + Integration views)
- Peppol Access Point provider shortlist with vendor assessment
- Data residency and GDPR DPIA outline
- SAP integration approach paper and exception request (if proceeding with SOAP/RFC)

ARC review targeting Q2 2026 pending receipt of above.`,
      updatedAt: new Date(),
    };

    const mesEnrich = {
      scopeNotes: `EA triage completed 12 March 2026. Classified as MISSION CRITICAL / DEEP DIVE — highest risk profile in the current ARR portfolio.

Primary risk vectors:

1. OT/IT Security Boundary: Bridging OT (SCADA/OPC-UA) and IT (SAP ERP) networks is a significant security boundary crossing. A dedicated DMZ with protocol break (OPC-UA Proxy → REST/MQTT) is mandatory per the enterprise security standard. The OT/IT Security SME from Cyber Risk must participate in ARC — this is a non-negotiable attendance requirement.

2. SAP ERP Integration Pattern: The proposed real-time production order confirmation via SAP PP/QM IDocs has not been used at this scale in our environment. The SAP Integration Architect must review the proposed design against the enterprise integration platform (MuleSoft) and confirm whether a new integration pattern approval is required.

3. Regulatory / GMP (FDA 21 CFR Part 11): North American sites producing regulated medical devices must comply with FDA 21 CFR Part 11 for electronic batch records. The MES vendor's Part 11 validation pack must be reviewed by the Regulatory/GMP SME before ARC sign-off can be granted.

4. Data Sovereignty (EU GDPR): Production batch records for EU sites must not be replicated to US-hosted cloud components. The data residency architecture must be explicitly documented in the Integration view — this has not yet been addressed in the submission.

5. Vendor shortlist: Project has shortlisted Sight Machine and Rockwell FactoryTalk. EA will assess both against enterprise reference architecture as part of the ARC review — vendor scoring matrix to be presented at the session.

ARC Review confirmed: 8 April 2026, 09:00 AEST (Conference Room B / Teams bridge).
Required attendees: James Walker (PM), Deepak Sharma (SA), Angela Ross (Sponsor), OT/IT Security SME, SAP Integration Architect, Industrial Networking SME, Regulatory/GMP SME.`,
      updatedAt: new Date(),
    };

    const einvUpdated = await db.update(architectureRequestsTable)
      .set(einvEnrich as any)
      .where(eq(architectureRequestsTable.jiraKey, "EINV-001"))
      .returning();
    const mesUpdated = await db.update(architectureRequestsTable)
      .set(mesEnrich as any)
      .where(eq(architectureRequestsTable.jiraKey, "MES-001"))
      .returning();
    results.enriched = einvUpdated.length + mesUpdated.length;

    // 5. Seed KPIs if empty
    const existingKpis = await db.select().from(kpiMetricsTable).limit(1);
    if (existingKpis.length === 0) {
      await db.insert(kpiMetricsTable).values(KPI_SEED);
      results.kpiMetrics = KPI_SEED.length;
    } else {
      results.kpiMetrics = 0;
    }

    // 6. Seed LeanIX initiatives — upsert demo data for initiatives page / Submit ARR flow
    const now = new Date();
    for (const item of LEANIX_SEED) {
      const existing = await db
        .select({ id: leanixInitiativesTable.id })
        .from(leanixInitiativesTable)
        .where(eq(leanixInitiativesTable.leanixId, item.leanixId));
      if (existing.length === 0) {
        await db.insert(leanixInitiativesTable).values({ ...item, syncedAt: now });
      } else {
        await db
          .update(leanixInitiativesTable)
          .set({ ...item, syncedAt: now })
          .where(eq(leanixInitiativesTable.leanixId, item.leanixId));
      }
    }
    results.leanixInitiatives = LEANIX_SEED.length;

    // 7. Seed Architecture Patterns — always delete and re-insert to ensure sample data is present
    const patternsToInsert = PATTERNS_SEED.map(p => ({
      ...p,
      tags: JSON.stringify(p.tags),
      technologies: JSON.stringify(p.technologies),
    }));
    const seedTitles = patternsToInsert.map(p => p.title);
    await db.delete(knowledgeBaseArticlesTable)
      .where(inArray(knowledgeBaseArticlesTable.title, seedTitles));
    await db.insert(knowledgeBaseArticlesTable).values(patternsToInsert as any);
    results.architecturePatterns = PATTERNS_SEED.length;

    res.json({ success: true, seeded: results, message: "Demo data seeded successfully." });
  } catch (err: any) {
    res.status(500).json({ error: "Seed failed", detail: err.message });
  }
});

export default router;
