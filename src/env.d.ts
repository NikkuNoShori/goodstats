/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOODREADS_API_KEY: string;
  readonly VITE_GOODREADS_API_SECRET: string;
  readonly VITE_GOODREADS_CALLBACK_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
