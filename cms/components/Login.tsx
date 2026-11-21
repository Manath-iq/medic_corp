'use client'
import { useRef, useState, type FormEvent } from 'react'

export default function Login() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/users/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: String(form.get('username')).trim().toLowerCase(), password: String(form.get('password')) }) })
      if (!response.ok) {
        setError(response.status === 429 ? 'Слишком много попыток. Попробуйте позже.' : response.status >= 500 ? 'Сервер недоступен. Попробуйте ещё раз.' : 'Не удалось войти. Проверьте логин и пароль. После нескольких неверных попыток вход временно блокируется.')
        return
      }
      window.location.assign('/admin')
    } catch { setError('Нет соединения с сервером. Проверьте подключение и попробуйте снова.') }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <main className="ksm-auth-page"><div className="ksm-auth-card"><div className="ksm-logo"><img src="/clinic-logo.webp" alt="" width={56} height={56} /><div>Клиника семейной медицины<small>УПРАВЛЕНИЕ САЙТОМ</small></div></div><header className="ksm-login-intro"><h1>Вход для сотрудников</h1><p>Введите свой логин и пароль.</p></header><form onSubmit={submit} method="post" action="/api/users/login" aria-label="Вход для сотрудников"><label htmlFor="username">Логин</label><input id="username" name="username" type="text" autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} required minLength={2} maxLength={50} readOnly={busy} /><label htmlFor="password">Пароль</label><input id="password" name="password" type="password" autoComplete="current-password" required readOnly={busy} />{error && <p className="ksm-auth-error" role="alert">{error}</p>}<button type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button></form></div></main>
}
