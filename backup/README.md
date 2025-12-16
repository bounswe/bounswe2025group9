# NutriHub MySQL Database Restore

**Backup:** `nutrihub-db-backup.zip`
**Dump format:** MySQL 8.0.43 (`mysqldump`)
**Output file after unzip:** `nutrihub-db-backup.sql`

## What this dump does

* Creates the database `mydb` if it does not exist
* Switches to `mydb` via `USE mydb;`
* Drops and recreates tables
* Loads all data

## Restore steps

> [!NOTE]
> This repository's default MySQL credentials (defined in `docker-compose.yml`) are:
> - **User:** `django` / **Password:** `djangopass`
> - **Root:** `root` / **Password:** `rootpass`
> 
> Replace `<user>` and `<password>` in the commands below with your actual credentials.

### Option 1: Using Docker Exec (Recommended)

This method pipes the SQL file directly into the MySQL container:

```bash
# 1. Unzip the backup file
unzip nutrihub-db-backup.zip

# 2. Restore using docker exec (pipe from host to container)
docker exec -i mysql-db mysql -u<user> -p<password> mydb < nutrihub-db-backup.sql

# Example with default credentials:
docker exec -i mysql-db mysql -udjango -pdjangopass mydb < nutrihub-db-backup.sql

# Alternative using root user:
docker exec -i mysql-db mysql -uroot -p<root_password> mydb < nutrihub-db-backup.sql
```

### Option 2: Copy File to Container

This method copies the SQL file into the container first:

```bash
# 1. Unzip the backup file
unzip nutrihub-db-backup.zip

# 2. Copy the SQL file into the container
docker cp nutrihub-db-backup.sql mysql-db:/tmp/

# 3. Execute the restore inside the container
docker exec -it mysql-db mysql -u<user> -p<password> mydb -e "source /tmp/nutrihub-db-backup.sql"

# Example with default credentials:
docker exec -it mysql-db mysql -udjango -pdjangopass mydb -e "source /tmp/nutrihub-db-backup.sql"

# 4. (Optional) Clean up
docker exec mysql-db rm /tmp/nutrihub-db-backup.sql
```

### Option 3: Native MySQL (If running MySQL locally, not in Docker)

```bash
unzip nutrihub-db-backup.zip
mysql -u <user> -p < nutrihub-db-backup.sql
```

## Requirements

* MySQL **8.x** running
* User must have `CREATE`, `DROP`, `ALTER`, `INSERT`, `INDEX` privileges

## Notes

* This is a **destructive restore** for `mydb` (existing tables are dropped)
* To restore into a different database name, edit the `CREATE DATABASE` / `USE` lines in the `.sql` file before importing

