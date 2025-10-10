/// <reference types="@cloudflare/workers-types" />

declare module '@opennextjs/cloudflare' {
  export interface CloudflareEnv {
    DB: D1Database
  }
}

// Extend process.env for Edge Runtime
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DB?: D1Database
    }
  }
}