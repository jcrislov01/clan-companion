import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export async function signUp(email: string, password: string, name: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  })
  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// ... existing code stays ...

// Onboarding helpers
export async function checkOnboardingStatus(email: string) {
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed, family_id')
    .eq('email', email)
    .maybeSingle()

  if (error) throw error
  return {
    completed: data?.onboarding_completed || false,
    hasFamily: !!data?.family_id,
  }
}

export async function completeOnboarding(email: string) {
  const { error } = await supabase
    .from('users')
    .update({ onboarding_completed: true })
    .eq('email', email)

  if (error) throw error
}

export async function createFamily(name: string, userEmail: string, userName: string) {
  // Create family
  const { data: family, error: familyError } = await supabase
    .from('families')
    .insert({ name })
    .select()
    .single()

  if (familyError) throw familyError

  // Link user to family
  const { error: userError } = await supabase
    .from('users')
    .insert({
      family_id: family.id,
      email: userEmail,
      name: userName,
      role: 'parent',
      onboarding_completed: false,
    })
    .select()
    .single()

  if (userError) {
    // If user already exists, just update their family_id
    const { error: updateError } = await supabase
      .from('users')
      .update({ family_id: family.id })
      .eq('email', userEmail)

    if (updateError) throw updateError
  }

  return family.id
}

export async function addFamilyMember(
  familyId: string,
  name: string,
  role: 'parent' | 'child',
  email?: string
) {
  const { data, error } = await supabase
    .from('users')
    .insert({
      family_id: familyId,
      name,
      role,
      email: email || `${name.toLowerCase().replace(/\s+/g, '')}@family.local`,
      onboarding_completed: true, // Family members added by parent don't need onboarding
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getFamilyMembers(familyId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('family_id', familyId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function updateFamilyMember(
  userId: string,
  updates: { name?: string; role?: 'parent' | 'child' }
) {
  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)

  if (error) throw error
}

export async function deleteFamilyMember(userId: string) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId)

  if (error) throw error
}

export async function updateFamilyName(familyId: string, name: string) {
  const { error } = await supabase
    .from('families')
    .update({ name })
    .eq('id', familyId)

  if (error) throw error
}