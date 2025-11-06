/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PLAID_SANDBOX_LINK_TOKEN?: string;
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
