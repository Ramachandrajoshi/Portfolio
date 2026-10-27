/**
 * Service offerings — what I can help with, framed as offerings rather than claims about
 * past client engagements. EDIT to match the owner's availability and focus.
 */
export const services = [
  {
    id: 'architecture-assessment',
    title: 'Architecture assessment',
    summary: 'A structured review of an existing system against its quality attributes.',
    deliverables: ['Quality-attribute scenarios agreed with stakeholders', 'Risk register with likelihood and impact', 'Prioritised recommendations recorded as ADR proposals'],
    approach: 'Interviews, code and runtime inspection, and a utility tree that ranks what matters most — then a short, specific report.',
  },
  {
    id: 'system-design',
    title: 'System design & technical planning',
    summary: 'From requirements and constraints to an architecture a team can build and operate.',
    deliverables: ['C4 context, container and component views as code', 'Decision records for the significant choices', 'Incremental delivery plan with validation milestones'],
    approach: 'Start from constraints, compare alternatives explicitly, and plan how each decision will be validated.',
  },
  {
    id: 'backend-api',
    title: 'Backend & API architecture',
    summary: 'Service boundaries, API contracts, multi-tenancy and modernisation of existing .NET systems.',
    deliverables: ['API design guidelines and contract review', 'Tenancy and data-isolation model', 'Modernisation roadmap with compatibility strategy'],
    approach: 'Incremental change behind stable contracts, with architecture tests that keep boundaries honest.',
  },
  {
    id: 'ai-inference',
    title: 'AI & inference deployment design',
    summary: 'Serving LLMs locally or privately within GPU memory, latency and concurrency budgets.',
    deliverables: ['Capacity model: weights, KV cache, concurrency', 'Model and quantisation selection with an evaluation plan', 'Serving topology and observability design'],
    approach: 'First-principles capacity arithmetic, then measurements on the actual hardware before any commitment.',
  },
  {
    id: 'iot-telemetry',
    title: 'IoT & telemetry architecture',
    summary: 'Edge collection, MQTT ingestion, stream processing and time-series storage.',
    deliverables: ['Device-to-dashboard data flow with delivery semantics', 'Storage, retention and aggregation design', 'Security model for devices and tenants'],
    approach: 'Design for disconnection, duplication and reordering from the start — they are the normal case at the edge.',
  },
  {
    id: 'performance-review',
    title: 'Performance & scalability review',
    summary: 'Finding the real bottleneck and the cheapest change that moves it.',
    deliverables: ['Load model and test plan', 'Bottleneck analysis with evidence', 'Capacity headroom and scaling plan'],
    approach: 'Measure before optimising; model before measuring, so the measurements answer a question.',
  },
] as const;
