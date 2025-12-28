import PDFDocument from 'pdfkit'
import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function generateInvoice(order: any, items: any[], user: any) {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 })
      const buffers: Buffer[] = []

      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', async () => {
        const pdfData = Buffer.concat(buffers)
        
        // Upload to Supabase Storage
        const supabase = await createClient()
        const fileName = `${user.id}/${order.id}.pdf`
        
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(fileName, pdfData, {
            contentType: 'application/pdf',
            upsert: true
          })

        if (uploadError) {
          reject(uploadError)
          return
        }

        // Get public URL (Note: The bucket is private in schema, so we should probably generate a signed URL or just store the path. 
        // For simplicity in email, a signed URL is better, but here we return the path or let the user download from dashboard via signed URL.
        // The prompt says "Store invoice URL in Supabase". 
        // Since the bucket is private (as per schema `insert into storage.buckets ... public: false`), we can't use publicUrl.
        // We will return the path and generate signed URL when needed.
        // BUT, for the email attachment, we need the buffer. 
        // Actually, let's just return the buffer AND upload it.
        // Or better, return the path and let the caller handle URL generation.
        
        resolve(fileName)
      })

      generateHeader(doc)
      generateCustomerInformation(doc, order, user)
      generateInvoiceTable(doc, items)
      generateFooter(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

function generateHeader(doc: PDFKit.PDFDocument) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Luxcart', 50, 57)
    .fontSize(10)
    .text('Luxcart Inc.', 200, 50, { align: 'right' })
    .text('123 Luxury Ave', 200, 65, { align: 'right' })
    .text('New York, NY, 10025', 200, 80, { align: 'right' })
    .moveDown()
}

function generateCustomerInformation(doc: PDFKit.PDFDocument, order: any, user: any) {
  doc
    .fillColor('#444444')
    .fontSize(20)
    .text('Invoice', 50, 160)

  generateHr(doc, 185)

  const customerInformationTop = 200

  doc
    .fontSize(10)
    .text('Invoice Number:', 50, customerInformationTop)
    .font('Helvetica-Bold')
    .text(order.id.substring(0, 8), 150, customerInformationTop)
    .font('Helvetica')
    .text('Invoice Date:', 50, customerInformationTop + 15)
    .text(new Date(order.created_at).toLocaleDateString(), 150, customerInformationTop + 15)
    .text('Balance Due:', 50, customerInformationTop + 30)
    .text(
      formatCurrency(order.total_amount),
      150,
      customerInformationTop + 30
    )

    .font('Helvetica-Bold')
    .text(user.email, 300, customerInformationTop)
    .font('Helvetica')
    .moveDown()

  generateHr(doc, 252)
}

function generateInvoiceTable(doc: PDFKit.PDFDocument, items: any[]) {
  let i
  const invoiceTableTop = 330

  doc.font('Helvetica-Bold')
  generateTableRow(
    doc,
    invoiceTableTop,
    'Item',
    'Unit Cost',
    'Quantity',
    'Line Total'
  )
  generateHr(doc, invoiceTableTop + 20)
  doc.font('Helvetica')

  for (i = 0; i < items.length; i++) {
    const item = items[i]
    const position = invoiceTableTop + (i + 1) * 30
    generateTableRow(
      doc,
      position,
      item.product.name,
      formatCurrency(item.price),
      item.quantity,
      formatCurrency(item.price * item.quantity)
    )

    generateHr(doc, position + 20)
  }
}

function generateFooter(doc: PDFKit.PDFDocument) {
  doc
    .fontSize(10)
    .text(
      'Payment is due within 15 days. Thank you for your business.',
      50,
      780,
      { align: 'center', width: 500 }
    )
}

function generateTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  item: string,
  unitCost: string,
  quantity: string | number,
  lineTotal: string
) {
  doc
    .fontSize(10)
    .text(item, 50, y)
    .text(unitCost, 280, y, { width: 90, align: 'right' })
    .text(quantity.toString(), 370, y, { width: 90, align: 'right' })
    .text(lineTotal, 0, y, { align: 'right' })
}

function generateHr(doc: PDFKit.PDFDocument, y: number) {
  doc
    .strokeColor('#aaaaaa')
    .lineWidth(1)
    .moveTo(50, y)
    .lineTo(550, y)
    .stroke()
}

function formatCurrency(cents: number) {
  return "$" + cents.toFixed(2)
}
