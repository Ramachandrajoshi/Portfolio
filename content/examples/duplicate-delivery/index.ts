type Msg = { id: string; amount: number };

// At-least-once delivery: the broker may redeliver after a lost acknowledgement.
const deliveries: Msg[] = [
  { id: 'evt-1', amount: 50 },
  { id: 'evt-2', amount: 20 },
  { id: 'evt-1', amount: 50 }, // redelivered
];

function naive(stream: Msg[]): number {
  let balance = 0;
  for (const m of stream) balance += m.amount;
  return balance;
}

function withInbox(stream: Msg[]): number {
  const inbox = new Set<string>();
  let balance = 0;
  for (const m of stream) {
    if (inbox.has(m.id)) continue; // duplicate: acknowledge, no side effect
    inbox.add(m.id);
    balance += m.amount;
  }
  return balance;
}

const lines = [
  `naive balance: ${naive(deliveries)}  ← wrong, evt-1 applied twice`,
  `inbox balance: ${withInbox(deliveries)}  ← correct`,
];
console.log(lines.join('\n'));
document.body.innerHTML = `<pre style="font: 14px/1.6 ui-monospace, monospace; padding: 1rem">${lines.join('\n')}</pre>`;
