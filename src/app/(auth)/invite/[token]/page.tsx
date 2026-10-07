// /invite/[token] — the public signup-then-join surface (D-02/D-03/D-04, 03-UI-SPEC §8.2).
//
// Renders with no session: the (auth) group is bare and the read path never
// requires a session — an unauthenticated device follows the link, sees the
// valid sentence, and signs up + redeems in ONE server action.
//
// Display lookup discipline: the server helper formats the raw token (pure
// assertion — hostile strings never reach the DB) and calls the
// security-definer preview_invite RPC, which returns ONLY the org name and
// role for the one sentence; a format miss, empty visa, or a transient DB
// failure ALL render the SAME constant denial grammar, so nothing about
// token existence or validity is ever implied. Email-confirmation re-entry:
// the redeem action's emailRedirectTo lands the confirm endpoint back on
// this same token path.
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { EmptyState } from '@/components/primitives/EmptyState';
import { assertValidInviteToken } from '@/lib/auth/invite';
import { createClient } from '@/lib/supabase/server';
import { InviteSignupForm } from './invite-signup-form';

export const dynamic = 'force-dynamic';

export const INVITE_DENIAL_TITLE = 'This invite is no longer valid.';
export const INVITE_DENIAL_BODY = 'Ask your organization owner to send a new one.';

async function previewInvite(rawToken: string): Promise<{ organization: string; role: string } | null> {
  if (!assertValidInviteToken(rawToken)) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('preview_invite', { p_raw_token: rawToken });
    if (error || !data) return null;
    const payload = data as { organization?: string; role?: string };
    if (!payload.organization || !payload.role) return null;
    return { organization: payload.organization, role: payload.role };
  } catch {
    return null;
  }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const preview = await previewInvite(token);

  return (
    <Surface
      variant="canvas"
      className="flex min-h-screen items-center justify-center bg-canvas p-lg"
    >
      <div className="flex w-full max-w-[24rem] flex-col gap-md">
        {preview ? (
          <>
            <h1 className="text-heading font-semibold leading-heading text-text-primary">
              {`You have been invited to join ${preview.organization} as ${preview.role}.`}
            </h1>
            <InviteSignupForm rawToken={token} insetFill={INSET_FILL} />
          </>
        ) : (
          <EmptyState title={INVITE_DENIAL_TITLE} body={INVITE_DENIAL_BODY} />
        )}
      </div>
    </Surface>
  );
}
