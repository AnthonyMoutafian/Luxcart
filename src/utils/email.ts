import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOrderConfirmation(orderId: string) {
  // Use Service Role Key to access user email and storage
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch Order Details
  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        product:products (*)
      )
    `)
    .eq('id', orderId)
    .single()

  if (!order) throw new Error('Order not found')

  // Fetch User Email
  const { data: { user: adminUser }, error } = await supabase.auth.admin.getUserById(order.user_id)
  
  if (error || !adminUser || !adminUser.email) {
     console.error('Could not fetch user email', error)
     return
  }

  // Get Invoice URL (Signed)
  let invoiceAttachment = null
  if (order.invoice_url) {
     const { data } = await supabase.storage
        .from('invoices')
        .createSignedUrl(order.invoice_url, 3600)
     
     if (data?.signedUrl) {
        // Fetch the PDF content to attach
        const pdfRes = await fetch(data.signedUrl)
        const pdfBuffer = await pdfRes.arrayBuffer()
        invoiceAttachment = {
           filename: `Invoice-${order.id}.pdf`,
           content: Buffer.from(pdfBuffer)
        }
     }
  }

  await resend.emails.send({
    from: 'Luxcart <onboarding@resend.dev>', // Use verified domain in prod
    to: adminUser.email,
    subject: `Order Confirmation #${order.id}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Your order #${order.id} has been confirmed.</p>
      <p>Total: $${order.total_amount}</p>
      <p>You can view your order in your account dashboard.</p>
    `,
    attachments: invoiceAttachment ? [invoiceAttachment] : []
  })
}
