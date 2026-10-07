// src/components/security/audit-browser.tsx — the only client piece of the
// D-15 audit surface: a plain CompactControl search filter over the server
// rows, exactly the one filter the spec allows (03-UI-SPEC §8.7). No payload
// expansion, no charts, no badges — neutral text rows on bg-surface with
// borderSubtle row lines (INV-15).
'use client';

import { useState } from 'react';
import { CompactControl } from '@/components/primitives/CompactControl';
import type { AuditRow } from './AuditTable';

export function AuditBrowser({ rows }: { rows: AuditRow[] }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) => {
    if (!query) return true;
    const haystack = `${row.action} ${row.entity} ${row.actor ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-md">
      <CompactControl
        variant="search"
        label="Filter audit entries"
        inputId="audit-search"
        placeholder="Filter audit entries"
        onValueChange={setQuery}
      />
      <ul className="flex flex-col gap-sm">
        {filtered.map((row) => (
          <li key={row.id}>
            <div className="border-b border-border-subtle bg-surface px-lg py-sm rounded-lg">
              <p className="text-label leading-label text-text-primary tabular-nums">
                {row.created_at}
              </p>
              <p className="text-body leading-body text-text-primary">
                {row.actor ?? 'Unknown actor'} · {row.action} · {row.entity}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
