import React from "react";
import { Link } from "react-router-dom";

/**
 * Shared brand mark for Preventive Health Platform.
 * Uses public/logo.svg so it works without image bundling issues.
 */
export default function BrandLogo({
  size = "md",
  showText = true,
  to = "/",
  className = "",
  title = "Preventive Health Platform",
  subtitle = "",
  textClassName = "",
}) {
  const iconSize =
    size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const titleSize =
    size === "sm" ? "text-sm" : size === "lg" ? "text-xl" : "text-base";

  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={`${process.env.PUBLIC_URL || ""}/logo.svg`}
        alt="Preventive Health Platform logo"
        className={`${iconSize} rounded-lg object-cover shadow-sm flex-shrink-0`}
      />
      {showText ? (
        <span className="leading-tight min-w-0">
          <span
            className={`block font-semibold text-blue-900 ${titleSize} ${textClassName}`}
          >
            {title}
          </span>
          {subtitle ? (
            <span className="block text-xs text-slate-500">{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center no-underline hover:opacity-90 transition-opacity"
      >
        {content}
      </Link>
    );
  }

  return content;
}
