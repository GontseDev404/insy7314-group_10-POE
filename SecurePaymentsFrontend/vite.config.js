import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const certDir = path.resolve(__dirname, '../SecurePaymentsAPI/certs')
const keyPath = path.join(certDir, 'key.pem')
const certPath = path.join(certDir, 'cert.pem')

const hasCertificates = fs.existsSync(keyPath) && fs.existsSync(certPath)

export default defineConfig(({ command }) => {
  const config = {
    plugins: [react()]
  }

  if (command === 'serve' && hasCertificates) {
    config.server = {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      },
      port: 5173
    }
  } else if (command === 'serve') {
    config.server = {
      port: 5173
    }
    console.warn(
      'HTTPS certificates not found at',
      certDir,
      '- dev server will start over HTTP. Generate certificates with `npm run make:certs` in SecurePaymentsAPI.'
    )
  }

  return config
})
