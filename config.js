/* =====================================================================
   Lauren Beck | Narrator — Supabase connection

   Both values below are meant to be public. The publishable key only
   grants what the RLS policies allow: reading rows where active = true.
   It cannot write anything. The service_role key must never appear here.
   ===================================================================== */
window.LB_CONFIG = {
  url: "https://pwjdjrweyrnatqjtvbxd.supabase.co",
  key: "sb_publishable_4XlB77BcD5dST4NBHH2vuw_pjkbC2rc",

  /* Bumped when a file at a stable /assets path is replaced in place.
     The audio URLs were pinned by an immutable cache header once; this
     keeps returning visitors off the stale copy. */
  assetVersion: 2
};
