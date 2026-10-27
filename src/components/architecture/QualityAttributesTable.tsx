import type { CaseStudy } from '@/content';

const basisLabel = {
  requirement: 'Requirement',
  'design-assumption': 'Design assumption',
  measured: 'Measured',
  target: 'Target',
} as const;

/** Quality-attribute scenarios with measurable acceptance criteria and their evidential basis. */
export function QualityAttributesTable({ items }: { items: CaseStudy['qualityAttributes'] }) {
  return (
    <div
      className="not-prose my-6 overflow-x-auto rounded-lg border border-border"
      role="region"
      aria-label="Quality attributes"
      tabIndex={0}
    >
      <table className="w-full min-w-[42rem] border-collapse text-left text-sm">
        <caption className="sr-only">Quality attributes, scenarios, acceptance criteria and basis</caption>
        <thead className="bg-surface-2">
          <tr>
            <th scope="col" className="p-3 font-semibold">
              Attribute
            </th>
            <th scope="col" className="p-3 font-semibold">
              Scenario
            </th>
            <th scope="col" className="p-3 font-semibold">
              Acceptance criterion
            </th>
            <th scope="col" className="p-3 font-semibold">
              Basis
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((qa) => (
            <tr key={qa.attribute} className="align-top">
              <th scope="row" className="border-t border-border p-3 font-semibold">
                {qa.attribute}
              </th>
              <td className="border-t border-border p-3 text-muted">{qa.scenario}</td>
              <td className="border-t border-border p-3">{qa.measure}</td>
              <td className="border-t border-border p-3">
                <span
                  className={
                    'rounded-full border px-2 py-0.5 font-mono text-[0.68rem] tracking-wider whitespace-nowrap uppercase ' +
                    (qa.basis === 'measured'
                      ? 'border-success/40 text-success'
                      : qa.basis === 'design-assumption'
                        ? 'border-highlight/40 text-highlight'
                        : 'border-border-strong text-muted')
                  }
                >
                  {basisLabel[qa.basis]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
