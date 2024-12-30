/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_GOODREADS_API_KEY: string;
    [key: string]: string | undefined;
  }
} 