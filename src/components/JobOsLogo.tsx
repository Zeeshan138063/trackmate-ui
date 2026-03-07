import React from "react";

// ──────────────────────────────────────────────────────────────────────────────
// Shared CSS keyframes injected once into the document.
// All animation names are namespaced with `jol-` to avoid conflicts.
// ──────────────────────────────────────────────────────────────────────────────
const ANIMATION_CSS = `
@keyframes jol-drawHex {
  to { stroke-dashoffset: 0; }
}
@keyframes jol-shaftGrow {
  0%   { opacity: 1; transform: scaleY(0); }
  100% { opacity: 1; transform: scaleY(1); }
}
@keyframes jol-headPop {
  0%   { opacity: 1; transform: scale(0) rotate(-10deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}
@keyframes jol-arrowShoot {
  0%   { opacity: 1; transform: translateY(0px)   scale(1);    }
  55%  { opacity: 1; transform: translateY(-10px) scale(1.08); }
  80%  { opacity: 0; transform: translateY(-22px) scale(0.9);  }
  81%  { opacity: 0; transform: translateY(14px)  scale(0.85); }
  100% { opacity: 1; transform: translateY(0px)   scale(1);    }
}
@keyframes jol-glowPulse {
  0%   { opacity: 0;    r: 14; }
  40%  { opacity: 0.35; r: 20; }
  70%  { opacity: 0;    r: 26; }
  100% { opacity: 0;    r: 14; }
}
@keyframes jol-revealIcon {
  from { opacity: 0; transform: scale(0.6) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes jol-revealWord {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes jol-revealTag {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes jol-iconFloat {
  0%,100% { transform: translateY(0); }
  50%     { transform: translateY(-4px); }
}
@keyframes jol-pulseGlow {
  0%,100% { transform: scale(1);    opacity: 0.7; }
  50%     { transform: scale(1.15); opacity: 1;   }
}
@keyframes jol-spin {
  to { transform: rotate(360deg); }
}
@keyframes jol-spinReverse {
  to { transform: rotate(-360deg); }
}
@keyframes jol-expandDivider {
  from { width: 0;     opacity: 0; }
  to   { width: 120px; opacity: 1; }
}

/* ── Shared SVG element classes ── */
.jol-hex-stroke {
  stroke-dasharray: 240;
  stroke-dashoffset: 240;
  animation: jol-drawHex 1.2s cubic-bezier(0.4,0,0.2,1) 0.2s forwards;
}
.jol-arrow-shaft {
  opacity: 0;
  transform-origin: 48px 72px;
  transform: scaleY(0);
  animation:
    jol-shaftGrow  0.4s cubic-bezier(0.22,1,0.36,1) 1.1s forwards,
    jol-arrowShoot 2.4s ease-in-out 2.2s infinite;
}
.jol-arrow-head {
  opacity: 0;
  transform-origin: 48px 38px;
  transform: scale(0);
  animation:
    jol-headPop    0.35s cubic-bezier(0.34,1.56,0.64,1) 1.45s forwards,
    jol-arrowShoot 2.4s  ease-in-out 2.2s infinite;
}
.jol-arrow-glow {
  opacity: 0;
  animation: jol-glowPulse 2.4s ease-in-out 2.2s infinite;
}
`;

let styleInjected = false;
function injectStyles() {
    if (styleInjected || typeof document === "undefined") return;
    const tag = document.createElement("style");
    tag.id = "jol-animations";
    tag.textContent = ANIMATION_CSS;
    document.head.appendChild(tag);
    styleInjected = true;
}

// ── Unique ID helper so multiple SVG instances don't share gradient/clip IDs ──
let instanceCount = 0;

