import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'
import type { ReactNode } from 'react'
import { importMap } from './admin/importMap'
import './custom.css'
import { AdminAccessibility } from '../../components/AdminAccessibility'

const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  return handleServerFunctions({ ...args, config, importMap })
}

export default function Layout({ children }: { children: ReactNode }) {
  return <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}><AdminAccessibility />{children}</RootLayout>
}
