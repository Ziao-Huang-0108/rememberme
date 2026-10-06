/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDBASE_ENV: string
  readonly VITE_CLOUDBASE_REGION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
