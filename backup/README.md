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

