/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NHOST_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
