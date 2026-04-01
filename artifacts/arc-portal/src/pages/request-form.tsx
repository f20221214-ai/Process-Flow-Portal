import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Select, Label, Badge } from "@/components/ui-primitives";
import { useCreateRequest } from "@workspace/api-client-react";
import type { CreateArchitectureRequest } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, X, Layers, Info, ChevronDown, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { JiraInitiative } from "@workspace/api-client-react";

const IMPACT_LEVELS = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" }
];

export default function RequestForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateRequest();

  const [formData, setFormData] = useState<CreateArchitectureRequest>({
    title: "",
    description: "",
    businessUnit: "",
    sponsorProductOwner: "",
    solutionArchitect: "",
    requestType: "new_application",
    businessContext: "",
    businessValueHypothesis: [],
    businessCriticality: "business_operational",
    costEstimate: "small",
    inScopeRegions: [],
    expectedUserBase: "",
    deploymentModel: "tbd",
    targetGoLiveDate: "",
    
    securityImpactLevel: "none",
    securityImpactDetails: "",
    dataImpactLevel: "none",
    dataImpactDetails: "",
    integrationImpactLevel: "none",
    integrationImpactDetails: "",
    regulatoryImpactLevel: "none",
    regulatoryImpactDetails: "",
    aiImpactLevel: "none",
    aiImpactDetails: "",
    
    submittedBy: "Jane Doe",
    priority: "medium",
    jiraInitiativeId: null
  });

  const [regionInput, setRegionInput] = useState("");

  const { data: initiatives, isLoading: isLoadingJira } = useQuery<JiraInitiative[]>({
    queryKey: ['/api/jira/initiatives'],
    queryFn: () => fetch('/api/jira/initiatives').then(res => res.json())
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jiraIdStr = params.get('jiraId');
    if (jiraIdStr && initiatives) {
      const jiraId = parseInt(jiraIdStr, 10);
      const initiative = initiatives.find(i => i.id === jiraId);
      if (initiative) {
        setFormData(prev => ({
          ...prev,
          jiraInitiativeId: jiraId,
          title: prev.title || initiative.summary
        }));
      }
    }
  }, [initiatives]);

  const selectedInitiative = initiatives?.find(i => i.id === formData.jiraInitiativeId);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJiraSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const jiraId = value ? parseInt(value, 10) : null;
    
    setFormData(prev => {
      const newData = { ...prev, jiraInitiativeId: jiraId };
      if (jiraId && initiatives) {
        const initiative = initiatives.find(i => i.id === jiraId);
        if (initiative && !prev.title) {
          newData.title = initiative.summary;
        }
      }
      return newData;
    });
  };

  const handleRegionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = regionInput.trim();
      if (val && !formData.inScopeRegions?.includes(val)) {
        setFormData(prev => ({
          ...prev,
          inScopeRegions: [...(prev.inScopeRegions || []), val]
        }));
      }
      setRegionInput("");
    }
  };

  const removeRegion = (r: string) => {
    setFormData(prev => ({
      ...prev,
      inScopeRegions: prev.inScopeRegions?.filter(region => region !== r)
    }));
  };

  const handleBusinessValueHypothesisToggle = (value: string) => {
    setFormData(prev => {
      const current = prev.businessValueHypothesis || [];
      if (current.includes(value)) {
        return { ...prev, businessValueHypothesis: current.filter(v => v !== value) };
      } else {
        return { ...prev, businessValueHypothesis: [...current, value] };
      }
    });
  };

  const setImpactLevel = (area: string, level: string) => {
    setFormData(prev => ({ ...prev, [`${area}ImpactLevel`]: level }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ data: formData }, {
      onSuccess: (data) => {
        toast({ title: "Request Submitted", description: "Your architecture review request has been created." });
        setLocation(`/requests/${data.id}`);
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to submit request.", variant: "destructive" });
      }
    });
  };

  const InitiativeCombobox = ({ initiatives, jiraId, isLoading, onSelect }: {
    initiatives?: JiraInitiative[];
    jiraId: number | null | undefined;
    isLoading: boolean;
    onSelect: (initiative: JiraInitiative | null) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = initiatives?.filter(i =>
      `${i.jiraKey} ${i.summary} ${i.projectName}`.toLowerCase().includes(search.toLowerCase())
    ) ?? [];

    const selected = initiatives?.find(i => i.id === jiraId) ?? null;

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div className="relative" ref={containerRef}>
        <div
          role="combobox"
          aria-expanded={open}
          className="flex items-center border border-border rounded-xl px-3 py-2.5 cursor-pointer bg-background hover:border-primary/50 transition-colors min-h-[42px]"
          onClick={() => setOpen(!open)}
        >
          <div className="flex-1 min-w-0">
            {selected ? (
              <div className="flex items-center gap-2">
                <Badge variant="primary" className="font-mono text-xs bg-blue-100 text-blue-800 border-blue-200 shrink-0">
                  {selected.jiraKey}
                </Badge>
                <span className="text-sm truncate">{selected.summary}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">
                {isLoading ? "Loading initiatives…" : "Select a JIRA initiative…"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 shrink-0">
            {selected && (
              <button
                type="button"
                aria-label="Clear selection"
                onClick={(e) => { e.stopPropagation(); onSelect(null); setSearch(""); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
            <div className="p-2 border-b border-border">
              <div className="flex items-center gap-2 px-2">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by key, name, or project…"
                  className="flex-1 text-sm outline-none bg-transparent py-1"
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground text-center">Loading initiatives…</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">No initiatives match your search.</div>
              ) : (
                filtered.map(init => (
                  <button
                    key={init.id}
                    type="button"
                    onClick={() => { onSelect(init); setOpen(false); setSearch(""); }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-secondary transition-colors flex items-start gap-3 ${jiraId === init.id ? "bg-primary/5" : ""}`}
                  >
                    <Badge variant="primary" className="font-mono text-xs bg-blue-100 text-blue-800 border-blue-200 shrink-0 mt-0.5">
                      {init.jiraKey}
                    </Badge>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{init.summary}</div>
                      <div className="text-xs text-muted-foreground">{init.projectName} · {init.status}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ImpactRow = ({ area, title, fieldName, guidance }: { area: string, title: string, fieldName: string, guidance: string }) => {
    const levelKey = `${fieldName}ImpactLevel` as keyof CreateArchitectureRequest;
    const detailsKey = `${fieldName}ImpactDetails` as keyof CreateArchitectureRequest;
    const currentLevel = formData[levelKey] as string;
    const [showGuidance, setShowGuidance] = useState(false);

    return (
      <div className="border border-border/50 rounded-xl p-5 space-y-4 bg-card/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Label className="mb-0 text-base">{title}</Label>
            <button type="button" onClick={() => setShowGuidance(!showGuidance)} className="text-muted-foreground hover:text-primary transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2">
            {IMPACT_LEVELS.map(level => (
              <button
                key={level.value}
                type="button"
                onClick={() => setImpactLevel(fieldName, level.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  currentLevel === level.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {showGuidance && (
          <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-sm text-primary/80 animate-in fade-in slide-in-from-top-2">
            {guidance}
          </div>
        )}

        <div>
          <Label className="text-xs mb-2">Details supporting the impact level selection</Label>
          <Textarea
            name={detailsKey}
            value={(formData[detailsKey] as string) || ""}
            onChange={handleChange}
            placeholder={currentLevel === "none" ? "Optional: provide rationale for selecting no impact" : `Elaborate on the ${currentLevel} impact...`}
            className="min-h-[80px]"
            required={currentLevel !== "none"}
          />
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto pb-12">
        <Button variant="ghost" size="sm" href="/requests" className="mb-6 -ml-4 text-muted-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Requests
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold">Architecture Review Request (ARR)</h1>
          <p className="text-muted-foreground mt-2">Complete the intake form to initiate the Architecture Review Process.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* SECTION 0: JIRA INITIATIVE */}
          <Card className="mb-8 border-indigo-100 shadow-sm">
            <CardHeader className="bg-indigo-50/50 flex flex-row items-center gap-2">
              <div className="bg-blue-600 text-white p-1 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <CardTitle className="text-indigo-900">0. Linked JIRA Initiative</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Link to JIRA Initiative (Optional)</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the JIRA epic or initiative this ARR relates to. This helps track architecture reviews alongside project delivery.
                </p>
                
                {isLoadingJira ? (
                  <div className="h-10 bg-secondary/50 rounded-xl animate-pulse"></div>
                ) : (
                  <Select 
                    value={formData.jiraInitiativeId?.toString() || ""} 
                    onChange={handleJiraSelect}
                  >
                    <option value="">-- Select an initiative --</option>
                    {initiatives?.map(init => (
                      <option key={init.id} value={init.id}>
                        {init.jiraKey} - {init.summary} ({init.projectName})
                      </option>
                    ))}
                  </Select>
                )}
              </div>

              {selectedInitiative && (
                <div className="mt-4 p-4 border border-indigo-100 bg-indigo-50/30 rounded-xl relative">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, jiraInitiativeId: null}))}
                    className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="primary" className="font-mono bg-blue-100 text-blue-800 border-blue-200">
                      {selectedInitiative.jiraKey}
                    </Badge>
                    <span className="text-sm font-semibold">{selectedInitiative.summary}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Project: {selectedInitiative.projectName}</span>
                    <span>Status: {selectedInitiative.status}</span>
                    {selectedInitiative.assignee && <span>Assignee: {selectedInitiative.assignee}</span>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 1: REQUEST INFORMATION */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>1. Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label>Project/Initiative Name</Label>
                  <p className="text-xs text-muted-foreground mb-1.5">Pick from a synced JIRA initiative below, or clear to enter a custom name.</p>
                  <InitiativeCombobox
                    initiatives={initiatives}
                    jiraId={formData.jiraInitiativeId}
                    isLoading={isLoadingJira}
                    onSelect={(initiative) => {
                      setFormData(prev => ({
                        ...prev,
                        jiraInitiativeId: initiative?.id ?? null,
                        title: initiative?.summary ?? ""
                      }));
                    }}
                  />
                  {!formData.jiraInitiativeId && (
                    <Input
                      required
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g. Migration to AWS Cloud"
                      className="mt-2"
                    />
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label>Project/Initiative Description</Label>
                  <Textarea required name="description" value={formData.description} onChange={handleChange} placeholder="Briefly describe the initiative..." />
                </div>

                <div>
                  <Label>Business Unit/Portfolio</Label>
                  <Select required name="businessUnit" value={formData.businessUnit} onChange={handleChange}>
                    <option value="">Select a business unit...</option>
                    <option value="Digital Agriculture">Digital Agriculture</option>
                    <option value="Digital Manufacturing">Digital Manufacturing</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">HR</option>
                    <option value="Legal">Legal</option>
                    <option value="Sustainability">Sustainability</option>
                    <option value="Supply Chain">Supply Chain</option>
                  </Select>
                </div>
                
                <div>
                  <Label>Request Type</Label>
                  <Select name="requestType" value={formData.requestType} onChange={handleChange}>
                    <option value="new_application">New Application</option>
                    <option value="major_enhancement">Major Enhancement</option>
                    <option value="new_capability">New Capability</option>
                    <option value="cloud_migration">Cloud Migration</option>
                    <option value="application_replacement">Application Replacement</option>
                    <option value="application_decommissioning">Application Decommissioning</option>
                    <option value="technology_selection">Technology Selection</option>
                  </Select>
                </div>

                <div>
                  <Label>Sponsor / Product Owner</Label>
                  <Input name="sponsorProductOwner" value={formData.sponsorProductOwner || ""} onChange={handleChange} placeholder="Name" />
                </div>

                <div>
                  <Label>Solution Architect</Label>
                  <Input name="solutionArchitect" value={formData.solutionArchitect || ""} onChange={handleChange} placeholder="Name (if assigned)" />
                </div>

                <div className="md:col-span-2">
                  <Label>Business Context</Label>
                  <Textarea name="businessContext" value={formData.businessContext || ""} onChange={handleChange} placeholder="Describe the problem statement and anticipated business value..." className="min-h-[120px]" />
                </div>

                <div className="md:col-span-2">
                  <Label className="mb-3">Business Value Hypothesis</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { id: 'increased_revenue', label: 'Increased Revenue' },
                      { id: 'reduced_costs', label: 'Reduced Costs' },
                      { id: 'reduced_risk', label: 'Reduced Risk' },
                      { id: 'improved_experience', label: 'Improved Experience' },
                    ].map((item) => (
                      <label key={item.id} className="flex items-center space-x-3 p-3 border border-border rounded-xl hover:bg-secondary/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.businessValueHypothesis?.includes(item.id)}
                          onChange={() => handleBusinessValueHypothesisToggle(item.id)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                        />
                        <span className="text-sm font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Business Criticality</Label>
                  <Select name="businessCriticality" value={formData.businessCriticality || ""} onChange={handleChange}>
                    <option value="mission_critical">Mission Critical</option>
                    <option value="business_critical">Business Critical</option>
                    <option value="business_operational">Business Operational</option>
                    <option value="administrative_service">Administrative Service</option>
                  </Select>
                </div>

                <div>
                  <Label>Cost T-Shirt Sizing</Label>
                  <Select name="costEstimate" value={formData.costEstimate || ""} onChange={handleChange}>
                    <option value="small">Small (&lt;100K CAD)</option>
                    <option value="medium">Medium (100K-500K CAD)</option>
                    <option value="large">Large (500K-1M CAD)</option>
                    <option value="xlarge">XLarge (&gt;1M CAD)</option>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>In-Scope Regions / Countries</Label>
                  <div className="space-y-3">
                    <Input 
                      placeholder="Type a region and press Enter or comma..." 
                      value={regionInput}
                      onChange={(e) => setRegionInput(e.target.value)}
                      onKeyDown={handleRegionKeyDown}
                    />
                    {formData.inScopeRegions && formData.inScopeRegions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.inScopeRegions.map((region, i) => (
                          <div key={i} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            {region}
                            <button type="button" onClick={() => removeRegion(region)} className="hover:text-destructive transition-colors ml-1 focus:outline-none">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Expected User Base</Label>
                  <Input name="expectedUserBase" value={formData.expectedUserBase || ""} onChange={handleChange} placeholder="e.g. 500 internal, 10,000 external" />
                </div>

                <div>
                  <Label>Target Go-Live Date</Label>
                  <Input type="date" name="targetGoLiveDate" value={formData.targetGoLiveDate || ""} onChange={handleChange} />
                </div>

                <div className="md:col-span-2">
                  <Label>Deployment Model</Label>
                  <Select name="deploymentModel" value={formData.deploymentModel || ""} onChange={handleChange}>
                    <option value="on_prem_datacenter">On-Prem (McCain Data Center)</option>
                    <option value="on_prem_plant">On-Prem (McCain Plant)</option>
                    <option value="saas">SaaS</option>
                    <option value="cloud_vendor">Cloud (Vendor Tenant)</option>
                    <option value="cloud_mccain">Cloud (McCain Tenant)</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="tbd">To be Defined</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 2: IMPACT ASSESSMENT */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>2. Impact Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-muted-foreground mb-6">
                Refer to the guidance below when selecting impact levels. Accurate scoring ensures the correct depth of review.
              </p>

              <ImpactRow 
                area="Security" 
                title="Security Impact" 
                fieldName="security"
                guidance="None: Only used inside the company by employees who already have approved login accounts — no sensitive information is involved. Low: Used inside the company with standard login controls; only a small number of people outside the business (e.g. a partner team) may have access. Medium: Introduces new ways for people to log in or access data, or handles sensitive internal information such as employee records or confidential business data. High: Accessible from the internet and handles passwords, payment card details, personal information (e.g. names, addresses, health records), or connects company systems to external networks."
              />

              <ImpactRow 
                area="Data" 
                title="Data Impact" 
                fieldName="data"
                guidance="None: Only uses publicly available information — nothing that needs to be kept private or protected. Low: Uses everyday internal data (e.g. product lists, operational reports) that is not sensitive and stays within the team. Medium: Involves important business data shared across departments, or introduces new ways of analysing data that could affect decisions company-wide. High: Handles personal information (e.g. customer names, addresses, health details), financial records, or data that must be kept in specific countries due to local laws."
              />

              <ImpactRow 
                area="Integration" 
                title="Integration Impact" 
                fieldName="integration"
                guidance="None: This change does not connect to any other system — it works completely on its own. Low: Connects to one or two existing internal systems using well-established, already-approved methods (e.g. a standard data feed or report). Medium: Connects to several internal systems, or uses live data feeds where information is exchanged the moment something happens rather than in a scheduled batch. High: Connects to systems outside the company (e.g. supplier portals, customer platforms, government services) or introduces a brand-new way of linking systems together."
              />

              <ImpactRow 
                area="Regulatory" 
                title="Regulatory Impact" 
                fieldName="regulatory"
                guidance="None: No rules, laws, or audit requirements apply to this change — it has no compliance obligations. Low: Must follow internal company policies or guidelines, but there are no external legal or regulatory requirements to meet. Medium: Needs to meet external audit standards, financial reporting rules, or industry certification requirements (e.g. quality management, financial controls). High: Involves legal obligations related to personal data privacy, food safety, health and safety, financial services regulations, or other laws where non-compliance could result in fines or legal action."
              />

              <ImpactRow 
                area="AI" 
                title="AI Impact" 
                fieldName="ai"
                guidance="None: Does not use any artificial intelligence, machine learning, or AI-powered features whatsoever. Low: Uses a ready-made AI feature that a software vendor has built in (e.g. a smart search or auto-complete toggle); a person always reviews and approves the AI's suggestions before anything happens. Medium: Uses AI to route tasks, prioritise work, or make recommendations that influence how the business operates; may use company data to improve the AI's responses. High: Uses AI to make or heavily influence decisions with real consequences for customers, employees, or finances (e.g. loan approvals, medical recommendations, automated customer communications) — especially in areas that could be subject to regulation or legal challenge."
              />
            </CardContent>
          </Card>

          {/* SECTION 3: SUBMITTED BY */}
          <Card className="mb-8 shadow-sm">
            <CardHeader>
              <CardTitle>3. Submitted By</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Submitter Name</Label>
                  <Input required name="submittedBy" value={formData.submittedBy} onChange={handleChange} />
                </div>
                <div>
                  <Label>Priority</Label>
                  <Select name="priority" value={formData.priority} onChange={handleChange}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => window.history.back()}>Cancel</Button>
            <Button type="submit" disabled={createMutation.isPending} className="px-8">
              {createMutation.isPending ? "Submitting..." : "Submit ARR"}
            </Button>
          </div>
        </form>
      </motion.div>
    </Layout>
  );
}
