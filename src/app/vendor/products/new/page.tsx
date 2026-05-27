'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import type { Region } from '@/types/database'

const CATEGORIES = [
  'Booth Structures','Lounge Furniture','Tables & Chairs',
  'Reception Counters','Flooring','Lighting','A/V & Electronics',
  'Signage & Graphics','Storage & Shelving','Outdoor Equipment',
]
const CURRENCIES = [{ id: 'INR', sym: '₹' }, { id: 'EUR', sym: '€' }, { id: 'GBP', sym: '£' }]
const REGIONS: { id: Region; label: string }[] = [
  { id: 'IN', label: '🇮🇳 India' },
  { id: 'EU', label: '🇪🇺 Europe' },
  { id: 'UK', label: '🇬🇧 UK' },
]

type ImageFile = { file: File; preview: string; uploading: boolean; url?: string; error?: string }

export default function NewProductPage() {
  const router = useRouter()
  const db     = useMemo(() => createClient() as any, [])
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])
  const [form, setForm] = useState({
    name: '', description: '', category: '',
    price_per_day: '', currency: 'INR',
    regions: [] as Region[],
    total_stock: '1', available_stock: '1',
    min_rental_days: '1', max_rental_days: '30',
    dimensions: '', weight_kg: '',
    tags: '', badge: '',
  })

  const inputCls = 'w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none focus:border-gold/50 transition-colors'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2'

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const toggleRegion = (r: Region) =>
    setForm(f => ({ ...f, regions: f.regions.includes(r) ? f.regions.filter(x => x !== r) : [...f.regions, r] }))

  const handleImageAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (images.length + files.length > 5) { toast.error('Maximum 5 images allowed'); return }

    for (const file of files) {
      if (file.size > 1024 * 1024) { toast.error(`${file.name} exceeds 1MB limit`); continue }
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { toast.error('JPEG, PNG or WebP only'); continue }

      const preview = URL.createObjectURL(file)
      const newImg: ImageFile = { file, preview, uploading: true }
      setImages(imgs => [...imgs, newImg])

      // Upload to Supabase storage
      const ext      = file.name.split('.').pop()
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { data, error } = await db.storage.from('vendor-images').upload(filename, file, { contentType: file.type })

      if (error) {
        setImages(imgs => imgs.map(i => i.preview === preview ? { ...i, uploading: false, error: error.message } : i))
        toast.error(`Upload failed: ${error.message}`)
        continue
      }

      const { data: { publicUrl } } = db.storage.from('vendor-images').getPublicUrl(filename)
      setImages(imgs => imgs.map(i => i.preview === preview ? { ...i, uploading: false, url: publicUrl } : i))
    }

    e.target.value = ''
  }

  const removeImage = (idx: number) => {
    setImages(imgs => imgs.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price_per_day || form.regions.length === 0) {
      toast.error('Name, price and at least one region required')
      return
    }
    const uploadedImages = images.filter(i => i.url)
    if (images.length > 0 && uploadedImages.length < images.length) {
      toast.error('Wait for all images to finish uploading')
      return
    }

    setSaving(true)
    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    const { data: vp } = await db.from('vendor_profiles').select('id').eq('user_id', user.id).single()
    if (!vp) { toast.error('Vendor profile not found'); setSaving(false); return }

    // Create product
    const { data: product, error } = await db.from('vendor_products').insert({
      vendor_id:        vp.id,
      name:             form.name,
      slug:             slugify(form.name) + '-' + Date.now().toString(36),
      description:      form.description   || null,
      category:         form.category      || null,
      price_per_day:    parseFloat(form.price_per_day),
      currency:         form.currency,
      regions:          form.regions,
      total_stock:      parseInt(form.total_stock)      || 1,
      available_stock:  parseInt(form.available_stock)  || 1,
      min_rental_days:  parseInt(form.min_rental_days)  || 1,
      max_rental_days:  parseInt(form.max_rental_days)  || 30,
      dimensions:       form.dimensions    || null,
      weight_kg:        form.weight_kg ? parseFloat(form.weight_kg) : null,
      tags:             form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      badge:            form.badge         || null,
    }).select().single()

    if (error) { toast.error(error.message); setSaving(false); return }

    // Save images
    for (let i = 0; i < uploadedImages.length; i++) {
      const img = uploadedImages[i]
      await db.from('product_images').insert({
        product_id: product.id,
        url:        img.url,
        filename:   img.file.name,
        size_bytes: img.file.size,
        sort_order: i,
        is_primary: i === 0,
      })
    }

    toast.success('Product listed successfully!')
    router.push('/vendor/products')
  }

  return (
    <div className="p-8 text-white max-w-[860px]">
      <Link href="/vendor/products" className="flex items-center gap-2 text-white/40 hover:text-white/70 text-sm mb-6 transition-colors">
        <ArrowLeft size={15} /> Back to Products
      </Link>
      <h1 className="font-display font-extrabold text-2xl text-white mb-8">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic info */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Product Name *</label>
              <input className={inputCls} value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Premium Modular Booth 3×3m" required />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls + ' min-h-[100px] resize-none'} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe your product — materials, what's included, setup details, condition…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Category</label>
                <select className={inputCls + ' cursor-pointer'} value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">— Select category —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Badge</label>
                <select className={inputCls + ' cursor-pointer'} value={form.badge}
                  onChange={e => setForm(f => ({ ...f, badge: e.target.value }))}>
                  <option value="">— None —</option>
                  {['New', 'Popular', 'Featured', 'Best Seller', 'Limited'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>Tags (comma separated)</label>
              <input className={inputCls} value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. modular, lightweight, LED, outdoor" />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-2">Product Images</h2>
          <p className="text-white/30 text-[12px] mb-5">Up to 5 images · Max 1MB each · JPEG, PNG or WebP</p>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                <img src={img.preview} alt="" className="w-full h-full object-cover" />
                {img.uploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {img.error && (
                  <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center">
                    <span className="text-[9px] text-red-200 text-center px-1">Error</span>
                  </div>
                )}
                {i === 0 && !img.uploading && (
                  <span className="absolute bottom-1 left-1 text-[9px] bg-gold text-navy font-bold px-1.5 py-0.5 rounded">Main</span>
                )}
                <button type="button" onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/70 text-white rounded-full flex items-center justify-center hover:bg-black transition-colors">
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <label className="w-24 h-24 border-2 border-dashed border-white/15 rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-gold/40 transition-colors">
                <Upload size={18} className="text-white/30" />
                <span className="text-[10px] text-white/30">Add photo</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleImageAdd} />
              </label>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className={labelCls}>Price Per Day *</label>
              <input className={inputCls} type="number" step="0.01" min="0" value={form.price_per_day}
                onChange={e => setForm(f => ({ ...f, price_per_day: e.target.value }))}
                placeholder="0.00" required />
            </div>
            <div>
              <label className={labelCls}>Currency</label>
              <select className={inputCls + ' cursor-pointer'} value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                {CURRENCIES.map(c => <option key={c.id} value={c.id}>{c.sym} {c.id}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Min Rental Days</label>
              <input className={inputCls} type="number" min="1" value={form.min_rental_days}
                onChange={e => setForm(f => ({ ...f, min_rental_days: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Max Rental Days</label>
              <input className={inputCls} type="number" min="1" value={form.max_rental_days}
                onChange={e => setForm(f => ({ ...f, max_rental_days: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Stock & Availability */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Stock &amp; Availability</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Total Units in Stock *</label>
              <input className={inputCls} type="number" min="1" value={form.total_stock}
                onChange={e => setForm(f => ({ ...f, total_stock: e.target.value, available_stock: e.target.value }))} />
            </div>
            <div>
              <label className={labelCls}>Currently Available</label>
              <input className={inputCls} type="number" min="0" value={form.available_stock}
                onChange={e => setForm(f => ({ ...f, available_stock: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Regions */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Delivery Regions *</h2>
          <div className="flex gap-3">
            {REGIONS.map(r => (
              <button key={r.id} type="button" onClick={() => toggleRegion(r.id)}
                className={`flex-1 py-3 rounded-lg border text-sm font-medium transition-all ${
                  form.regions.includes(r.id)
                    ? 'bg-gold/20 border-gold/50 text-gold-light'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20'
                }`}>{r.label}</button>
            ))}
          </div>
        </div>

        {/* Specs */}
        <div className="bg-white/5 border border-white/8 rounded-xl p-6">
          <h2 className="font-display font-bold text-white mb-5">Specifications (optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Dimensions</label>
              <input className={inputCls} value={form.dimensions}
                onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))}
                placeholder="e.g. 3m × 3m × 2.5m H" />
            </div>
            <div>
              <label className={labelCls}>Weight (kg)</label>
              <input className={inputCls} type="number" step="0.1" value={form.weight_kg}
                onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                placeholder="e.g. 45.5" />
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pb-4">
          <Link href="/vendor/products" className="bg-white/5 border border-white/10 text-white/60 font-medium px-6 py-3 rounded-lg hover:bg-white/10 transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving}
            className="bg-gold hover:bg-gold-light text-navy font-bold px-8 py-3 rounded-lg transition-colors disabled:opacity-60">
            {saving ? 'Publishing…' : 'Publish Product'}
          </button>
        </div>
      </form>
    </div>
  )
}
