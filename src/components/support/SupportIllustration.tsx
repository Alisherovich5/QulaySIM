/**
 * The help artwork: two chat bubbles, a question mark, a globe and a flight
 * path.
 *
 * Drawn here as SVG because the project has no asset for it. The design shows a
 * rendered 3D scene — soft shadows, a glassy mint bubble, a rounded white one —
 * and this is a flat approximation of it with gradients doing what the render
 * does with light. It is the shapes and the composition, not the material.
 *
 * Deliberately not a 3D library: the thing is a static decoration beside a
 * search field, and shipping a WebGL runtime for it would cost more than the
 * whole rest of the page.
 *
 * Swapping it for the real render is one element: drop the file into
 * public/media/ and replace this component's body with <Photo name="…" />. The
 * wrapper, its sizing and its `aria-hidden` stay as they are.
 */
export default function SupportIllustration() {
  return (
    <svg
      className="sup-art"
      viewBox="0 0 560 300"
      role="presentation"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="sup-glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#7fe3c8" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#7fe3c8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sup-mint" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8fecd2" />
          <stop offset="100%" stopColor="#35c5a4" />
        </linearGradient>
        <linearGradient id="sup-white" x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef5f4" />
        </linearGradient>
      </defs>

      <ellipse cx="300" cy="150" rx="250" ry="140" fill="url(#sup-glow)" />

      {/* The globe, far back and barely there. */}
      <g opacity="0.16" stroke="#1d7f6d" fill="none" strokeWidth="1.4">
        <circle cx="430" cy="140" r="92" />
        <ellipse cx="430" cy="140" rx="40" ry="92" />
        <path d="M338 140h184M352 96h156M352 184h156" />
      </g>

      {/* The flight path and its plane. */}
      <path
        d="M86 196c40 52 132 74 214 52 62-16 104-52 136-102"
        fill="none"
        stroke="#4fc9ab"
        strokeOpacity="0.5"
        strokeWidth="1.6"
        strokeDasharray="5 8"
        strokeLinecap="round"
      />
      <path d="M470 34l26 12-26 12 6-12-6-12z" fill="#0f8f76" />

      {/* Behind: the mint bubble with its three dots. */}
      <g>
        <path
          d="M120 62h150a34 34 0 0 1 34 34v74a34 34 0 0 1-34 34h-74l-34 30v-30h-42a34 34 0 0 1-34-34V96a34 34 0 0 1 34-34z"
          fill="url(#sup-mint)"
          opacity="0.92"
        />
        <g fill="#ffffff">
          <circle cx="164" cy="133" r="11" />
          <circle cx="200" cy="133" r="11" />
          <circle cx="236" cy="133" r="11" />
        </g>
      </g>

      {/* In front: the white bubble carrying the question. */}
      <g>
        <ellipse cx="362" cy="248" rx="86" ry="14" fill="#0b6b59" opacity="0.10" />
        <path
          d="M288 66h138a38 38 0 0 1 38 38v84a38 38 0 0 1-38 38h-52l-22 32-10-32h-54a38 38 0 0 1-38-38v-84a38 38 0 0 1 38-38z"
          fill="url(#sup-white)"
        />
        <text
          x="358"
          y="176"
          textAnchor="middle"
          fontFamily="var(--font-display), sans-serif"
          fontSize="104"
          fontWeight="800"
          fill="#0f8f76"
        >
          ?
        </text>
      </g>
    </svg>
  )
}
