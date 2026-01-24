# Ok, migration time!
Pretty much, if you want to migrate this to run locally, this is quite easy:
1. npm run dev and uv run server.py still work on the front and backend
2. The primary thing you'll need to do is spinup a local postgres server that can store data. For that, do the following:
- Install postgres
- Create a user called capstone with password capstone, and set login to true ( pgadmin is a good tool for this )
- Pipe the SQL_MIGRATION.sql file into that, and alter the database user to capstone
- It should work after that