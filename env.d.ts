/// <reference types="@cloudflare/workers-types" />

declare module '@opennextjs/cloudflare' {
  export interface CloudflareEnv {
    DB: D1Database
  }
}
