export function Logo() {
  return <div className="ksm-logo"><img src="/clinic-logo.webp" alt="" width={56} height={56} /><div>Клиника семейной медицины<small>УПРАВЛЕНИЕ САЙТОМ</small></div></div>
}
export function Icon() { return <img src="/clinic-logo.webp" alt="КСМ" width={28} height={28} /> }
export function LoginIntro() { return <div className="ksm-login-intro"><h1>Сайт в ваших руках.</h1><p>Войдите, чтобы обновить цены, добавить специалиста<br />или рассказать о новостях клиники.</p></div> }
export function SiteLink() { return <div className="ksm-nav-footer"><a href={process.env.SITE_URL || 'http://localhost:4173/medic_corp/'} target="_blank" rel="noreferrer">Открыть сайт ↗</a><small>Изменения видны после публикации</small></div> }
export function HomeHelp() { return <div className="ksm-note">Врачей, направления, услуги и новости для главной выбирайте переключателем «Показывать на главной» в соответствующей записи. Цены всегда берутся из общего прайса.</div> }
