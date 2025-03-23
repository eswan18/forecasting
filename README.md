# Forecasting App

This is a web application for predicting the likelihood that certain events will happen in the coming year.
Check it out at [forecasting.ethanswan.com](https://forecasting.ethanswan.com).

The idea is inspired by Philip Tetlock's [Good Judgment Project](https://en.wikipedia.org/wiki/The_Good_Judgment_Project) and book *Superforecasting*.

## What's in here?

A NextJS app and database migrations, basically.

## How is it deployed?

In Vercel, with minimal customization.

## Development Tips

### How do I run it locally?

Before running a local instance, you'll need a local copy of the database as well.
The below line spins up a postgres container with a copy of the prod database, as it exists at the time of startup.
It relies on you having a defined `DATABASE_URL` (with read access to the prod database) in your `.env.prod`.

```bash
docker-compose --env-file .env.prod -f local-pg-container.yaml up
```

Then, you can tell your local instance to use the local database copy by updating `.env.local` and adding this line:
```bash
DATABASE_URL='postgresql://ethan:ethan@localhost:2345/forecasting'
```

Last, you'll need a few other variables in your `.env.local`.

```bash
# This is used to encrypt JWTs. For local dev, it can be anything.
JWT_SECRET='whocares'

# This will need to match the prod salt if you want to be able to log in as a preexisting user.
# But if not, you can make something up.
ARGON2_SALT='ask-ethan'

# If you want to test email functionality, you'll need to get one of these.
MAILGUN_API_KEY='abcxyz'
```

Now, you can launch a fully-functional dev instance.
```bash
npm run dev
```

### Migrations

#### How do I make a new migration?

Create a migration with a relatively descriptive name, which will be embedded in the filename.
Fore consistency, use dashes instead of underscores or spaces.
```bash
npm exec kysely migrate make <migration-description>
```

#### How do I run new migrations?

Obviously it's best to do this in the staging DB and make sure all is well before going to prod.

```bash
DATABASE_URL='...' npm exec kysely migrate up
```
