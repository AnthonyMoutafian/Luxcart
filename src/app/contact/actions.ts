'use server'

import { createClient } from '@/utils/supabase/server'

export async function submitContactMessage(formData: FormData) {
  const supabase = await createClient()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const message = formData.get('message') as string

  const { error } = await supabase
    .from('contact_messages')
    .insert({ name, email, message })

  if (error) {
    throw new Error('Failed to submit message')
  }
}
