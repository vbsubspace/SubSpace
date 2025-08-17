import React from 'react'
import ReactDOM from 'react-dom/client'
import { NhostClient } from '@nhost/nhost-js'
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'
import App from './App'
import './App.css'

const backendUrl = import.meta.env.VITE_NHOST_BACKEND_URL as string | undefined
if (!backendUrl) {
  throw new Error('Missing VITE_NHOST_BACKEND_URL environment variable')
}

const nhost = new NhostClient({ backendUrl })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        <App />
      </NhostApolloProvider>
    </NhostProvider>
  </React.StrictMode>
)
