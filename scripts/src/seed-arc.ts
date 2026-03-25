import { db } from "@workspace/db";
import {
  architectureRequestsTable,
  arcSessionsTable,
  reviewOutcomesTable,
} from "@workspace/db";

async function seed() {
  console.log("Seeding ARC portal data...");

  await db.delete(reviewOutcomesTable);
  await db.delete(arcSessionsTable);
  await db.delete(architectureRequestsTable);

  const requests = await db.insert(architectureRequestsTable).values([
    {
      title: "Cloud Migration: SAP ERP to Azure",
      description: "Migration of on-premise SAP ERP system to Azure cloud infrastructure. This involves lifting the existing SAP S/4HANA workloads to Azure VMs with DR setup in secondary region.",
      requestType: "replacement_migration",
      phase: "ph2",
      submittedBy: "Tarun Mehta",
      businessUnit: "Finance & Operations",
      status: "approved",
      priority: "critical",
      eaAssignee: "Leila Hassan",
      architectureSpecifications: "Azure Landing Zone with hub-spoke topology. SAP on Azure certified VMs (M-series). HA/DR with Azure Site Recovery. SAP HANA Large Instances for OLAP workloads.",
      scopeNotes: "Scope includes infrastructure, networking, security, and monitoring. SAP customizations out of scope.",
      updatedAt: new Date("2026-03-01T10:00:00Z"),
      createdAt: new Date("2026-02-10T09:00:00Z"),
    },
    {
      title: "API Gateway Introduction - MuleSoft",
      description: "Introduce MuleSoft Anypoint Platform as the enterprise API gateway to manage internal and external API traffic, enforce security policies, and enable API monetization.",
      requestType: "new_technology",
      phase: "ph1",
      submittedBy: "Pradeep Kumar",
      businessUnit: "Integration Architecture",
      status: "arc_review",
      priority: "high",
      eaAssignee: "Mehak Singh",
      architectureSpecifications: "MuleSoft Anypoint Platform CloudHub 2.0 deployment. OAuth 2.0/OIDC for auth. Rate limiting and API throttling policies. Developer portal for self-service API discovery.",
      scopeNotes: "Pilot with 5 internal APIs. Salesforce and SAP connectors in scope.",
      updatedAt: new Date("2026-03-15T14:00:00Z"),
      createdAt: new Date("2026-03-01T11:00:00Z"),
    },
    {
      title: "New CRM Platform - Salesforce Sales Cloud",
      description: "Replace legacy in-house CRM with Salesforce Sales Cloud to improve sales team efficiency, pipeline visibility, and customer data management.",
      requestType: "replacement_migration",
      phase: "ph2",
      submittedBy: "Jay Singh",
      businessUnit: "Sales & Marketing",
      status: "specifications_required",
      priority: "high",
      eaAssignee: "Mehak Singh",
      scopeNotes: "Initial triage complete. Need full data migration plan and integration specs for ERP connection.",
      updatedAt: new Date("2026-03-18T09:00:00Z"),
      createdAt: new Date("2026-03-10T09:30:00Z"),
    },
    {
      title: "D2C E-commerce Platform Launch",
      description: "New direct-to-consumer e-commerce capability using Commercetools headless commerce. This is a new capability — no existing platform to migrate from.",
      requestType: "new_capability",
      phase: "ph1",
      submittedBy: "Kiran Patel",
      businessUnit: "Digital & E-commerce",
      status: "arc_scheduled",
      priority: "high",
      eaAssignee: "Leila Hassan",
      architectureSpecifications: "Commercetools headless commerce. React frontend. Stripe payments. Algolia search. CDN via CloudFront. Microservices for order management.",
      scopeNotes: "New greenfield capability. Full architecture review required.",
      updatedAt: new Date("2026-03-20T15:00:00Z"),
      createdAt: new Date("2026-03-12T10:00:00Z"),
    },
    {
      title: "Data Lake on AWS - Analytics Expansion",
      description: "Expand analytics capability by building a centralized data lake on AWS S3 with Glue ETL and Athena for ad-hoc querying. Supports BI tools like Power BI and Tableau.",
      requestType: "expansion",
      phase: "ph1",
      submittedBy: "Ritesh Sharma",
      businessUnit: "Data & Analytics",
      status: "ea_triage",
      priority: "medium",
      updatedAt: new Date("2026-03-22T11:00:00Z"),
      createdAt: new Date("2026-03-20T14:00:00Z"),
    },
    {
      title: "M&A Technology Assessment - TechCo Acquisition",
      description: "Technology landscape assessment for the proposed acquisition of TechCo Inc. Evaluate architecture compatibility, technical debt, and integration complexity.",
      requestType: "ma_assessment",
      phase: "ph3",
      submittedBy: "Tommy Evans",
      businessUnit: "Corporate Strategy",
      status: "submitted",
      priority: "critical",
      updatedAt: new Date("2026-03-24T16:00:00Z"),
      createdAt: new Date("2026-03-24T16:00:00Z"),
    },
    {
      title: "ServiceNow ITSM Upgrade & Expansion",
      description: "Upgrade ServiceNow from Utah to Vancouver release and expand to include HRSD and SecOps modules. Routine upgrade with new module additions.",
      requestType: "expansion",
      phase: "ph3",
      submittedBy: "Jeff Park",
      businessUnit: "IT Operations",
      status: "approved_with_conditions",
      priority: "medium",
      eaAssignee: "Leila Hassan",
      architectureSpecifications: "ServiceNow Vancouver release. HRSD module for HR service delivery. SecOps for vulnerability management. Integration with Active Directory and existing CMDB.",
      scopeNotes: "Upgrade is routine. HRSD and SecOps modules require pattern review.",
      updatedAt: new Date("2026-03-05T12:00:00Z"),
      createdAt: new Date("2026-02-20T09:00:00Z"),
    },
  ]).returning();

  const sessions = await db.insert(arcSessionsTable).values([
    {
      requestId: requests[0].id,
      scheduledDate: new Date("2026-02-20T14:00:00Z"),
      duration: 90,
      status: "completed",
      attendees: JSON.stringify(["Tommy Evans", "Leila Hassan", "Mehak Singh", "Pradeep Kumar", "Jeff Park", "Tarun Mehta"]),
      notes: "Session completed. Full review of SAP Azure architecture. Migration plan approved with mandatory HA validation checkpoint at 50% migration.",
    },
    {
      requestId: requests[1].id,
      scheduledDate: new Date("2026-03-26T10:00:00Z"),
      duration: 75,
      status: "scheduled",
      attendees: JSON.stringify(["Tommy Evans", "Leila Hassan", "Mehak Singh", "Pradeep Kumar", "Ritesh Sharma"]),
      notes: "Review of MuleSoft API Gateway architecture. Focus on security model, rate limiting, and integration patterns.",
    },
    {
      requestId: requests[3].id,
      scheduledDate: new Date("2026-04-02T13:00:00Z"),
      duration: 75,
      status: "scheduled",
      attendees: JSON.stringify(["Tommy Evans", "Leila Hassan", "Kiran Patel", "Jay Singh", "Jeff Park"]),
      notes: "Initial review of D2C e-commerce platform architecture.",
    },
    {
      requestId: requests[6].id,
      scheduledDate: new Date("2026-03-04T10:00:00Z"),
      duration: 60,
      status: "completed",
      attendees: JSON.stringify(["Tommy Evans", "Leila Hassan", "Jeff Park", "Mehak Singh"]),
      notes: "ServiceNow upgrade approved. HRSD module approved. SecOps module requires additional security review before go-live.",
    },
  ]).returning();

  await db.insert(reviewOutcomesTable).values([
    {
      requestId: requests[0].id,
      sessionId: sessions[0].id,
      decision: "approved",
      outcomeType: "adr_update",
      adrReference: "ADR-2026-001: Cloud Migration Standard to Azure",
      nextSteps: "1. Complete Azure Landing Zone setup by March 15\n2. Begin SAP on Azure pilot with non-prod systems\n3. Validate HA/DR failover before production cutover",
      notes: "Architecture aligns with enterprise cloud strategy. Migration approved with standard governance checkpoints.",
      createdBy: "Tommy Evans",
      createdAt: new Date("2026-02-20T16:00:00Z"),
    },
    {
      requestId: requests[6].id,
      sessionId: sessions[3].id,
      decision: "approved_with_conditions",
      outcomeType: "deviation",
      exceptionOwner: "Jeff Park",
      remediationPlan: "SecOps module to undergo dedicated security architecture review with Cyber Risk team before go-live. Estimated 3-week review cycle. ServiceNow upgrade and HRSD module can proceed independently.",
      nextSteps: "1. Proceed with ServiceNow Vancouver upgrade\n2. Deploy HRSD module as planned\n3. Schedule SecOps security review with Cyber Risk team",
      notes: "Approved with condition that SecOps module security review is completed before production deployment.",
      createdBy: "Tommy Evans",
      createdAt: new Date("2026-03-04T12:00:00Z"),
    },
  ]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
