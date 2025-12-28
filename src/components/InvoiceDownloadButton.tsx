'use client'

import { createClient } from '@/utils/supabase/client'
import { Download } from 'lucide-react'

export default function InvoiceDownloadButton({ invoicePath }: { invoicePath: string }) {
  const handleDownload = async () => {
    const supabase = createClient()
    const { data, error } = await supabase.storage
      .from('invoices')
      .createSignedUrl(invoicePath, 60) // Valid for 60 seconds

    if (data?.signedUrl) {
      window.open(data.signedUrl, '_blank')
    } else {
       alert('Could not download invoice')
    }
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center text-indigo-600 hover:text-indigo-500"
    >
      <Download className="h-5 w-5 mr-1" />
      Invoice
    </button>
  )
}
