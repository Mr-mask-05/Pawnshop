# Pawnshop

## Environment

Create a `.env` file with your database connection string:

```
DATABASE_URL="postgresql://user:password@localhost:5432/pawnshop"
```

## Database

Generate and apply migrations

```
npm run db:migrate
```

Seed the default admin user and settings

```
npm run db:seed
```

## Vercel deployment

1. Provision a PostgreSQL database (for example Neon or Supabase).
2. In the Vercel project settings add a `DATABASE_URL` environment variable with the connection string.
3. Trigger the migration and seed on Vercel:
   ```
   vercel run npm run db:migrate
   vercel run npm run db:seed
   ```

