import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { jiraInitiativesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

// Simulated JIRA initiative data that would come from the real JIRA API
const SIMULATED_JIRA_INITIATIVES = [
  {
    jiraKey: "ARCH-1001",
    summary: "Cloud Migration: Core Banking to AWS",
    description: "Full migration of core banking platform from on-premise data centres to AWS. Includes compute, storage, and networking modernisation.",
    projectKey: "ARCH",
    projectName: "Architecture Initiatives",
    status: "In Progress",
    priority: "Critical",
    assignee: "Tarun Mehta",
    issueType: "Epic",
    labels: JSON.stringify(["cloud", "migration", "aws", "banking"]),
    jiraUrl: "https://company.atlassian.net/browse/ARCH-1001",
  },
  {
    jiraKey: "ARCH-1002",
    summary: "API Gateway Modernisation - MuleSoft Implementation",
    description: "Implement enterprise API gateway using MuleSoft Anypoint Platform to centralise API management, enforce security, and enable monetisation.",
    projectKey: "ARCH",
    projectName: "Architecture Initiatives",
    status: "To Do",
    priority: "High",
    assignee: "Pradeep Kumar",
    issueType: "Epic",
    labels: JSON.stringify(["api", "integration", "mulesoft", "gateway"]),
    jiraUrl: "https://company.atlassian.net/browse/ARCH-1002",
  },
  {
    jiraKey: "INFRA-2034",
    summary: "Data Lake Platform Build - AWS S3 + Glue",
    description: "Build a centralised data lake on AWS using S3, Glue ETL, and Athena to support advanced analytics and business intelligence.",
    projectKey: "INFRA",
    projectName: "Infrastructure Projects",
    status: "In Progress",
    priority: "High",
    assignee: "Ritesh Sharma",
    issueType: "Epic",
    labels: JSON.stringify(["data", "analytics", "aws", "s3", "glue"]),
    jiraUrl: "https://company.atlassian.net/browse/INFRA-2034",
  },
  {
    jiraKey: "DIGITAL-305",
    summary: "D2C E-commerce Platform - Commercetools Headless",
    description: "Launch a new direct-to-consumer e-commerce channel using Commercetools headless platform with React frontend.",
    projectKey: "DIGITAL",
    projectName: "Digital Transformation",
    status: "To Do",
    priority: "High",
    assignee: "Kiran Patel",
    issueType: "Epic",
    labels: JSON.stringify(["ecommerce", "d2c", "commercetools", "digital"]),
    jiraUrl: "https://company.atlassian.net/browse/DIGITAL-305",
  },
  {
    jiraKey: "CRM-118",
    summary: "Salesforce Sales Cloud CRM Replacement",
    description: "Replace legacy in-house CRM system with Salesforce Sales Cloud to improve sales pipeline visibility and customer data management.",
    projectKey: "CRM",
    projectName: "CRM Transformation",
    status: "In Progress",
    priority: "High",
    assignee: "Jay Singh",
    issueType: "Epic",
    labels: JSON.stringify(["crm", "salesforce", "sales", "migration"]),
    jiraUrl: "https://company.atlassian.net/browse/CRM-118",
  },
  {
    jiraKey: "ITSM-422",
    summary: "ServiceNow Vancouver Upgrade & HRSD Expansion",
    description: "Upgrade ServiceNow to Vancouver release and expand to HRSD and SecOps modules.",
    projectKey: "ITSM",
    projectName: "IT Service Management",
    status: "In Progress",
    priority: "Medium",
    assignee: "Jeff Park",
    issueType: "Story",
    labels: JSON.stringify(["servicenow", "itsm", "hrsd", "upgrade"]),
    jiraUrl: "https://company.atlassian.net/browse/ITSM-422",
  },
  {
    jiraKey: "STRAT-088",
    summary: "M&A Technology Due Diligence - TechCo Inc",
    description: "Technology landscape assessment and architecture compatibility review for proposed TechCo Inc acquisition.",
    projectKey: "STRAT",
    projectName: "Corporate Strategy",
    status: "To Do",
    priority: "Critical",
    assignee: "Tommy Evans",
    issueType: "Epic",
    labels: JSON.stringify(["ma", "due-diligence", "acquisition", "assessment"]),
    jiraUrl: "https://company.atlassian.net/browse/STRAT-088",
  },
  {
    jiraKey: "SEC-201",
    summary: "Zero Trust Network Architecture Implementation",
    description: "Implement zero trust security model across the enterprise network perimeter, replacing VPN-based access with identity-aware proxy.",
    projectKey: "SEC",
    projectName: "Security Initiatives",
    status: "To Do",
    priority: "Critical",
    assignee: "Mehak Singh",
    issueType: "Epic",
    labels: JSON.stringify(["security", "zero-trust", "network", "identity"]),
    jiraUrl: "https://company.atlassian.net/browse/SEC-201",
  },
  {
    jiraKey: "DIGITAL-318",
    summary: "Mobile App Replatform - React Native",
    description: "Replatform existing native iOS and Android apps to a single React Native codebase to reduce maintenance overhead.",
    projectKey: "DIGITAL",
    projectName: "Digital Transformation",
    status: "To Do",
    priority: "Medium",
    assignee: "Kiran Patel",
    issueType: "Epic",
    labels: JSON.stringify(["mobile", "react-native", "ios", "android"]),
    jiraUrl: "https://company.atlassian.net/browse/DIGITAL-318",
  },
  {
    jiraKey: "INFRA-2051",
    summary: "Kubernetes Container Platform Rollout",
    description: "Roll out enterprise Kubernetes platform on Azure AKS to standardise container workload management across all business units.",
    projectKey: "INFRA",
    projectName: "Infrastructure Projects",
    status: "In Progress",
    priority: "High",
    assignee: "Leila Hassan",
    issueType: "Epic",
    labels: JSON.stringify(["kubernetes", "containers", "aks", "azure", "devops"]),
    jiraUrl: "https://company.atlassian.net/browse/INFRA-2051",
  },
];

router.get("/jira/initiatives", async (req, res) => {
  try {
    const initiatives = await db.select().from(jiraInitiativesTable).orderBy(jiraInitiativesTable.jiraKey);
    res.json(initiatives.map(i => ({
      ...i,
      labels: JSON.parse(i.labels || "[]"),
      syncedAt: i.syncedAt.toISOString(),
      createdAt: i.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list JIRA initiatives");
    res.status(500).json({ error: "Failed to list JIRA initiatives" });
  }
});

router.post("/jira/sync", async (req, res) => {
  try {
    const now = new Date();
    let added = 0;
    let updated = 0;

    for (const initiative of SIMULATED_JIRA_INITIATIVES) {
      const existing = await db
        .select()
        .from(jiraInitiativesTable)
        .where(eq(jiraInitiativesTable.jiraKey, initiative.jiraKey));

      if (existing.length === 0) {
        await db.insert(jiraInitiativesTable).values({ ...initiative, syncedAt: now });
        added++;
      } else {
        await db
          .update(jiraInitiativesTable)
          .set({ ...initiative, syncedAt: now })
          .where(eq(jiraInitiativesTable.jiraKey, initiative.jiraKey));
        updated++;
      }
    }

    res.json({
      synced: SIMULATED_JIRA_INITIATIVES.length,
      added,
      updated,
      lastSyncedAt: now.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to sync JIRA initiatives");
    res.status(500).json({ error: "Failed to sync JIRA initiatives" });
  }
});

export default router;
