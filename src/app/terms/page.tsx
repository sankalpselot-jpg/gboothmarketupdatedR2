import type { Metadata } from 'next'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import RegionBar from '@/components/region/RegionBar'
import Topbar from '@/components/layout/Topbar'

export const metadata: Metadata = { title: 'Terms of Service' }

const clauses = [
  {
    title: '1. Agreement',
    body: 'By placing an order or submitting a quote request through BoothMarket, you agree to these Terms of Service. BoothMarket Ltd is registered in England and Wales. These terms are governed by English law.',
  },
  {
    title: '2. Rental Agreement',
    body: 'All items are provided on a rental basis for the duration of the specified event only. Ownership remains with BoothMarket at all times. Items must not be sub-let, modified, or taken off-site without written consent.',
  },
  {
    title: '3. Booking & Payment',
    body: 'Orders are confirmed upon receipt of full payment. Prices are quoted excluding applicable taxes (VAT for EU/UK, GST for India). Tax is added at checkout based on your billing address and VAT/GSTIN registration status. All prices are in the currency displayed at time of order.',
  },
  {
    title: '4. Cancellation Policy',
    body: 'Cancellations made more than 14 days before the event date receive a full refund less a 10% administration fee. Cancellations within 14 days but more than 72 hours before delivery receive a 50% refund. Cancellations within 72 hours of scheduled delivery are non-refundable.',
  },
  {
    title: '5. Delivery & Installation',
    body: 'BoothMarket will deliver and install all items at the agreed venue within the show\'s move-in window. The customer is responsible for ensuring access is available and that all necessary venue permits have been obtained. BoothMarket is not liable for delays caused by venue restrictions beyond our control.',
  },
  {
    title: '6. Damage & Loss',
    body: 'The customer accepts liability for any damage to or loss of rented items during the rental period, beyond reasonable wear and tear. Damage will be assessed and invoiced at replacement cost. We strongly recommend informing your event insurance provider of rented items.',
  },
  {
    title: '7. Intellectual Property',
    body: 'All product imagery, descriptions, and platform content are owned by BoothMarket Ltd. You may not reproduce, redistribute or commercialise any content without written permission.',
  },
  {
    title: '8. Limitation of Liability',
    body: 'BoothMarket\'s liability is limited to the value of the rental order placed. We are not liable for indirect losses, loss of profits, or consequential damages arising from late delivery, equipment failure, or cancellation of the event.',
  },
  {
    title: '9. Governing Law',
    body: 'These terms are governed by English law. For EU customers, mandatory consumer protection rights under applicable EU Directives are not affected. For India customers, disputes shall be subject to the jurisdiction of courts in New Delhi.',
  },
  {
    title: '10. Changes to Terms',
    body: 'We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance. The version in effect at the time of your order applies to that order.',
  },
]

export default function TermsPage() {
  return (
    <>
      <RegionBar /><Topbar /><Header />
      <main className="bg-cream py-14 px-10 min-h-screen">
        <div className="max-w-[800px] mx-auto">
          <h1 className="font-display font-extrabold text-4xl text-navy mb-3">Terms of Service</h1>
          <p className="text-[#6B6B6B] mb-10 text-sm">Last updated 1 January 2026. Applies to all BoothMarket orders across Europe, UK and India.</p>
          <div className="space-y-5">
            {clauses.map(c => (
              <div key={c.title} className="card p-6">
                <h2 className="font-display font-bold text-navy text-base mb-2">{c.title}</h2>
                <p className="text-[#6B6B6B] text-[14px] leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
          <p className="text-[12.5px] text-[#6B6B6B] mt-8 text-center">
            Questions? Contact <a href="mailto:legal@boothmarket.com" className="text-gold hover:underline">legal@boothmarket.com</a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
