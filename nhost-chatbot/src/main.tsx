import React from 'react'
import ReactDOM from 'react-dom/client'
import { NhostClient } from '@nhost/nhost-js'
import { NhostProvider } from '@nhost/react'
import { NhostApolloProvider } from '@nhost/react-apollo'
import App from './App'
import './App.css'

// Support both BACKEND_URL and SUBDOMAIN/REGION as per README
const backendUrl = import.meta.env.VITE_NHOST_BACKEND_URL as string | undefined
const subdomain = import.meta.env.VITE_NHOST_SUBDOMAIN as string | undefined
const region = import.meta.env.VITE_NHOST_REGION as string | undefined

const nhost = new NhostClient(
  backendUrl
    ? { backendUrl }
    : subdomain && region
    ? { subdomain, region }
    : {}
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NhostProvider nhost={nhost}>
      <NhostApolloProvider nhost={nhost}>
        <App />
      </NhostApolloProvider>
    </NhostProvider>
  </React.StrictMode>
)
