import type { ReactElement } from "react";

/*
 * Theme-matched single-stroke line icons (FND-04).
 *
 * Hand-authored on purpose: no icon package is installed. An icon library would be an
 * unapproved dependency (PROJECT.md forbids swapping or adding libraries without a written
 * reason) and its stroke weight would not match ref-A, which draws every icon as a flat
 * single-stroke line — no filled or 3D glyphs.
 *
 * OWNER DECISION — PENDING VISUAL APPROVAL:
 * `strokeWidth={1.5}` is a FIRST PASS to be tuned against `docs/design/ref-A-theme.png`
 * during visual approval. It is a visual-fidelity value, not a measured one, and only the
 * owner can confirm it. Do not treat 1.5 as authoritative.
 *
 * Accessibility: every icon is decorative (`aria-hidden`) unless the caller supplies a
 * `title`, in which case the SVG is exposed as an image with that accessible name. When an
 * icon is the only content of a control, the caller must supply `title` — or, more usually,
 * supply an accessible name on the surrounding control instead.
 */

export type IconProps = {
  /** Rendered width and height in pixels. */
  size?: number;
  className?: string;
  /** Supplying a title makes the icon non-decorative and exposes it as a named image. */
  title?: string;
};

export type IconComponent = (props: IconProps) => ReactElement;

const DEFAULT_SIZE = 20;

function Icon({
  size = DEFAULT_SIZE,
  className,
  title,
  children,
  ...rest
}: IconProps & { children: ReactElement | ReactElement[] }) {
  const labelled = Boolean(title);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={labelled ? "img" : undefined}
      aria-hidden={labelled ? undefined : true}
      aria-label={labelled ? title : undefined}
      focusable="false"
      {...rest}
    >
      {labelled ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export const CloseIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export const SearchIcon: IconComponent = (props) => (
  <Icon {...props}>
    <circle cx="11" cy="11" r="6" />
    <path d="M15.5 15.5L20 20" />
  </Icon>
);

/** Treatment dynamics — the ECG-like rhythm trace. */
export const PulseIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M2 12h4l2.5-6 4 12 2.5-6h7" />
  </Icon>
);

/** Visits / records. */
export const DocumentIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M14 3H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h6" />
  </Icon>
);

/** Medications — capsule. */
export const PillIcon: IconComponent = (props) => (
  <Icon {...props}>
    <rect x="3" y="9" width="18" height="6" rx="3" />
    <path d="M12 9v6" />
  </Icon>
);

/** Labs. */
export const FlaskIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.7 3h10.6A2 2 0 0 0 19 18L14 9V3" />
    <path d="M7.5 15h9" />
  </Icon>
);

/** Allergies — the starburst convention. */
export const AllergyIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />
  </Icon>
);

/** Genetics — double helix. */
export const DnaIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M7 3c0 6 10 6 10 12M17 3c0 6-10 6-10 12" />
    <path d="M8.5 6.5h7M8.5 12h7M8.5 17.5h7" />
  </Icon>
);

export const HeartIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M12 20.5 4.6 13A4.5 4.5 0 0 1 11 6.6l1 1 1-1a4.5 4.5 0 0 1 6.4 6.4z" />
  </Icon>
);

/** Lungs. */
export const LungsIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M9 3h6M12 4v10" />
    <path d="M12 13c0 3-2 5-4.5 6.5A2 2 0 0 1 5 18V9.5A2.5 2.5 0 0 1 7.5 7c1.6 0 2.9 1 3.5 2.4" />
    <path d="M12 13c0 3 2 5 4.5 6.5A2 2 0 0 0 19 18V9.5A2.5 2.5 0 0 0 16.5 7c-1.6 0-2.9 1-3.5 2.4" />
  </Icon>
);

export const ThermometerIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M10 4a2 2 0 0 1 4 0v9.2a4 4 0 1 1-4 0z" />
    <path d="M12 9v5" />
  </Icon>
);

export const CalendarIcon: IconComponent = (props) => (
  <Icon {...props}>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Icon>
);

/** Disclosure chevron; inherits direction from the surrounding inline flow. */
export const ChevronIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M9 5l7 7-7 7" />
  </Icon>
);

export const PlusIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const MinusIcon: IconComponent = (props) => (
  <Icon {...props}>
    <path d="M5 12h14" />
  </Icon>
);