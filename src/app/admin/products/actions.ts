'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid'

export async function addProduct(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const image = formData.get('image') as File
  const status = formData.get('status') as 'active' | 'inactive'
  const stock = parseInt(formData.get('stock') as string) || 0
  const category = formData.get('category') as string

  let image_url = null

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('products')
      .upload(fileName, image)

    if (uploadError) {
      throw new Error('Failed to upload image')
    }

    const { data: { publicUrl } } = supabase.storage
      .from('products')
      .getPublicUrl(fileName)
    
    image_url = publicUrl
  }

  const { error } = await supabase.from('products').insert({
    name,
    description,
    price,
    image_url,
    status,
    stock,
    category
  })

  if (error) {
    throw new Error('Failed to create product: ' + error.message)
  }

  revalidatePath('/admin/products')
  revalidatePath('/store')
  redirect('/admin/products')
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient()

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const price = parseFloat(formData.get('price') as string)
  const stock = parseInt(formData.get('stock') as string) || 0
  const category = formData.get('category') as string

  const { error } = await supabase
    .from('products')
    .update({
      name,
      description,
      price,
      stock,
      category
    })
    .eq('id', id)

  if (error) {
    throw new Error('Failed to update product: ' + error.message)
  }

  revalidatePath('/admin/products')
  revalidatePath('/store')
  redirect('/admin/products')
}

export async function deleteProduct(productId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)

  if (error) {
    throw new Error('Failed to delete product')
  }

  revalidatePath('/admin/products')
  revalidatePath('/store')
}

export async function toggleProductStatus(productId: string, currentStatus: 'active' | 'inactive') {
  const supabase = await createClient()
  const newStatus = currentStatus === 'active' ? 'inactive' : 'active'

  const { error } = await supabase
    .from('products')
    .update({ status: newStatus })
    .eq('id', productId)

  if (error) {
    throw new Error('Failed to update product status')
  }

  revalidatePath('/admin/products')
  revalidatePath('/store')
}
