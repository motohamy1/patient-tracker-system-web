'use client';

// Button — four variants, radius.pill throughout (INV-08).
//
// `primary` is filled with `accentSoft`, never `accent`: a primary CTA painted
// `accent` fails INV-05 and QA row 12. No state change swaps a fill for a
// status or tint color — hover, active and focus all move through opacity of
// the same fill, plus no shadow for `primary`.
//
// Ink is `text-text-primary` in every variant and every state. `textSecondary`,
// `frameForeground` and the status tints are never used as ink (FOUND-04,
// 02-UI-SPEC.md §4.3).
//
// Client component: the hover, active and focus transitions are driven by
// `useReducedMotion`, a React runtime hook that cannot execute on the server.
// Every other primitive in this plan stays a Server Component.
//
// This file never declares an outline, a focus color or a perimeter edge: the
// focus ring is declared once in `globals.css`, and an icon-only edge would
// violate INV-16.
import type { MouseEventHandler, ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import type { Transition } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { MOTION } from '@/styles/tokens.generated';
import { makeIcon } from './Icon';
import type { IconSize, TokenIcon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'iconOnly';
export type ButtonSize = 'md' | 'lg';

// Fill, ink and radius per variant. The shadow is kept in its own map so that
// `disabled` can drop it without rewriting the variant group.
const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-soft text-text-primary rounded-pill',
  secondary: 'bg-surface-raised text-text-primary rounded-pill',
  ghost: 'text-text-primary rounded-pill',
  iconOnly: 'bg-surface-raised text-text-primary rounded-pill',
};

// The only elevation utilities in the primitive set are `shadow-raised` and the
// overlay-level elevation owned by the Overlay primitive (plan 02-07); a local
// box-shadow value is never declared (INV-14).
const BUTTON_SHADOWS: Record<ButtonVariant, string> = {
  primary: '',
  secondary: 'shadow-raised',
  ghost: '',
  iconOnly: 'shadow-raised',
};

// Horizontal padding from the one spacing scale (02-UI-SPEC.md §5.2): space.xl
// for primary and secondary, one step tighter (space.md) for ghost, and the
// square inset for iconOnly.
const BUTTON_PADDING: Record<ButtonVariant, string> = {
  primary: 'px-xl',
  secondary: 'px-xl',
  ghost: 'px-md',
  iconOnly: 'p-sm',
};

const BUTTON_SIZE_PADDING: Record<ButtonSize, string> = {
  md: 'px-md',
  lg: 'px-xl',
};

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-xs text-body font-semibold leading-body select-none';

// Touch-target contract (UX-06, responsive-rules.md §4): a 44px minimum in both
// axes below the 768px mobile band edge. Below it every variant — a `primary`
// at rest included — is at least 44px in both axes. At and above 768px the text
// variants may drop to a 32px control height; an icon-only control stays 44px
// square at every band because it is a pointer-and-thumb target. The band's
// upper edge is 1024px (the overlay presentation flips there), which is why the
// 44px rule is bounded by 768px rather than by 1024px.
const BUTTON_TEXT_SIZING = 'min-h-11 md:min-h-8';
const BUTTON_ICON_SIZING = 'min-h-11 min-w-11';

// Disabled: reduced opacity on the existing fill and ink, no shadow, no focus
// ring. A natively `disabled` button is not focusable, so the shared
// :focus-visible ring cannot appear on it. It is never repainted in a status
// color. The provider-home primary CTA ships disabled in this phase because
// Phase 004 owns its destination (D-01, D-18).
const BUTTON_DISABLED = 'opacity-60 cursor-not-allowed';

// One token-bound icon component per Lucide icon, so a render never rebuilds the
// wrapper (which would remount the glyph) and the 1.5px stroke stays owned by
// Icon.tsx (D-21).
const tokenIconCache = new WeakMap<LucideIcon, TokenIcon>();

function toTokenIcon(glyph: LucideIcon): TokenIcon {
  const cached = tokenIconCache.get(glyph);
  if (cached) return cached;
  const built = makeIcon(glyph);
  tokenIconCache.set(glyph, built);
  return built;
}

type ButtonBaseProps = {
  size?: ButtonSize;
  /** Leading 16px glyph; for `iconOnly` the single 24px glyph. */
  icon?: LucideIcon;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
};

// An icon-only control without an accessible name cannot compile: the
// `iconOnly` variant requires `ariaLabel`, so an unlabeled icon button never
// reaches the DOM (D-19 §4, docs/governance/reference-ui-specification.md §4).
export type ButtonProps =
  | (ButtonBaseProps & { variant: 'iconOnly'; ariaLabel: string })
  | (ButtonBaseProps & { variant?: 'primary' | 'secondary' | 'ghost'; ariaLabel?: string });

export function Button({
  variant = 'primary',
  size,
  icon,
  disabled = false,
  type = 'button',
  ariaLabel,
  className,
  onClick,
  children,
}: ButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isDisabled = disabled === true;
  const isIconOnly = variant === 'iconOnly';
  const reducedMotion = prefersReducedMotion === true;

  const shadow = isDisabled ? '' : BUTTON_SHADOWS[variant];
  const padding = isIconOnly
    ? BUTTON_PADDING.iconOnly
    : size
      ? BUTTON_SIZE_PADDING[size]
      : BUTTON_PADDING[variant];
  const sizing = isIconOnly ? BUTTON_ICON_SIZING : BUTTON_TEXT_SIZING;

  const classes = [
    BUTTON_BASE,
    BUTTON_VARIANTS[variant],
    sizing,
    padding,
    shadow,
    isDisabled ? BUTTON_DISABLED : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  // Two transition definitions built from the generated motion constants
  // (src/styles/tokens.generated.ts is the generated mirror of
  // docs/governance/tokens.json): the normal branch uses the slower tokenized
  // duration with the standard curve, and the reduced branch is opacity-only at
  // the fastest tokenized duration with no transform. Typing a number here
  // would be a third value outside the token source.
  const transition: Transition = reducedMotion
    ? { duration: MOTION.duration.fastSec, ease: MOTION.easing.standard }
    : { duration: MOTION.duration.slowSec, ease: MOTION.easing.standard };

  const hover = isDisabled ? undefined : { opacity: 0.92 };
  const tap = isDisabled ? undefined : reducedMotion ? { opacity: 0.8 } : { opacity: 0.8, scale: 0.98 };

  const IconGlyph = icon ? toTokenIcon(icon) : null;
  const glyphSize: IconSize = isIconOnly ? 'lg' : 'sm';

  return (
    <motion.button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-label={ariaLabel}
      onClick={onClick}
      whileHover={hover}
      whileTap={tap}
      transition={transition}
    >
      {IconGlyph ? <IconGlyph size={glyphSize} /> : null}
      {children}
    </motion.button>
  );
}
