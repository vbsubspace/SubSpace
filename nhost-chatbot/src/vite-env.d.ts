/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NHOST_SUBDOMAIN?: string
  readonly VITE_NHOST_REGION?: string
  readonly VITE_NHOST_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}