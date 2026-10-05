import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // framer-motion is NOT a dependency of this project: the package was renamed to
    // `motion`. No `ignores` here, so this also covers src/components/motion/** and an
    // accidental import fails lint rather than failing at build.
    //
    // ORDER MATTERS, and it is the reverse of the intuitive reading. Flat config merges
    // rule OPTIONS last-wins: two `no-restricted-imports` entries for the same rule name
    // do not accumulate, the later object replaces the earlier one wholesale. This
    // narrower object therefore comes FIRST and the broader one LAST — verified by
    // `--print-config` on a file inside and outside src/components/motion/.
    //
    // Net effect: src/components/motion/** receives only this framer-motion ban;
    // every other src/ file receives the broader ban below (motion/react + framer-motion).
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["framer-motion"],
              message: "Import from motion/react instead — framer-motion is not a dependency of this project.",
            },
          ],
        },
      ],
    },
  },
  {
    // Components compose src/components/motion/* primitives instead of importing
    // motion/react directly, so the app-wide reduced-motion policy cannot be bypassed.
    // This object IGNORES the motion layer, which keeps the narrower rule above.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/motion/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["motion/react", "framer-motion"],
              message:
                "Import motion primitives from @/components/motion/* instead, so the app-wide reduced-motion policy cannot be bypassed.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