// ──────────────────────────────────────────────────────────────────────────────
// The core animated SVG icon
// ──────────────────────────────────────────────────────────────────────────────
function LogoIconSvg({
    size,
    id,
    lightMode = false,
}: {
    size: number;
    id: string;
    lightMode?: boolean;
}) {
    const hexGrad = `${id}-hexG`;
    const arrGrad = `${id}-arrG`;
    const glowGrad = `${id}-glowG`;
    const clip = `${id}-clip`;

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 96 96"
            fill="none"
            style={{
                filter: `drop-shadow(0 0 ${Math.round(size * 0.18)}px rgba(102,120,255,${lightMode ? 0.3 : 0.6}))`,
                animation: "jol-iconFloat 4s ease-in-out infinite 1.4s",
            }}
        >
            <defs>
                <linearGradient id={hexGrad} x1="0" y1="0" x2="96" y2="96" gradientUnits="userSpaceOnUse">
                    {lightMode ? (
                        <>
                            <stop offset="0%" stopColor="#6678FF" />
                            <stop offset="100%" stopColor="#3A4AD8" />
                        </>
                    ) : (
                        <>
                            <stop offset="0%" stopColor="#7B8FFF" />
                            <stop offset="100%" stopColor="#4A5AE8" />
                        </>
                    )}
                </linearGradient>
                <linearGradient id={arrGrad} x1="48" y1="18" x2="48" y2="78" gradientUnits="userSpaceOnUse">
                    {lightMode ? (
                        <>
                            <stop offset="0%" stopColor="#1A2560" />
                            <stop offset="100%" stopColor="#3A4AD8" />
                        </>
                    ) : (
                        <>
                            <stop offset="0%" stopColor="#FFFFFF" />
                            <stop offset="100%" stopColor="#C8D2FF" />
                        </>
                    )}
                </linearGradient>
                <linearGradient id={glowGrad} x1="48" y1="18" x2="48" y2="78" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#6678FF" />
                    <stop offset="100%" stopColor="#4A5AE8" />
                </linearGradient>
                <clipPath id={clip}>
                    <rect x="38" y="20" width="20" height="55" />
                </clipPath>
            </defs>

            <polygon
                className="jol-hex-stroke"
                points="48,6 84,27 84,69 48,90 12,69 12,27"
                fill="none"
                stroke={`url(#${hexGrad})`}
                strokeWidth="4"
                strokeLinejoin="round"
            />
            <circle
                className="jol-arrow-glow"
                cx="48"
                cy="48"
                r="14"
                fill={`url(#${lightMode ? glowGrad : arrGrad})`}
                style={{ filter: "blur(6px)" }}
                opacity={lightMode ? 0.3 : 1}
            />
            <rect
                className="jol-arrow-shaft"
                x="43"
                y="42"
                width="10"
                height="30"
                rx="3"
                fill={`url(#${arrGrad})`}
                clipPath={`url(#${clip})`}
            />
            <polygon
                className="jol-arrow-head"
                points="48,20 62,44 34,44"
                fill={`url(#${arrGrad})`}
            />
        </svg>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Public component
// ──────────────────────────────────────────────────────────────────────────────
export type LogoVariant = "sidebar" | "hero" | "icon";

interface JobOsLogoProps {
    /** Controls the overall layout and icon size */
    variant?: LogoVariant;
    /** Show or hide the "JobOS" wordmark */
    showWordmark?: boolean;
    /** Icon size in px (only used when variant="icon") */
    iconSize?: number;
    /** Light background mode (dark arrow fills so they're visible on light bg) */
    lightMode?: boolean;
    className?: string;
}

export function JobOsLogo({
    variant = "sidebar",
    showWordmark = true,
    iconSize = 44,
    lightMode = false,
    className = "",
}: JobOsLogoProps) {
    React.useEffect(() => {
        injectStyles();
    }, []);

    // Stable instance ID for gradient/clip uniqueness
    const id = React.useRef(`jol-${++instanceCount}`).current;

    // ── HERO variant ──────────────────────────────────────────────────────────
    if (variant === "hero") {
        return (
            <div
                className={className}
                style={{
                    position: "relative",
                    width: 260,
                    height: 260,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                {/* Glow background */}
                <div
                    style={{
                        position: "absolute",
                        width: 200,
                        height: 200,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(102,120,255,0.22) 0%, transparent 70%)",
                        animation: "jol-pulseGlow 3.5s ease-in-out infinite",
                    }}
                />
                {/* Outer orbit ring */}
                <div
                    style={{
                        position: "absolute",
                        width: 190,
                        height: 190,
                        borderRadius: "50%",
                        border: "1.5px solid rgba(102,120,255,0.22)",
                        animation: "jol-spin 12s linear infinite",
                    }}
                >
                    {/* Orbit dot */}
                    <div
                        style={{
                            position: "absolute",
                            top: -4,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 8,
                            height: 8,
                            background: "#6678FF",
                            borderRadius: "50%",
                            boxShadow: "0 0 10px 3px #6678FF",
                        }}
                    />
                </div>
                {/* Inner orbit ring */}
                <div
                    style={{
                        position: "absolute",
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        border: "1px solid rgba(102,120,255,0.09)",
                        animation: "jol-spinReverse 20s linear infinite",
                    }}
                >
                    <div
                        style={{
                            position: "absolute",
                            bottom: -3,
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: 6,
                            height: 6,
                            background: "rgba(102,120,255,0.6)",
                            borderRadius: "50%",
                            boxShadow: "0 0 6px 2px rgba(102,120,255,0.5)",
                        }}
                    />
                </div>

                {/* Icon */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        marginBottom: showWordmark ? 16 : 0,
                        opacity: 0,
                        animation: "jol-revealIcon 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s forwards",
                    }}
                >
                    <LogoIconSvg size={72} id={id} lightMode={lightMode} />
                </div>

                {showWordmark && (
                    <>
                        {/* Wordmark */}
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                display: "flex",
                                alignItems: "baseline",
                                opacity: 0,
                                animation: "jol-revealWord 0.8s cubic-bezier(0.22,1,0.36,1) 0.75s forwards",
                            }}
                        >
                            <span
                                style={{
                                    fontSize: 40,
                                    fontWeight: 700,
                                    color: lightMode ? "#0E1525" : "#fff",
                                    letterSpacing: "-2px",
                                    lineHeight: 1,
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                Job
                            </span>
                            <span
                                style={{
                                    fontSize: 40,
                                    fontWeight: 700,
                                    letterSpacing: "-2px",
                                    lineHeight: 1,
                                    background: "linear-gradient(135deg, #6678FF, #4A5AE8)",
                                    WebkitBackgroundClip: "text",
                                    WebkitTextFillColor: "transparent",
                                    backgroundClip: "text",
                                    fontFamily: "'DM Sans', sans-serif",
                                }}
                            >
                                OS
                            </span>
                        </div>

                        {/* Divider */}
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                height: 1,
                                background: "linear-gradient(90deg, transparent, #6678FF, transparent)",
                                margin: "8px auto 0",
                                opacity: 0,
                                animation: "jol-expandDivider 0.9s cubic-bezier(0.22,1,0.36,1) 0.9s forwards",
                            }}
                        />

                        {/* Tagline */}
                        <div
                            style={{
                                position: "relative",
                                zIndex: 2,
                                marginTop: 8,
                                fontSize: 9,
                                fontWeight: 500,
                                letterSpacing: "3.5px",
                                color: "rgba(102,120,255,0.7)",
                                textTransform: "uppercase",
                                fontFamily: "'DM Mono', monospace",
                                opacity: 0,
                                animation: "jol-revealTag 0.8s ease 1.1s forwards",
                            }}
                        >
                            Career Operating System
                        </div>
                    </>
                )}
            </div>
        );
    }

    // ── ICON-ONLY variant ─────────────────────────────────────────────────────
    if (variant === "icon") {
        return (
            <div
                className={className}
                style={{
                    opacity: 0,
                    animation: "jol-revealIcon 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s forwards",
                    display: "inline-flex",
                }}
            >
                <LogoIconSvg size={iconSize} id={id} lightMode={lightMode} />
            </div>
        );
    }

    // ── SIDEBAR variant (default) — horizontal lockup ─────────────────────────
    const sidebarIconSize = 28;
    const sidebarFontSize = 20;

    return (
        <div
            className={className}
            style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                opacity: 0,
                animation: "jol-revealWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s forwards",
            }}
        >
            <LogoIconSvg size={sidebarIconSize} id={id} lightMode={lightMode} />
            {showWordmark && (
                <span
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: "nowrap",
                    }}
                >
                    <span
                        style={{
                            fontSize: sidebarFontSize,
                            fontWeight: 700,
                            color: lightMode ? "#0E1525" : "currentColor",
                            letterSpacing: "-0.8px",
                            lineHeight: 1,
                        }}
                    >
                        Job
                    </span>
                    <span
                        style={{
                            fontSize: sidebarFontSize,
                            fontWeight: 700,
                            letterSpacing: "-0.8px",
                            lineHeight: 1,
                            background: "linear-gradient(135deg, #6678FF, #4A5AE8)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                        }}
                    >
                        OS
                    </span>
                </span>
            )}
        </div>
    );
}
