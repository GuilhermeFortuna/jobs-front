import type { JobResult } from "@/lib/api";

export const DEMO_JOBS: JobResult[] = [
  [
    "demo-linear",
    "Linear",
    "Staff Software Engineer",
    180000,
    230000,
    "Remote worldwide",
  ],
  [
    "demo-vercel",
    "Vercel",
    "Staff Software Engineer",
    180000,
    220000,
    "Remote worldwide",
  ],
  [
    "demo-supabase",
    "Supabase",
    "Senior Backend Engineer",
    170000,
    210000,
    "Remote · Americas",
  ],
  [
    "demo-posthog",
    "PostHog",
    "Product Engineer",
    160000,
    200000,
    "Remote worldwide",
  ],
].map(([id, company, title, min, max, location]) => ({
  provider: "himalayas",
  provider_job_id: String(id),
  title: String(title),
  company: String(company),
  description:
    "Development preview only. Connect the backend to search live roles.\n\nHelp teams build better products. You will design and ship core capabilities, own projects end-to-end, and improve the reliability and craft of the engineering experience.",
  location_text: String(location),
  employment_type: "full_time",
  remote_type: "remote",
  seniority: "Staff",
  salary_min_annual: Number(min),
  salary_max_annual: Number(max),
  salary_currency: "USD",
  job_url: "https://himalayas.app/jobs",
}));

export function isDemoJob(providerJobId: string): boolean {
  return providerJobId.startsWith("demo-");
}

export function isDevPreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
