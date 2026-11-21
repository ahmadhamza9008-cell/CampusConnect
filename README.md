# CampusConnect

CampusConnect is a static student opportunities directory backed by Supabase.

## Run locally

Serve the project with any static web server:

```bash
python3 -m http.server 4173
```

Open `http://localhost:4173/index.html`. The admin page is at
`http://localhost:4173/admin.html`.

## Supabase requirements

Create an `opportunities` table with at least these columns:

- `id` - primary key
- `title` - text
- `category` - text
- `description` - text
- `deadline` - date
- `url` - text
- `status` - text (`pending`, `approved`, or `rejected`)
- `created_at` - timestamp

## Database security

Apply [`supabase/migrations/20261120213700_opportunities_rls.sql`](./supabase/migrations/20261120213700_opportunities_rls.sql)
in the Supabase SQL Editor (or through your migration workflow). It enables
Row Level Security and grants:

- Public visitors permission to read approved opportunities and submit pending
  opportunities.
- The configured admin permission to read, create, update, and delete records.

The migration identifies the admin by the UUID configured in `admin.js`.
If your admin account has a different UUID, update the UUID in both
`admin.js` and the migration before applying it. The JavaScript check only
controls the interface; the database policies are what enforce access.

## Admin dashboard

Sign in at `admin.html` with the configured Supabase administrator account.
The dashboard loads all opportunities, provides status and search filters, and
lets the administrator add, edit, approve, reject, or delete records. New
opportunities can be created as approved (publicly visible) or pending review.

To verify authentication, sign in with the configured administrator and use
**Log Out**; non-admin accounts should be denied access. Actual sign-in requires
an administrator account configured in the Supabase project.
