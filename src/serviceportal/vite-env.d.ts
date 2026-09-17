/// <reference types="vite/client" />

declare module '*.css'
declare module '*.css?inline' {
  const content: string
  export default content
}
declare module '*?raw' {
  const content: string
  export default content
}

declare global {
  interface Window {
    APP_CONFIG: {
      TENANT_NICKNAME: string
      TENANT_DISPLAY_NAME: string
      AUTH_TYPE: string
      NODE_ENV: string
      VITE_API_AT: string
      DEPLOYMENT_N20_API_URL: string
      CLOUDRUN_API_URL: string
    }
    appSettings: Record<string, string>
  }
}

export {}
