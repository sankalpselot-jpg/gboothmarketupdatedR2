'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ArrowLeft, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Region, VendorProduct, ProductImage } from '@/types/database'

const CATEGORIES = [
  'Booth Structures','Lounge Furniture','Tables & Chairs',
  'Reception Counters','Flooring','Lighting','A/V & Electronics',
  'Signage & Graphics','Storage & Shelving','Outdoor Equipment',
]
const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: '🇮🇳 India' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 UK' },
]

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [product, setProduct] = useState<VendorProduct | null>(null)
  const [images,  setImages]  = useState<ProductImage[]>([])
  const [saving,  setSaving]  = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    const load = async () => {
      const { data: p } = await db.from('vendor_products').select('*').eq('id', params.id).single()
      if (!p) return
      setProduct(p)
      setForm({
        name:            p.name,
        description:     p.description  || '',
        category:        p.category     || '',
        price_per_day:   p.price_per_day.toString(),
        currency:        p.currency,
        regions:         p.regions,
        total_stock:     p.total_stock.toString(),
        available_stock: p.available_stock.toString(),
        min_rental_days: p.min_rental_days.toString(),
        max_rental_days: p.max_rental_days.toString(),
        dimensions:      p.dimensions   || '',
        weight_kg:       p.weight_kg?.toString() || '',
        tags:            p.tags?.join(', ') || '',
        badge:           p.badge        || '',
        is_active:       p.is_active,
      })
      const { data: imgs } = await db.from('product_images').select('*').eq('product_id', p.id).order('sort_order')
      setImages(imgs || [])
    }
    load()
  }, [params.id, db])

  const toggleRegion = (r: Region) =>
    setForm((f: any) => ({ ...f, regions: f.regions?.includes(r) ? f.regions.filter((x: string) => x !== r) : [...(f.regions || []), r] }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) { toast.error('Maximum 5 images'); return }

    setUploading(true)
    for (const file of files) {
      if (file.size > 1024 * 1024) { toast.error(`${file.name} exceeds 1MB`); continue }
      const ext      = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: upErr } = await db.storage.from('vendor-images').upload(filename, file, { contentType: file.type })
      if (upErr) { toast.error(upErr.message); continue }
      const { data: { publicUrl } } = db.storage.from('vendor-images').getPublicUrl(filename)
      const { data: img } = await db.from('product_images').insert({
        product_id: params.id, url: publicUrl, filename: file.name,
        size_bytes: file.size, sort_order: images.length, is_primary: images.length === 0,
      }).select().single()
      if (img) setImages(imgs => [...imgs, img])
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeImage = async (img: ProductImage) => {
    await db.from('product_images').delete().eq('id', img.id)
    setImages(imgs => imgs.filter(i => i.id !== img.id))
    toast.success('Image removed')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const { error } = await db.from('vendor_products').update({
      name:            form.name,
      description:     form.description     || null,
      category:        form.category        || null,
      price_per_day:   parseFloat(form.price_per_day),
      currency:        form.currency,
      regions:         form.regions,
      total_stock:     parseInt(form.total_stock),
      available_stock: parseInt(form.available_stock),
      min_rental_days: parseInt(form.min_rental_days),
      max_rental_days: parseInt(form.max_rental_days),
      dimensions:      form.dimensions      || null,
      weight_kg:       form.weight_kg ? parseFloat(form.weight_kg) : null,
      tags:            form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      badge:           form.badge           || null,
      is_active:       form.is_active,
    }).eq('id', params.id)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Product updated!')
    router.push('/vendor/products')
  }

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2'

  if (!product) return <div className="p-8 text-white/30 text-sm">Loading…</div>

  return (
    <div className="p-8 text-white max-w-[860px]">
      <Link href="/vendor/products" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Products
      </Link>
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-extrabold text-2xl text-white">Edit Product</h1>
        <label className="flex items-center gap-2.5 cursor-pointer">
          <span className="text-sm text-white/40">Visible to consultants</span>
          <div className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${form.is_active ? 'bg-gold' : 'bg-white/15'}`}
            style={{ height: 22 }}
            onClick={() => setForm((f: any) => ({ ...f, is_active: !f.is_active }))}>
            <div className={`w-4 h-4 rounded-full bg-white absolute top-[3px] transition-all ${form.is_active ? 'left-5' : 'left-1'}`} />
          </div>
        </label>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Product Name *</label>
              <input className={inputCls} value={form.name || ''}
                onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[100px] resize-none'} value={form.description || ''}
                onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls + ' cursor-pointer'} value={form.category || ''}
                  onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}>
                  <option value="">— Select —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Badge</label>
                <select className={inputCls + ' cursor-pointer'} value={form.badge || ''}
                  onChange={e => setForm((f: any) => ({ ...f, badge: e.target.value }))}>
                  <option value="">— None —</option>
                  {['New','Popular','Featured','Best Seller','Limited'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-2">Product Images</h2>
          <p className="text-white/30 text-[12px] mb-5">Up to 5 images · Max 1MB each</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={img.id} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                {img.is_primary && <span className="absolute bottom-1 left-1 text-[9px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded">Main</span>}
                <button type="button" onClick={() => removeImage(img)}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-600/80 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className={`w-24 h-24 border-2 border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Upload size={18} className="text-white/30" />
                <span className="text-[10px] text-white/30">{uploading ? 'Uploading…' : 'Add photo'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={uploading} className="hidden" onChange={handleImageUpload} />
              </label>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Pricing &amp; Stock</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="col-span-2">
              <label className={labelCls}>Price Per Day *</label>
              <input className={inputCls} type="number" step="0.01" value={form.price_per_day || ''}
                onChange={e => setForm((f: any) => ({ ...f, price_per_day: e.target.value }))} required />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls + ' cursor-pointer'} value={form.currency || 'INR'}
                onChange={e => setForm((f: any) => ({ ...f, currency: e.target.value }))}>
                <option value="INR">₹ INR</option>
                <option value="EUR">€ EUR</option>
                <option value="GBP">£ GBP</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Stock</label>
              <input className={inputCls} type="number" min="1" value={form.total_stock || ''}
                onChange={e => setForm((f: any) => ({ ...f, total_stock: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Available Now</label>
              <input className={inputCls} type="number" min="0" value={form.available_stock || ''}
                onChange={e => setForm((f: any) => ({ ...f, available_stock: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Delivery Regions</h2>
          <div className="flex gap-3">
            {REGIONS.map(r => (
              <button key={r.id} type="button" onClick={() => toggleRegion(r.id)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                  (form.regions || []).includes(r.id)
                    ? 'bg-gold/20 border-gold/50 text-gold-light'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}>{r.label}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 justify-end pb-4">
          <Link href="/vendor/products" className="bg-white/5 border border-white/10 text-white/60 font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="bg-gold hover:bg-gold-light text-navy font-bold px-8 py-3 rounded-lg transition-colors disabled:opacity-60">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
