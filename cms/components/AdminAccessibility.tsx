'use client'
import { useEffect } from 'react'

// Payload 3.93's dashboard switcher has an unlabeled combobox and a decorative
// button in the tab order. Keep this narrowly scoped until upstream fixes it.
export function AdminAccessibility() {
  useEffect(() => {
    const repair = () => {
      document.querySelectorAll('.dashboard-breadcrumb-select input[role="combobox"]').forEach(input => input.setAttribute('aria-label', 'Выбрать рабочую панель'))
      document.querySelectorAll<HTMLButtonElement>('button.dropdown-indicator[aria-hidden="true"]').forEach(button => { button.tabIndex = -1 })
    }
    repair()
    const observer = new MutationObserver(repair)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [])
  return null
}
