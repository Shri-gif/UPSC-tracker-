import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gpcbkguyrkluazkznybf.supabase.co'
const supabaseKey = 'sb_publishable_G68X4gRScisCoGJTEKirFA_bXi-NWcL'

export const supabase = createClient(supabaseUrl, supabaseKey)
  
@param {Object} studyData
async function submitStudyLog(studyData) {
  const { data, error } = await supabase
    .from('entries')
    .insert([
      {
        date: studyData.date, // Format: 'YYYY-MM-DD'
        gsHours: studyData.gsHours || 0,
        csatHours: studyData.csatHours || 0,
        optionalHours: studyData.optionalHours || 0,
        currentAffairs: studyData.currentAffairs || 0,
        revisionHours: studyData.revisionHours || 0,
        mockHours: studyData.mockHours || 0,
        // user_id is automatically handled if using Supabase Auth
      },
    ])
    .select()

  if (error) {
    console.error('Error uploading to Supabase:', error.message)
    return { success: false, error }
  }

  console.log('Log saved successfully!', data)
  return { success: true, data }
}

// Example usage:
// submitStudyLog({
//   date: '2026-04-02',
//   gsHours: 4.5,
//   currentAffairs: 2,
//   revisionHours: 1.5
// });
