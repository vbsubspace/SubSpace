import { useEffect, useMemo, useState } from 'react'
import { useAuthenticationStatus, useSignInEmailPassword, useSignUpEmailPassword, useUserData, NhostProvider } from '@nhost/react'
import { gql, useMutation, useSubscription } from '@apollo/client'

const SUB_CHATS = gql`
  subscription Chats {
    chats(order_by: { created_at: desc }) {
      id
      title
      created_at
    }
  }
`

const CREATE_CHAT = gql`
  mutation CreateChat($title: String!) {
    insert_chats_one(object: { title: $title }) {
      id
      title
    }
  }
`

const SUB_MESSAGES = gql`
  subscription Messages($chat_id: uuid!) {
    messages(where: { chat_id: { _eq: $chat_id } }, order_by: { created_at: asc }) {
      id
      role
      content
      created_at
    }
  }
`

const INSERT_USER_MESSAGE = gql`
  mutation InsertUserMessage($chat_id: uuid!, $content: String!) {
    insert_messages_one(object: { chat_id: $chat_id, role: "user", content: $content }) {
      id
    }
  }
`

const SEND_MESSAGE = gql`
  mutation SendMessage($chat_id: uuid!, $content: String!) {
    sendMessage(chat_id: $chat_id, content: $content) {
      message_id
      reply
    }
  }
`

function AuthScreen() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()
  const { signInEmailPassword, isLoading: signingIn, error: signInError } = useSignInEmailPassword()
  const { signUpEmailPassword, isLoading: signingUp, error: signUpError } = useSignUpEmailPassword()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (isAuthenticated) return null

  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2>Nhost Chatbot</h2>
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: 8, marginBottom: 8 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => signInEmailPassword(email, password)} disabled={signingIn || signingUp}>
          Sign In
        </button>
        <button onClick={() => signUpEmailPassword(email, password)} disabled={signingIn || signingUp}>
          Sign Up
        </button>
      </div>
      {signInError && <div style={{ color: 'red', marginTop: 8 }}>{signInError.message}</div>}
      {signUpError && <div style={{ color: 'red', marginTop: 8 }}>{signUpError.message}</div>}
    </div>
  )
}

function ChatList({ onSelect, selectedId }: { onSelect: (id: string) => void; selectedId?: string }) {
  const { data } = useSubscription(SUB_CHATS)
  const [createChat] = useMutation(CREATE_CHAT)

  return (
    <div style={{ width: 320, borderRight: '1px solid #eee', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', gap: 8 }}>
        <button onClick={async () => {
          const title = prompt('Chat title', 'New Chat') || 'New Chat'
          const res = await createChat({ variables: { title } })
          const id = res.data?.insert_chats_one?.id
          if (id) onSelect(id)
        }}>+ New</button>
      </div>
      <div style={{ overflowY: 'auto' }}>
        {data?.chats?.map((c: any) => (
          <div key={c.id} onClick={() => onSelect(c.id)} style={{ padding: 12, cursor: 'pointer', background: c.id === selectedId ? '#f5f5f5' : 'transparent' }}>
            <div style={{ fontWeight: 600 }}>{c.title || 'Untitled'}</div>
            <div style={{ fontSize: 12, color: '#666' }}>{new Date(c.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChatView({ chatId }: { chatId: string }) {
  const { data } = useSubscription(SUB_MESSAGES, { variables: { chat_id: chatId } })
  const [sendMessage] = useMutation(SEND_MESSAGE)
  const [input, setInput] = useState('')

  const send = async () => {
    const content = input.trim()
    if (!content) return
    setInput('')
    await sendMessage({ variables: { chat_id: chatId, content } })
  }

  return (
    <div style={{ flex: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {(data?.messages ?? []).map((m: any) => (
          <div key={m.id} style={{ marginBottom: 12, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '70%', padding: 10, borderRadius: 8, background: m.role === 'user' ? '#DCF4FF' : '#F4F4F5' }}>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>{m.role}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message..." style={{ flex: 1, padding: 10 }} />
        <button onClick={send}>Send</button>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuthenticationStatus()
  const [selectedChatId, setSelectedChatId] = useState<string | undefined>(undefined)

  if (isLoading) return <div style={{ padding: 24 }}>Loading...</div>
  if (!isAuthenticated) return <AuthScreen />

  return (
    <div style={{ display: 'flex' }}>
      <ChatList onSelect={setSelectedChatId} selectedId={selectedChatId} />
      {selectedChatId ? (
        <ChatView chatId={selectedChatId} />
      ) : (
        <div style={{ padding: 24 }}>Select or create a chat</div>
      )}
    </div>
  )
}