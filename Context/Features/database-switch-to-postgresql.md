Our project currently uses Microsoft Sql Server database. I need to host the database on Supabase so I would like to switch to PostgreSQL.

## Docker file and docker compose
Make sure the docker container has IMS_DB database using 17-alpine postgresql.
Do not just create the database. Add tables in the database too. 
Database user should be postgres and password should be sasa@123.
Same schema, same naming convention, same tables should be converted to postgresql.

## Rules
The project is built using the database first approach. So do not switch it to code first approach. No migrations allowed. You can edit dbscript.sql in the root.
Follow naming conventions Tbl_(name here) to ensure standard in our project.
