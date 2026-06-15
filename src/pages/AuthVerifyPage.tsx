import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { verifyMagicLink } from '../services/api'
import { authStore } from '../stores/authStore'

export function AuthVerifyPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [failed, setFailed] = useState(false)
  const attempted = useRef(false)

  useEffect(() => {
    const token = params.get('token')
    if (!token || attempted.current) return
    attempted.current = true

    verifyMagicLink(token)
      .then((session) => {
        authStore.getState().login(session.token, { ...session.profile, kind: session.kind })
        navigate(session.kind === 'creator' ? '/dashboard' : '/me', { replace: true })
      })
      .catch(() => setFailed(true))
  }, [params, navigate])

  return (
    <div className="min-h-full flex items-center justify-center px-6">
      <p className="text-muted text-center">
        {failed ? 'This link has expired or was already used. Request a new one.' : 'One moment.'}
      </p>
    </div>
  )
}
