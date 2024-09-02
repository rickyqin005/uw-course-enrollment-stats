# uw-course-stats

## About
[UW Course Stats](https://uwcoursestats.onrender.com/) is a full stack app made to track University of Waterloo course enrollment for the Fall 2024 term, complete with interactive charts and tables to visualize course popularity, dropout rates, campus activity
levels, and more. Make sure to check back often as new features are still being added!

## Setup
To set up the server, navigate to the `server` directory. Run `npm install` to install the required dependencies.
To set up the DB schemas, run the PostgreSQL code in `server/postgres/setup.sql`.
Then run `npm start` to start the server.
```
# .env for server
PGUSER=postgres username
PGPASSWORD=postgres user password
PGHOST=DB endpoint
PGPORT=5432
SERVER_PINGER_URL='https://www.google.com'
```

To set up the web client, navigate to the `client` directory and run `npm run build`.
```
# .env for client
REACT_APP_SERVER_URL=server base url
```
