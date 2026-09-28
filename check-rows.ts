import { supabase } from './src/lib/supabase'

async function check() {
  const { count, error } = await supabase.from('calendar_tasks').select('*', { count: 'exact', head: true })
  console.log('calendar_tasks count:', count, error)
  const { count: countMissions } = await supabase.from('missions').select('*', { count: 'exact', head: true })
  console.log('missions count:', countMissions)
}
check()
