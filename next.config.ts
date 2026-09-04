import type { NextConfig } from "next";

/**
 * Image handling decision (JE-020).
 *
 * `company_logo_url` comes from arbitrary employer CDNs rather than a fixed set
 * of provider hosts, so a per-host `images.remotePatterns` allowlist is
 * impractical. The alternative — a `hostname: "**"` wildcard — would turn
 * `/_next/image` into an open image proxy for any remote URL, which is a worse
 * trade than losing optimization on a 48px logo.
 *
 * Decision: company logos bypass the optimizer entirely via `unoptimized` on
 * the `next/image` in `CompanyLogo`. `generateImgAttrs` returns before the
 * default loader runs in that case, so `remotePatterns` is never consulted and
 * no entry is required. The optimizer therefore stays closed to remote hosts.
 *
 * Revisit only if a surface needs genuinely optimized remote images, and add a
 * scoped allowlist for that surface at the same time.
 */
const nextConfig: NextConfig = {};

export default nextConfig;
