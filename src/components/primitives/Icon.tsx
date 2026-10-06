// Icon — the single Lucide wrapper (D-21).
//
// Exactly two sizes exist: `sm` is 16px and is paired with a label; `lg` is
// 24px and is used standalone on an icon-only control. Both are bound to
// existing scale steps (font.size.body and font.size.heading), so an icon size
// can never introduce an off-scale value.
//
// The 1.5px stroke is set exactly once, here, precisely because `lucide-react`
// exposes `strokeWidth` as a prop on every icon: owned by each call site it
// would drift to the library default. The property is omitted from the public
// props type, so passing it is a compile error rather than a code-review
// comment, and it is written after the rest spread in the JSX so it wins even
// if the type is later widened.
//
// Ink is `currentColor` from the parent and nothing else — no icon sets its own
// color, and no icon is a status encoding by itself (02-UI-SPEC.md §4.3).
//
// Server Component: no hook, no client directive.
import type { ReactElement } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';

/** The two icon sizes: 16px paired with a label, 24px standalone. */
export type IconSize = 'sm' | 'lg';

const ICON_SIZE_PX: Record<IconSize, number> = { sm: 16, lg: 24 };

// `strokeWidth` is omitted from the public props so no call site can pass it.
export type TokenIconProps = Omit<LucideProps, 'strokeWidth'> & {
  /** `sm` = 16px (paired with a label), `lg` = 24px (standalone). */
  size?: IconSize;
};

export type TokenIcon = (props: TokenIconProps) => ReactElement;

/**
 * Build a token-bound icon component from a Lucide icon.
 *
 * The returned component is decorative by default (`aria-hidden`) and opts out
 * when an `aria-label` supplies an accessible name.
 */
export function makeIcon(LucideComponent: LucideIcon): TokenIcon {
  function TokenIcon({ size = 'sm', 'aria-label': ariaLabel, ...rest }: TokenIconProps) {
    return (
      <LucideComponent
        {...rest}
        size={ICON_SIZE_PX[size]}
        strokeWidth={1.5}
        aria-hidden={ariaLabel ? undefined : true}
        aria-label={ariaLabel}
      />
    );
  }

  return TokenIcon;
}

/** `Icon` is the factory itself, re-exported so call sites can build an icon. */
export const Icon = makeIcon;
