// src/components/security/audit-browser.tsx — the only client piece of the
// D-15 audit surface: a plain search filter over the server rows, exactly the
// one filter the spec allows (03-UI-SPEC §8.7). No payload expansion, no
// charts, no badges — neutral text rows on bg-surface with borderSubtle row
// lines (INV-15).
//
// The gate-selected inset fill arrives as a PROP from AuditTable (server):
// a client chunk may not reference node:fs, and the gate read lives in
// CompactControl (the login-form / gallery-slot precedent, plan 02-10). The
// search field is therefore composed here in the same §5.4 grammar rather than
// importing the server-only primitive.
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { makeIcon } from '@/components/primitives/Icon';
import type { AuditRow } from './AuditTable';

const SearchGlyph = makeIcon(Search);

export function AuditBrowser({ rows, insetFill }: { rows: AuditRow[]; insetFill: string }) {
  const [query, setQuery] = useState('');
  const filtered = rows.filter((row) => {
    if (!query) return true;
    const haystack = `${row.action} ${row.entity} ${row.actor ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const wrapperClasses = [
    'inline-flex items-center gap-xs rounded-pill px-lg min-h-11 md:min-h-8 text-text-primary',
    insetFill,
  ].join(' ');

  return (
    <div className="flex flex-col gap-md">
      <label htmlFor="audit-search" className="sr-only">
        Filter audit entries
      </label>
      <div className={wrapperClasses}>
        <SearchGlyph size="sm" />
        <input
          id="audit-search"
          type="search"
          placeholder="Filter audit entries"
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-body leading-body text-text-primary placeholder:text-text-primary"
        />
      </div>
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
