import { NextRequest, NextResponse } from 'next/server'

const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY

export async function GET(req: NextRequest) {
  if (!PLACES_KEY) {
    return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
  }

  const { searchParams } = new URL(req.url)
  const query  = searchParams.get('query')
  const city   = searchParams.get('city')
  const lat    = searchParams.get('lat')
  const lng    = searchParams.get('lng')
  const action = searchParams.get('action') || 'search'

  // ── Get photo URL ─────────────────────────────────────────
  if (action === 'photo') {
    const ref = searchParams.get('ref')
    if (!ref) return NextResponse.json({ error: 'ref required' }, { status: 400 })
    const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${PLACES_KEY}`
    // Redirect to Google's photo URL
    return NextResponse.redirect(url)
  }

  // ── Text search for exhibition rental companies ───────────
  const searchQuery = query
    ? `${query} exhibition booth rental`
    : `exhibition booth rental ${city || ''}`

  const textSearchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json')
  textSearchUrl.searchParams.set('query', searchQuery)
  textSearchUrl.searchParams.set('key', PLACES_KEY)
  textSearchUrl.searchParams.set('type', 'establishment')
  if (lat && lng) {
    textSearchUrl.searchParams.set('location', `${lat},${lng}`)
    textSearchUrl.searchParams.set('radius', '50000') // 50km
  }

  const searchRes = await fetch(textSearchUrl.toString())
  const searchData = await searchRes.json()

  if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
    return NextResponse.json({
      error: `Google Places error: ${searchData.status}`,
      details: searchData.error_message || ''
    }, { status: 500 })
  }

  const places = searchData.results || []

  // ── Fetch details for top 8 results ──────────────────────
  const detailed = await Promise.all(
    places.slice(0, 8).map(async (place: any) => {
      const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
      detailUrl.searchParams.set('place_id', place.place_id)
      detailUrl.searchParams.set('fields', 'name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,photos,opening_hours,types,business_status,url')
      detailUrl.searchParams.set('key', PLACES_KEY)

      const detailRes  = await fetch(detailUrl.toString())
      const detailData = await detailRes.json()
      const d          = detailData.result || {}

      // Build photo URLs via our proxy (avoids CORS + hides API key)
      const photos = (d.photos || place.photos || []).slice(0, 3).map((p: any) => ({
        url: `/api/places?action=photo&ref=${p.photo_reference}`,
        ref: p.photo_reference,
      }))

      return {
        place_id:      place.place_id,
        name:          d.name          || place.name,
        address:       d.formatted_address || place.formatted_address,
        phone:         d.formatted_phone_number || null,
        website:       d.website       || null,
        rating:        d.rating        ?? place.rating ?? null,
        review_count:  d.user_ratings_total ?? place.user_ratings_total ?? 0,
        is_open:       d.opening_hours?.open_now ?? null,
        maps_url:      d.url           || `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
        photos,
        types:         d.types         || place.types || [],
        business_status: d.business_status || 'OPERATIONAL',
      }
    })
  )

  return NextResponse.json({
    results: detailed.filter(d => d.business_status !== 'CLOSED_PERMANENTLY'),
    total:   detailed.length,
    query:   searchQuery,
  })
}
