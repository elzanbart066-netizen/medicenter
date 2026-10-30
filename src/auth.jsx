import { createContext, useContext, useEffect, useState } from 'react'
import { api, tokenStore } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!tokenStore.get())

  useEffect(() => {
    if (!tokenStore.get()) return
    api('/auth/me')
      .then(setUser)
      .catch(() => tokenStore.set(null))
      .finally(() => setReady(true))
  }, [])

  const signIn = ({ token, user }) => {
    tokenStore.set(token)
    setUser(user)
  }
  const signOut = () => {
    tokenStore.set(null)
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, ready, signIn, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
