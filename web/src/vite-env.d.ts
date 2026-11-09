/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_HUB_URL?: string
  readonly VITE_DEV_TOKEN?: string
}
