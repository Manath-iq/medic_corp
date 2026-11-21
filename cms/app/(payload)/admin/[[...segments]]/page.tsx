import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'
import { notFound } from 'next/navigation'
import Login from '../../../../components/Login'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<Record<string, string | string[]>>
}
export const generateMetadata = (args: Args) => generatePageMetadata({ config, ...args })
export default async function Page(args: Args) {
  const { segments = [] } = await args.params
  if (['forgot', 'reset'].includes(segments[0])) notFound()
  if (segments.length === 1 && segments[0] === 'login') return <Login />
  return RootPage({ config, importMap, ...args })
}
