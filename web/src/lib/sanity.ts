import { createClient } from '@sanity/client'

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID

export const client = projectId
  ? createClient({
      projectId,
      dataset: import.meta.env.PUBLIC_SANITY_DATASET ?? 'production',
      useCdn: false,
      apiVersion: '2024-01-01',
    })
  : null

// Sanity image URL helper — appends dimension/crop params to the raw asset URL
export function imageUrl(url: string, w = 1200, h?: number): string {
  if (!url) return ''
  const params = new URLSearchParams({ w: String(w), fit: 'max', auto: 'format' })
  if (h) params.set('h', String(h))
  return `${url}?${params}`
}

export interface Post {
  _id: string
  title: string
  slug: { current: string }
  excerpt?: string
  publishedAt?: string
  coverImageUrl?: string
  author?: { name: string; pictureUrl?: string }
  body?: Block[]
}

export interface Block {
  _key: string
  _type: string
  style?: string
  children?: Span[]
  markDefs?: MarkDef[]
  asset?: { url: string }
  caption?: string
}

export interface Span {
  _key: string
  _type: 'span'
  text: string
  marks?: string[]
}

export interface MarkDef {
  _key: string
  _type: string
  href?: string
}

const postFields = `
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  "coverImageUrl": coverImage.asset->url,
  "author": author->{ name, "pictureUrl": picture.asset->url }
`

export async function getAllPosts(): Promise<Post[]> {
  if (!client) return []
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) { ${postFields} }`
  )
}

export async function getPost(slug: string): Promise<Post | null> {
  if (!client) return null
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] {
      ${postFields},
      body[] {
        ...,
        _type == "image" => { ..., "asset": asset->{ url } }
      }
    }`,
    { slug }
  )
}

export async function getAllSlugs(): Promise<string[]> {
  if (!client) return []
  const results = await client.fetch<{ slug: { current: string } }[]>(
    `*[_type == "post"]{ slug }`
  )
  return results.map((r) => r.slug.current)
}
