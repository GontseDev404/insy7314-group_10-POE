import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync('../SecurePaymentsAPI/certs/key.pem'),
            cert: fs.readFileSync('../SecurePaymentsAPI/certs/cert.pem')
        },
        port: 5173
    }
})
