// Surface — one component with four variants over the frozen fills (D-25).
//
// The four variants are `canvas` (page field), `surface` (default card),
// `surfaceMuted` (inset panel) and `surfaceRaised` (elevated card).
//
// No variant emits a perimeter edge utility. An outlined card is forbidden by
// INV-16: card edges separate by the two frozen shadows alone.
//
// `surfaceMuted` deliberately takes no shadow. Recess is expressed by fill, not
// by an inset shadow — an inset would be a third elevation level and fails
// INV-13. The only shadow utilities this primitive may reference are
// `shadow-raised` here and the overlay-level elevation the Overlay primitive
// owns (plan 02-07); a local box-shadow value is never declared (INV-14).
//
// Server Component: no hook, no client directive, no local CSS file and no
// literal `style` value.
import type { ElementType, ReactNode } from 'react';

export type SurfaceVariant = 'canvas' | 'surface' | 'surfaceMuted' | 'surfaceRaised';
export type SurfaceSize = 'md' | 'lg' | 'xl';
export type SurfaceElement = 'div' | 'section' | 'article';

type SurfaceSpec = {
  /** The one fill utility of the variant (02-UI-SPEC.md §5.1). */
  fill: string;
  /** Radius step, or empty for a full-bleed field. */
  radius: string;
  /** Default padding step, or empty for a full-bleed field. */
  padding: string;
  /** One of the two frozen elevation utilities, or empty. */
  shadow: string;
};

const SURFACE_VARIANTS: Record<SurfaceVariant, SurfaceSpec> = {
  canvas: { fill: 'bg-canvas', radius: '', padding: '', shadow: '' },
  surface: { fill: 'bg-surface', radius: 'rounded-lg', padding: 'p-lg', shadow: 'shadow-raised' },
  surfaceMuted: { fill: 'bg-surface-muted', radius: 'rounded-lg', padding: 'p-lg', shadow: '' },
  surfaceRaised: { fill: 'bg-surface-raised', radius: 'rounded-xl', padding: 'p-xl', shadow: 'shadow-raised' },
};

// Two padding densities read from one scale (02-UI-SPEC.md §5.1): the dense
// provider/workspace step is space.lg, the sparser patient-home step is
// space.xl. `md` and `lg` select the dense range, `xl` the sparse one — the
// scale is never extended with an off-scale value.
const SURFACE_SIZE_PADDING: Record<SurfaceSize, string> = {
  md: 'p-lg',
  lg: 'p-lg',
  xl: 'p-xl',
};

export type SurfaceProps = {
  variant?: SurfaceVariant;
  size?: SurfaceSize;
  /** Render as `div` (default), `section` or `article` without an extra wrapper. */
  as?: SurfaceElement;
  className?: string;
  children?: ReactNode;
};

export function Surface({
  variant = 'surface',
  size,
  as,
  className,
  children,
}: SurfaceProps) {
  const Element: ElementType = as ?? 'div';
  const spec = SURFACE_VARIANTS[variant];
  // A caller-provided fill utility REPLACES the variant fill instead of
  // colliding with it: two `bg-*` utilities on one element share specificity,
  // and the winner would be stylesheet order rather than intent. The one
  // sanctioned case is the Critical Alerts salmon panel (`bg-critical`).
  const callerOwnsFill = /(?:^|\s)bg-/.test(className ?? '');
  // Same override law for the radius: a caller-provided `rounded-*` utility
  // (the workspace's larger reference radii) replaces the variant's radius
  // step instead of colliding with it by stylesheet order.
  const callerOwnsRadius = /(?:^|\s)rounded-/.test(className ?? '');
  // A field is not a card: `canvas` never takes padding, whatever the size.
  const padding = variant === 'canvas' ? '' : size ? SURFACE_SIZE_PADDING[size] : spec.padding;
  // The caller's className is merged last so layout utilities can be added
  // without editing the primitive, and never replaces the variant classes.
  const classes = [
    callerOwnsFill ? '' : spec.fill,
    callerOwnsRadius ? '' : spec.radius,
    padding,
    spec.shadow,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <Element className={classes}>{children}</Element>;
}
