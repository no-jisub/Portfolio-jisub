import { defineConfig } from 'vite'

export default defineConfig({
  preview: {
    // Quick Tunnel hosts are assigned dynamically by Cloudflare.
    allowedHosts: true,
  },
})
