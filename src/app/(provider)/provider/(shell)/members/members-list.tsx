// src/app/(provider)/provider/members/members-list.tsx — the server-rendered
// member rows (03-UI-SPEC §8.3): email at body weight 400, role as a
// radius-pill chip, NO avatar tiles and NO gradient initials — initials
// circles are a rejected costume, a member row is text plus role chip, nothing
// else. Row removal arrives only through the client RemoveMemberControl.
import { Pill } from '@/components/primitives/Pill';
import { RemoveMemberControl } from './remove-member-overlay';

export type MemberListRow = {
  id: string;
  role: string;
  email: string | null;
};

export function MembersList({ rows }: { rows: MemberListRow[] }) {
  return (
    <ul className="flex flex-col gap-sm">
      {rows.map((row) => (
        <li key={row.id}>
          <div className="flex items-center justify-between gap-lg bg-surface rounded-lg p-lg shadow-raised">
            <p className="text-body font-regular leading-body text-text-primary">
              {row.email ?? 'Unknown member'}
            </p>
            <div className="flex items-center gap-md">
              <Pill label={row.role} />
              <RemoveMemberControl memberId={row.id} displayName={row.email ?? 'this member'} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
