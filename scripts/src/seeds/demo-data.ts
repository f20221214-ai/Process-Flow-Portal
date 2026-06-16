export const LEANIX_SEED = [
  {
    leanixId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    name: "Digital Agriculture Platform",
    description:
      "Enterprise initiative to build an IoT-enabled smart farming platform with sensor telemetry, agronomic analytics, and mobile grower advisory services.",
    lifecycle: "active",
    status: "Active",
    responsible: "Sarah Chen",
    tags: '["IoT","Cloud","Agriculture","Analytics"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    leanixId: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    name: "MES Modernisation Programme",
    description:
      "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating OT/IT boundaries, SAP ERP, and quality management.",
    lifecycle: "plan",
    status: "Active",
    responsible: "James Walker",
    tags: '["Manufacturing","OT/IT","ERP","Integration"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/b2c3d4e5-f6a7-8901-bcde-f12345678901",
  },
  {
    leanixId: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    name: "E-Invoicing Regulatory Compliance",
    description:
      "Implement government-mandated electronic invoicing across all operating regions to meet statutory compliance deadlines.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Priya Nair",
    tags: '["Regulatory","Finance","Compliance"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/c3d4e5f6-a7b8-9012-cdef-123456789012",
  },
  {
    leanixId: "d4e5f6a7-b8c9-0123-def0-234567890123",
    name: "AI Marketing Personalisation Pilot",
    description:
      "Proof-of-concept AI/ML engine for customer-segment personalisation, content recommendations, and campaign targeting at scale.",
    lifecycle: "plan",
    status: "Active",
    responsible: "Tom Reilly",
    tags: '["AI","ML","Marketing","Pilot"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/d4e5f6a7-b8c9-0123-def0-234567890123",
  },
  {
    leanixId: "e5f6a7b8-c9d0-1234-ef01-345678901234",
    name: "Zero Trust Network Access Rollout",
    description:
      "Replace VPN-based remote access with identity-aware zero trust network access across the enterprise perimeter.",
    lifecycle: "active",
    status: "Active",
    responsible: "Mehak Singh",
    tags: '["Security","Zero Trust","Identity","Network"]',
    leanixUrl:
      "https://demo.leanix.net/pathfinder/factsheet/Project/e5f6a7b8-c9d0-1234-ef01-345678901234",
  },
] as const;

export const JIRA_SEED = [
  {
    jiraKey: "DAG-101",
    summary: "Digital Agriculture Platform",
    description:
      "End-to-end IoT-enabled platform for smart farming: sensor telemetry ingestion, agronomic analytics, and mobile advisory services for growers.",
    projectKey: "DAG",
    projectName: "Digital Agriculture",
    status: "In Progress",
    priority: "High",
    assignee: "sarah.chen@company.com",
    issueType: "Epic",
    labels: '["IoT","Cloud","Analytics"]',
    jiraUrl: "https://jira.company.com/browse/DAG-101",
  },
  {
    jiraKey: "MES-001",
    summary: "MES Modernisation – OT/IT Integration",
    description:
      "Replace legacy SCADA-linked MES with a cloud-connected Manufacturing Execution System integrating real-time production data with ERP and quality systems.",
    projectKey: "MES",
    projectName: "Manufacturing Execution System",
    status: "In Progress",
    priority: "Critical",
    assignee: "james.walker@company.com",
    issueType: "Epic",
    labels: '["OT","Manufacturing","ERP","Integration"]',
    jiraUrl: "https://jira.company.com/browse/MES-001",
  },
  {
    jiraKey: "EINV-001",
    summary: "E-Invoicing Regulatory Compliance",
    description:
      "Implement e-invoicing capability to meet government-mandated electronic invoicing requirements across all operating regions by the statutory deadline.",
    projectKey: "EINV",
    projectName: "E-Invoicing",
    status: "To Do",
    priority: "High",
    assignee: "priya.nair@company.com",
    issueType: "Epic",
    labels: '["Regulatory","Finance","Compliance"]',
    jiraUrl: "https://jira.company.com/browse/EINV-001",
  },
  {
    jiraKey: "AIM-001",
    summary: "AI Pilot – Marketing Personalisation Engine",
    description:
      "Proof-of-concept AI/ML personalisation engine to generate customer-segment-specific content recommendations, discount offers, and campaign targeting at scale.",
    projectKey: "AIM",
    projectName: "AI Pilot for Marketing",
    status: "To Do",
    priority: "Medium",
    assignee: "tom.reilly@company.com",
    issueType: "Epic",
    labels: '["AI","ML","Marketing","Pilot"]',
    jiraUrl: "https://jira.company.com/browse/AIM-001",
  },
  {
    jiraKey: "ARCH-1001",
    summary: "Cloud Migration: Core Banking to AWS",
    description: "Full migration of core banking platform from on-premise data centres to AWS.",
    projectKey: "ARCH",
    projectName: "Architecture Initiatives",
    status: "In Progress",
    priority: "Critical",
    assignee: "Tarun Mehta",
    issueType: "Epic",
    labels: '["cloud","migration","aws","banking"]',
    jiraUrl: "https://company.atlassian.net/browse/ARCH-1001",
  },
] as const;
