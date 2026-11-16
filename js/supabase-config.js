/* VORIX: Supabase connection settings. This is the ONLY place you enter them.
   Used by the public website (read-only) and by the /admin/ dashboard.

   Supabase dashboard > Project Settings > API:
     - "Project URL"                         -> SUPABASE_URL      (looks like https://abcdxyz.supabase.co)
     - "anon" / "publishable" public key     -> SUPABASE_ANON_KEY (a long string; safe to publish)

   NEVER paste the "service_role" / "secret" key here. It would give every visitor full control of your database.
   Security comes from the Row Level Security rules in supabase/setup.sql, not from hiding this file.

   While these two values are empty the website keeps showing the products in js/products.js. */
const SUPABASE_URL = "";
const SUPABASE_ANON_KEY = "";

/* When the connected database has NO published products yet, keep showing the products from js/products.js
   (true) or show an empty shop (false). Run supabase/seed_existing_products.sql to copy them into Supabase. */
const USE_STATIC_WHEN_EMPTY = true;
