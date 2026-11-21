// Reject removed recovery pages before streaming starts, with a real HTTP 404.
export function proxy() {
  return new Response('Восстановление пароля отключено.', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
export const config = { matcher: ['/admin/forgot/:path*', '/admin/reset/:path*'] }
