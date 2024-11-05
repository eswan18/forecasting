# Forecasting App

## Development

### Hosting a local db copy

The below line will spin up a postgres container with a copy of the prod database, as it exists at the time of startup.
It relies on you havig a defined `DATABASE_URL` in your `.env.local`.

```bash
docker-compose --env-file .env.local -f local-pg-container.yaml up
```

Then you can override the `DATABASE_URL` for the app by setting it on startup:
```
DATABASE_URL='postgresql://ethan:ethan@localhost:5432/forecasting' npm run dev
```
