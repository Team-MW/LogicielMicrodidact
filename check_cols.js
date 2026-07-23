import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const env = fs.readFileSync('.env', 'utf8')
const envVars = {}
env.split('\n').forEach(line => {
  const [key, ...val] = line.split('=')
  if (key && val.length) envVars[key.trim()] = val.join('=').trim()
})

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY)

async function check() {
  const { data: pData, error: pErr } = await supabase.from('projects').select('*').limit(1)
  console.log('projects:', pData ? Object.keys(pData[0] || {}) : pErr)
  
  const { data: sData, error: sErr } = await supabase.from('software_projects').select('*').limit(1)
  console.log('software_projects:', sData ? Object.keys(sData[0] || {}) : sErr)
}
check()
