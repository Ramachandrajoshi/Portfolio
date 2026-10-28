/**
 * Technical competency map. EDIT to reflect the owner's actual experience.
 *
 * Integrity rule: `level` stays null unless the owner supplies it. The visualisation never
 * invents proficiency; instead it plots *evidence* — how many pages on this site
 * (case studies, articles, projects) demonstrate the technology. `aliases` are matched
 * case-insensitively against content tags and project technologies.
 */
export const skillCategories = [
  {
    id: 'architecture',
    label: 'Architecture & design',
    description: 'Structuring systems, making trade-offs explicit, documenting decisions.',
  },
  {
    id: 'backend',
    label: 'Backend & APIs',
    description: 'Service design, API contracts and the runtime that hosts them.',
  },
  { id: 'ai', label: 'AI & LLM systems', description: 'Serving and integrating models under real resource budgets.' },
  {
    id: 'data',
    label: 'Data & messaging',
    description: 'Storage engines, caches, brokers and the semantics between them.',
  },
  { id: 'infra', label: 'Infrastructure & delivery', description: 'Build, deploy, observe and operate.' },
  {
    id: 'languages',
    label: 'Languages & tooling',
    description: 'Languages and developer tooling beneath the frameworks.',
  },
] as const;

export type SkillCategoryId = (typeof skillCategories)[number]['id'];

export interface Skill {
  name: string;
  category: SkillCategoryId;
  aliases: string[];
  /** Owner-supplied experience level. null = not supplied; never inferred. */
  level: null | 'working' | 'proficient' | 'expert';
}

export const skills: Skill[] = [
  {
    name: 'Distributed system design',
    category: 'architecture',
    aliases: ['distributed-systems', 'system-design'],
    level: null,
  },
  { name: 'Multi-tenant architecture', category: 'architecture', aliases: ['multi-tenancy'], level: null },
  { name: 'Event-driven architecture', category: 'architecture', aliases: ['event-driven', 'messaging'], level: null },
  { name: 'Architecture decision records', category: 'architecture', aliases: ['adr', 'documentation'], level: null },
  { name: 'Legacy modernisation', category: 'architecture', aliases: ['modernisation'], level: null },
  { name: 'Capacity planning', category: 'architecture', aliases: ['capacity-planning', 'performance'], level: null },
  { name: '.NET / ASP.NET Core', category: 'backend', aliases: ['dotnet', '.net'], level: null },
  { name: 'API design', category: 'backend', aliases: ['api-design'], level: null },
  { name: 'Idempotency & retries', category: 'backend', aliases: ['idempotency', 'reliability'], level: null },
  { name: 'Local LLM inference', category: 'ai', aliases: ['llm', 'inference'], level: null },
  { name: 'Quantisation', category: 'ai', aliases: ['quantization', 'quantisation'], level: null },
  { name: 'GPU memory & KV-cache sizing', category: 'ai', aliases: ['gpu', 'kv-cache'], level: null },
  { name: 'AI agents', category: 'ai', aliases: ['ai-agents', 'agents'], level: null },
  { name: 'PostgreSQL', category: 'data', aliases: ['postgresql', 'postgres'], level: null },
  { name: 'TimescaleDB', category: 'data', aliases: ['timescaledb', 'time-series'], level: null },
  { name: 'Redis', category: 'data', aliases: ['redis'], level: null },
  { name: 'MQTT', category: 'data', aliases: ['mqtt'], level: null },
  { name: 'Message brokers', category: 'data', aliases: ['rabbitmq', 'kafka', 'message-brokers'], level: null },
  {
    name: 'Industrial IoT & edge',
    category: 'data',
    aliases: ['iot', 'edge-computing', 'industrial-iot'],
    level: null,
  },
  { name: 'CI/CD (GitHub Actions)', category: 'infra', aliases: ['ci-cd', 'github actions'], level: null },
  {
    name: 'Observability (OpenTelemetry)',
    category: 'infra',
    aliases: ['observability', 'opentelemetry'],
    level: null,
  },
  { name: 'Reliability engineering', category: 'infra', aliases: ['reliability', 'slo'], level: null },
  { name: 'Static web delivery', category: 'infra', aliases: ['next.js', 'static-sites'], level: null },
  { name: 'Rust', category: 'languages', aliases: ['rust'], level: null },
  { name: 'Compilers & language design', category: 'languages', aliases: ['compilers'], level: null },
  { name: 'TypeScript', category: 'languages', aliases: ['typescript'], level: null },
  { name: 'C#', category: 'languages', aliases: ['csharp', 'c#', 'dotnet'], level: null },
];
