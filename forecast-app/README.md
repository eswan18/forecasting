# Forecasting App

## Development

### Hosting a local db copy

The below line will spin up a postgres container with a copy of the prod database, as it exists at the time of startup.
It relies on you havig a defined `DATABASE_URL` in your `.env.prod`.

```bash
docker-compose --env-file .env.prod -f local-pg-container.yaml up
```

You can define this `DATABASE_URL` in your `.env.local`
```bash
DATABASE_URL='postgresql://ethan:ethan@localhost:2345/forecasting'
```
And launching a dev server will use the local database copy:
```bash
npm run dev
```
