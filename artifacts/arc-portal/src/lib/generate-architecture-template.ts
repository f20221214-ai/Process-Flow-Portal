import type { ArchitectureRequest } from "@workspace/api-client-react";

function parseViews(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      // fall through
    }
  }
  return trimmed.split(",").map(s => s.trim()).filter(Boolean);
}

function formatLabel(val: string | null | undefined): string {
  if (!val) return "—";
  return val.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

function riskBadge(level: string | null | undefined): string {
  const l = (level || "").toLowerCase();
  const colors: Record<string, string> = {
    high: "#dc2626", medium: "#d97706", low: "#16a34a", critical: "#7c3aed", none: "#64748b"
  };
  const bg: Record<string, string> = {
    high: "#fef2f2", medium: "#fffbeb", low: "#f0fdf4", critical: "#f5f3ff", none: "#f8fafc"
  };
  const color = colors[l] || "#64748b";
  const bgColor = bg[l] || "#f8fafc";
  return `<span style="background:${bgColor};color:${color};border:1px solid ${color};padding:2px 10px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">${level || "—"}</span>`;
}

const VIEW_GUIDANCE: Record<string, { intro: string; sections: string[] }> = {
  "Solution Architecture": {
    intro: "Provides the overall architectural context for the solution, describing how the system fits into the enterprise landscape, its key components, and the high-level design decisions.",
    sections: [
      "System Context Diagram — Illustrate the system boundary, key actors, and external systems it interacts with.",
      "Container / Component Diagram — Break down the solution into major deployable components (e.g. frontend, API, database, integration layer). Show how they communicate.",
      "Key Design Decisions — Document significant architectural decisions with justification (e.g. technology choices, patterns selected).",
      "Technology Stack — List the primary technologies, frameworks, and platforms chosen.",
      "Quality Attributes — Describe how the design addresses key quality attributes (availability, scalability, performance, maintainability).",
      "Outstanding Risks & Open Issues — List known risks that need EA or ARC review resolution."
    ]
  },
  "Security Architecture": {
    intro: "Describes the security controls, threat mitigations, and identity/access model for the solution, addressing the identified security risks from the impact assessment.",
    sections: [
      "Threat Model — Identify the key threat actors, attack surfaces, and mitigations (STRIDE or equivalent).",
      "Identity & Access Management — Define the authentication mechanism, identity provider, role-based access controls, and privilege management approach.",
      "Network Security — Describe network segmentation, perimeter controls, WAF/DDoS, and encryption in transit.",
      "Data Protection — Specify encryption at rest requirements, key management, and data masking/tokenisation approach.",
      "Security Controls Summary — Tabulate the controls mapped to each identified threat.",
      "Penetration Testing & Security Review Plan — Outline when and what security testing will occur prior to go-live."
    ]
  },
  "Data Architecture": {
    intro: "Defines the data model, data flows, classification, retention, and governance approach for data within and around the solution.",
    sections: [
      "Data Classification — List all datasets/data entities and their classification (Public / Internal / Confidential / Regulated).",
      "Data Flow Diagram — Illustrate how data moves through the system: sources, transformations, destinations, and consumers.",
      "Data Residency — State where data is stored and processed, and confirm compliance with any residency or sovereignty requirements.",
      "Data Retention & Archival Policy — Define retention periods for each dataset and the approach to archival/deletion.",
      "Master Data & Reference Data — Identify any master data dependencies (e.g. SAP MDM, customer master) and how consistency is maintained.",
      "Data Quality & Lineage — Describe controls to ensure data quality and the ability to trace data lineage."
    ]
  },
  "Integration Architecture": {
    intro: "Describes the integration patterns, interfaces, and data exchange mechanisms used to connect this system with other enterprise and external systems.",
    sections: [
      "Integration Landscape Diagram — Show all systems this solution integrates with, the direction of data flow, and the integration technology.",
      "Integration Patterns Selected — Document the patterns used (e.g. API Gateway, Event-Driven, Batch ETL, Point-to-Point) and justify the choice against the Enterprise Integration Patterns library.",
      "API / Interface Specifications — List each interface: protocol (REST/SOAP/EDI/event), payload format, versioning approach, and authentication method.",
      "Error Handling & Retry Strategy — Describe how integration failures are detected, logged, retried, and escalated.",
      "SLA & Performance Requirements — Define latency, throughput, and availability requirements for each integration.",
      "Legacy / OT System Considerations — Describe any special handling required for legacy or operational technology systems."
    ]
  },
  "Compliance & Regulatory": {
    intro: "Documents how the solution meets its regulatory obligations, audit requirements, and compliance controls, addressing the regulatory risks identified in the impact assessment.",
    sections: [
      "Regulatory Obligations Register — List all applicable regulations, standards, and internal policies with the specific obligations they impose.",
      "Compliance Controls Mapping — Map each obligation to the specific technical and process controls that address it.",
      "Audit Trail & Logging — Define what events must be logged, the log retention period, and how audit trails are accessed.",
      "Data Privacy Controls — Describe consent management, data subject rights fulfilment (access, erasure, portability), and privacy-by-design measures.",
      "Regulatory Approvals Required — List any formal approvals, certifications, or licences that must be obtained before go-live.",
      "Ongoing Compliance Monitoring — Describe how continued compliance will be monitored, tested, and reported post go-live."
    ]
  },
  "AI/ML Architecture": {
    intro: "Describes the artificial intelligence and machine learning components of the solution, including model design, training data, governance, and explainability controls.",
    sections: [
      "AI/ML Use Case Summary — Describe precisely what the AI/ML system does, what inputs it takes, and what outputs it produces.",
      "Model Architecture — Specify the model type, framework, and training approach (supervised/unsupervised/generative, etc.).",
      "Training Data — Describe the training dataset: source, size, quality controls, data labelling approach, and any PII or sensitive data included.",
      "Inference & Serving Architecture — Show how the model is deployed, invoked, and integrated into the solution workflow.",
      "Human-in-the-Loop Controls — Define where human review is required before AI outputs trigger actions, and how overrides are handled.",
      "Explainability & Auditability — Describe how decisions can be explained to end users and auditors, and what audit trail is maintained.",
      "Model Monitoring & Drift Detection — Define how model performance is tracked over time and how degradation or bias is detected and remediated.",
      "AI Governance & Ethics Review — Reference any AI ethics review, bias assessment, or governance approval required."
    ]
  },
  "Infrastructure / Cloud Architecture": {
    intro: "Describes the infrastructure and cloud platform design, deployment topology, and operational model for the solution.",
    sections: [
      "Deployment Topology Diagram — Illustrate the target deployment environment: cloud regions, availability zones, VNETs/VPCs, subnets, and edge/CDN layers.",
      "Cloud Platform & Services — List the cloud platform (AWS/Azure/GCP), IaaS/PaaS/SaaS services selected, and their purpose.",
      "Landing Zone Compliance — Confirm the solution is deployed within the approved Cloud Landing Zone and describe any deviations.",
      "Networking & Connectivity — Define private endpoints, VPN/ExpressRoute connectivity, DNS strategy, and firewall rules.",
      "High Availability & Disaster Recovery — Specify the RTO/RPO targets and the HA/DR architecture that meets them.",
      "Scalability & Capacity Planning — Describe auto-scaling approach, peak capacity assumptions, and cost controls.",
      "FinOps & Cost Management — Provide cost estimate breakdown by service, tagging strategy, and budget alert thresholds.",
      "Infrastructure as Code — Confirm IaC tooling (Terraform/Bicep/CDK) and the deployment pipeline approach."
    ]
  }
};

function viewSection(viewName: string, request: ArchitectureRequest, triageData: Record<string, string>): string {
  const guidance = VIEW_GUIDANCE[viewName] || {
    intro: `Provide the ${viewName} documentation for this initiative.`,
    sections: [
      "Describe the key design decisions for this view.",
      "Provide diagrams and supporting detail appropriate for this architectural domain.",
      "Document any risks, constraints, or open issues relevant to this view."
    ]
  };

  const prePopulatedContext = getViewContext(viewName, request);
  const sectionRows = guidance.sections.map((s, i) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;width:36px;color:#94a3b8;font-size:11px;">${i + 1}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #e2e8f0;vertical-align:top;">
        <div style="font-weight:600;color:#1e293b;font-size:12px;margin-bottom:4px;">${s.split(" — ")[0]}</div>
        <div style="color:#64748b;font-size:11px;">${s.split(" — ")[1] || ""}</div>
        <div style="margin-top:10px;min-height:40px;border:1px dashed #cbd5e1;border-radius:6px;padding:10px;background:#fafafa;color:#94a3b8;font-size:11px;font-style:italic;">
          [ Author to complete ]
        </div>
      </td>
    </tr>
  `).join("");

  return `
    <div style="page-break-inside:avoid;margin-bottom:36px;">
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr>
          <td style="background:#1e3a5f;padding:12px 16px;border-radius:8px 8px 0 0;">
            <span style="color:#fff;font-weight:700;font-size:14px;">${viewName}</span>
          </td>
        </tr>
      </table>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden;margin-bottom:16px;">
        <div style="background:#f8fafc;padding:12px 16px;border-bottom:1px solid #e2e8f0;">
          <div style="color:#475569;font-size:11px;line-height:1.6;">${guidance.intro}</div>
        </div>
        ${prePopulatedContext ? `
        <div style="background:#eff6ff;padding:12px 16px;border-bottom:1px solid #dbeafe;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#2563eb;margin-bottom:4px;">Pre-Populated Context from ARR</div>
          <div style="color:#1e40af;font-size:11px;line-height:1.6;">${prePopulatedContext}</div>
        </div>` : ""}
        <div style="padding:12px 16px;background:#fffbeb;border-bottom:1px solid #fde68a;">
          <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;margin-bottom:4px;">Architecture Diagram</div>
          <div style="border:2px dashed #fcd34d;border-radius:6px;min-height:160px;display:flex;align-items:center;justify-content:center;color:#b45309;font-size:12px;font-style:italic;padding:24px;text-align:center;">
            [ Insert ${viewName} Diagram Here ]<br/>
            <span style="font-size:10px;display:block;margin-top:4px;">Recommended tool: draw.io, Lucidchart, or Visio</span>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;">
          ${sectionRows}
        </table>
      </div>
    </div>
  `;
}

function getViewContext(viewName: string, request: ArchitectureRequest): string {
  const parts: string[] = [];
  if (viewName === "Solution Architecture") {
    if (request.description) parts.push(`<strong>Description:</strong> ${request.description}`);
    if (request.businessContext) parts.push(`<strong>Business Context:</strong> ${request.businessContext}`);
    if (request.deploymentModel) parts.push(`<strong>Deployment Model:</strong> ${formatLabel(request.deploymentModel)}`);
    if (request.expectedUserBase) parts.push(`<strong>Expected User Base:</strong> ${request.expectedUserBase}`);
  }
  if (viewName === "Security Architecture" && request.securityImpactDetails) {
    parts.push(`<strong>Security Impact Assessment:</strong> ${request.securityImpactDetails}`);
  }
  if (viewName === "Data Architecture" && request.dataImpactDetails) {
    parts.push(`<strong>Data Impact Assessment:</strong> ${request.dataImpactDetails}`);
  }
  if (viewName === "Integration Architecture" && request.integrationImpactDetails) {
    parts.push(`<strong>Integration Impact Assessment:</strong> ${request.integrationImpactDetails}`);
  }
  if (viewName === "Compliance & Regulatory" && request.regulatoryImpactDetails) {
    parts.push(`<strong>Regulatory Impact Assessment:</strong> ${request.regulatoryImpactDetails}`);
  }
  if (viewName === "AI/ML Architecture" && request.aiImpactDetails) {
    parts.push(`<strong>AI/ML Impact Assessment:</strong> ${request.aiImpactDetails}`);
  }
  if (viewName === "Infrastructure / Cloud Architecture") {
    if (request.deploymentModel) parts.push(`<strong>Deployment Model:</strong> ${formatLabel(request.deploymentModel)}`);
    if (request.inScopeRegions?.length) parts.push(`<strong>In-Scope Regions:</strong> ${request.inScopeRegions.join(", ")}`);
  }
  return parts.join("<br/>");
}

export function generateArchitectureTemplate(
  request: ArchitectureRequest,
  triageData: Record<string, string>
): void {
  const views = parseViews(triageData.eaRequiredArchitectureViews || request.eaRequiredArchitectureViews || "");
  if (!views.includes("Solution Architecture")) views.unshift("Solution Architecture");

  const today = new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
  const reviewTypeLabel = formatLabel(triageData.eaReviewType || request.eaReviewType || "");
  const smesRaw = triageData.eaRequiredSmes || request.eaRequiredSmes || "";
  const smes = parseViews(smesRaw);
  const bvh: string[] = Array.isArray(request.businessValueHypothesis)
    ? request.businessValueHypothesis.map(formatLabel)
    : [];
  const regions = request.inScopeRegions || [];

  const riskTable = [
    ["Security Risk", triageData.eaSecurityRiskRating || request.eaSecurityRiskRating, request.securityImpactDetails],
    ["Data Complexity", triageData.eaDataComplexityRating || request.eaDataComplexityRating, request.dataImpactDetails],
    ["Integration Complexity", triageData.eaIntegrationComplexityRating || request.eaIntegrationComplexityRating, request.integrationImpactDetails],
    ["Regulatory Risk", triageData.eaRegulatoryRiskRating || request.eaRegulatoryRiskRating, request.regulatoryImpactDetails],
    ["AI / ML Risk", triageData.eaAiRiskRating || request.eaAiRiskRating, request.aiImpactDetails],
  ].map(([label, level, detail]) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:12px;font-weight:600;color:#334155;width:180px;">${label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${riskBadge(level as string)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#475569;">${detail || "—"}</td>
    </tr>
  `).join("");

  const viewSections = views.map(v => viewSection(v, request, triageData)).join("\n");

  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="UTF-8">
<title>Architecture Document — ${request.title}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  @page { margin: 2.5cm 2cm; }
  body { font-family: Calibri, Arial, sans-serif; color: #1e293b; font-size: 11pt; line-height: 1.5; margin: 0; padding: 0; background: #fff; }
  table { border-collapse: collapse; }
  .page-break { page-break-after: always; }
  h1 { font-size: 22pt; font-weight: 800; color: #0f172a; }
  h2 { font-size: 14pt; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 4px; margin-top: 28px; }
  h3 { font-size: 11pt; font-weight: 700; color: #334155; margin-top: 16px; }
  p { margin: 6px 0; }
  .label { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; font-weight: 700; }
  .value { font-size: 11pt; color: #1e293b; }
</style>
</head>
<body>

<!-- COVER PAGE -->
<div style="min-height:700px;display:flex;flex-direction:column;justify-content:space-between;padding:0;">
  <div style="background:#1e3a5f;padding:48px 48px 36px;margin:-0px;">
    <div style="color:#94a3b8;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;font-weight:600;margin-bottom:12px;">Architecture Review Process</div>
    <h1 style="color:#fff;font-size:26pt;font-weight:800;margin:0 0 8px 0;line-height:1.2;">${request.title}</h1>
    <div style="color:#93c5fd;font-size:13pt;font-weight:400;margin-top:4px;">Architecture Specification Document</div>
    <div style="margin-top:32px;display:flex;gap:32px;flex-wrap:wrap;">
      <div>
        <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">ARR Reference</div>
        <div style="color:#e2e8f0;font-size:12px;font-weight:600;margin-top:2px;">ARR-${String(request.id).padStart(4, "0")}</div>
      </div>
      <div>
        <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">Business Unit</div>
        <div style="color:#e2e8f0;font-size:12px;font-weight:600;margin-top:2px;">${request.businessUnit}</div>
      </div>
      <div>
        <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">Review Type</div>
        <div style="color:#e2e8f0;font-size:12px;font-weight:600;margin-top:2px;">${reviewTypeLabel || "—"}</div>
      </div>
      <div>
        <div style="color:#64748b;font-size:9px;text-transform:uppercase;letter-spacing:0.1em;">Document Date</div>
        <div style="color:#e2e8f0;font-size:12px;font-weight:600;margin-top:2px;">${today}</div>
      </div>
    </div>
  </div>

  <div style="padding:32px 48px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="width:50%;padding:0 24px 0 0;vertical-align:top;">
          <table style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <tr><td colspan="2" style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong style="font-size:11px;color:#334155;">Document Information</strong></td></tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;width:120px;">Version</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">0.1 — DRAFT</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Status</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">Draft — For EA Review</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Prepared by</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.solutionArchitect || request.submittedBy || "—"}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">EA Reviewer</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${triageData.eaAssignee || request.eaAssignee || "To be assigned"}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;">ARC Schedule</td>
              <td style="padding:8px 16px;font-size:11px;color:#1e293b;">${triageData.eaArcSchedule || request.eaArcSchedule || "To be confirmed"}</td>
            </tr>
          </table>
        </td>
        <td style="width:50%;padding:0 0 0 0;vertical-align:top;">
          <table style="width:100%;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;border-collapse:collapse;">
            <tr><td colspan="2" style="background:#f8fafc;padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong style="font-size:11px;color:#334155;">Overall Risk Profile</strong></td></tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;width:120px;">Overall Risk</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;">${riskBadge(triageData.eaOverallRiskLevel || request.eaOverallRiskLevel)}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Review Type</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${reviewTypeLabel || "—"}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Required Views</td>
              <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${views.length}</td>
            </tr>
            <tr>
              <td style="padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;">Required SMEs</td>
              <td style="padding:8px 16px;font-size:11px;color:#1e293b;">${smes.length > 0 ? smes.join(", ") : "—"}</td>
            </tr>
          </table>
          <div style="margin-top:12px;background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:12px 16px;">
            <div style="font-size:10px;font-weight:700;color:#c2410c;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Required Architecture Views</div>
            ${views.map((v, i) => `<div style="font-size:11px;color:#9a3412;padding:2px 0;">&#9632; ${v}</div>`).join("")}
          </div>
        </td>
      </tr>
    </table>
  </div>
</div>

<div class="page-break"></div>

<!-- SECTION 1: PROJECT OVERVIEW -->
<h2>1. Project Overview</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
  <tr style="background:#f8fafc;">
    <td colspan="2" style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"><strong style="font-size:11px;color:#334155;">Initiative Details</strong></td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;width:200px;">Initiative Name</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.title}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Request Type</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${formatLabel(request.requestType)}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Business Unit</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.businessUnit}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Business Criticality</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${formatLabel(request.businessCriticality)}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Cost Estimate</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${formatLabel(request.costEstimate)}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Deployment Model</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${formatLabel(request.deploymentModel)}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Target Go-Live</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.targetGoLiveDate || "To be confirmed"}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">In-Scope Regions</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${regions.length ? regions.join(", ") : "—"}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;font-size:10px;color:#64748b;font-weight:600;">Expected User Base</td>
    <td style="padding:8px 16px;font-size:11px;color:#1e293b;">${request.expectedUserBase || "—"}</td>
  </tr>
</table>

${request.description ? `<h3>1.1 Description</h3><p style="font-size:11px;color:#334155;line-height:1.7;">${request.description}</p>` : ""}
${request.businessContext ? `<h3>1.2 Business Context & Problem Statement</h3><p style="font-size:11px;color:#334155;line-height:1.7;">${request.businessContext}</p>` : ""}
${bvh.length ? `<h3>1.3 Business Value Hypothesis</h3><ul style="margin:4px 0 0 0;padding-left:20px;">${bvh.map(b => `<li style="font-size:11px;color:#334155;">${b}</li>`).join("")}</ul>` : ""}

<!-- SECTION 2: STAKEHOLDERS -->
<h2>2. Stakeholders</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
  <tr style="background:#f8fafc;">
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:200px;">Role</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;">Name</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;">Responsibilities</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Sponsor / Product Owner</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.sponsorProductOwner || "—"}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">Business decision authority; approves scope and funding</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Solution Architect</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.solutionArchitect || "—"}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">Authors architecture documentation; leads technical design</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Enterprise Architect</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${triageData.eaAssignee || request.eaAssignee || "—"}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">EA review and triage; facilitates ARC session</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Submitted By</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.submittedBy}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">ARR submitter; primary contact for clarifications</td>
  </tr>
  ${smes.map((sme) => `
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;font-weight:600;">Required SME</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${sme}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">Subject matter expert — to be engaged for ARC review</td>
  </tr>
  `).join("")}
</table>

<!-- SECTION 3: EA TRIAGE SUMMARY -->
<h2>3. EA Triage Summary</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px;">
  <tr style="background:#f8fafc;">
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:200px;">Dimension</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:100px;">Rating</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;">Rationale (from Impact Assessment)</td>
  </tr>
  ${riskTable}
</table>

${triageData.scopeNotes || request.scopeNotes ? `
<h3>3.1 EA Scope Notes</h3>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:14px 16px;font-size:11px;color:#334155;line-height:1.7;">${triageData.scopeNotes || request.scopeNotes}</div>` : ""}

<div class="page-break"></div>

<!-- SECTION 4: REQUIRED ARCHITECTURE VIEWS -->
<h2>4. Required Architecture Views</h2>
<p style="font-size:11px;color:#64748b;margin-bottom:20px;">The following architecture views have been identified as required based on the EA triage assessment. Each section must be completed by the Solution Architect prior to the ARC review session. Blue-highlighted sections show context pre-populated from the Architecture Review Request.</p>

${viewSections}

<!-- FOOTER / CHANGE LOG -->
<div class="page-break"></div>
<h2>5. Document Change Log</h2>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
  <tr style="background:#f8fafc;">
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:80px;">Version</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:120px;">Date</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;width:160px;">Author</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-weight:700;font-size:11px;color:#334155;">Description of Change</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">0.1</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${today}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">${request.solutionArchitect || request.submittedBy || "—"}</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#1e293b;">Initial draft — generated from ARR-${String(request.id).padStart(4, "0")}</td>
  </tr>
  <tr>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">0.2</td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#94a3b8;"></td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#94a3b8;"></td>
    <td style="padding:8px 16px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#94a3b8;font-style:italic;">[ Author to complete ]</td>
  </tr>
</table>

</body>
</html>`;

  const blob = new Blob([html], { type: "application/msword;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeTitle = request.title.replace(/[^a-zA-Z0-9\s-]/g, "").replace(/\s+/g, "-").slice(0, 60);
  link.download = `ARR-${String(request.id).padStart(4, "0")}-Architecture-Document-${safeTitle}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
