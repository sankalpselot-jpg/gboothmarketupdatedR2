import { redirect } from 'next/navigation'
import type { SearchParams } from 'next/dist/server/request/search-params'

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const query  = new URLSearchParams(params).toString()
  redirect(query ? `/browse?${query}` : '/browse')
}
