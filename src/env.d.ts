/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly ADMIN_PASSWORD: string;
  readonly STRIPE_SECRET_KEY: string;
  readonly RESEND_API_KEY: string;
  readonly FROM_EMAIL: string;
  readonly TO_EMAIL: string;
  readonly SITE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    runtime: import('@astrojs/cloudflare').Runtime<Env>;
  }
}

interface Env {
  INQUIRIES_KV: KVNamespace;
  ADMIN_PASSWORD: string;
  STRIPE_SECRET_KEY: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  TO_EMAIL: string;
  SITE_URL: string;
}