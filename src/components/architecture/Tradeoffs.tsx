export interface TradeoffOption {
  name: string;
  benefits: string[];
  drawbacks: string[];
  /** When this option is the right call. */
  chooseWhen: string;
  selected?: boolean;
}

/**
 * Accessible trade-off comparison. A real <table> with row/column headers on wide screens,
 * reflowing to one card per option on narrow screens; the selected option is announced
 * in text, not just highlighted.
 */
const defaultColumns = { option: 'Option', benefits: 'Benefits', drawbacks: 'Drawbacks', chooseWhen: 'Choose when' };

export function Tradeoffs({
  title,
  criteria,
  options,
  columns,
}: {
  title: string;
  criteria?: string;
  options: TradeoffOption[];
  /** Override column headings, e.g. for failure-mode tables (Containment / Impact / Detection & recovery). */
  columns?: Partial<typeof defaultColumns>;
}) {
  const cols = { ...defaultColumns, ...columns };
  return (
    <figure className="not-prose my-8" data-component="tradeoffs">
      <figcaption className="mb-3">
        <span className="font-display text-lg font-semibold">{title}</span>
        {criteria ? (
          <span className="mt-1 block text-sm text-muted">
            <span className="font-semibold text-fg">Selection criteria:</span> {criteria}
          </span>
        ) : null}
      </figcaption>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
          <thead className="bg-surface-2">
            <tr>
              <th scope="col" className="w-[20%] p-3 font-semibold">{cols.option}</th>
              <th scope="col" className="w-[27%] p-3 font-semibold">{cols.benefits}</th>
              <th scope="col" className="w-[27%] p-3 font-semibold">{cols.drawbacks}</th>
              <th scope="col" className="w-[26%] p-3 font-semibold">{cols.chooseWhen}</th>
            </tr>
          </thead>
          <tbody>
            {options.map((o) => (
              <tr key={o.name} className={o.selected ? 'bg-accent/[0.06]' : undefined}>
                <th scope="row" className="border-t border-border p-3 align-top font-semibold">
                  {o.name}
                  {o.selected ? (
                    <span className="mt-1 block font-mono text-[0.68rem] font-medium uppercase tracking-wider text-accent">
                      ✓ Selected
                    </span>
                  ) : null}
                </th>
                <td className="border-t border-border p-3 align-top">
                  <ul className="list-disc space-y-1 pl-4 marker:text-success">
                    {o.benefits.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </td>
                <td className="border-t border-border p-3 align-top">
                  <ul className="list-disc space-y-1 pl-4 marker:text-danger">
                    {o.drawbacks.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </td>
                <td className="border-t border-border p-3 align-top text-muted">{o.chooseWhen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
