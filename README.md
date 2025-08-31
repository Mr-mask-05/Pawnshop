# Pawnshop

## Deployment

1. Copy `.env.example` to `.env` and set values for `DATABASE_URL`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL`.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Apply database migrations:
   ```sh
   npx prisma migrate deploy
   ```
4. Seed the database with demo data:
   ```sh
   npm run seed
   ```
5. Build and start the application:
   ```sh
   npm run build
   npm start
   ```

