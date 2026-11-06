# Car Rental System Offline

Windows desktop app for managing rental vehicles. The source repository contains the Laravel API, Angular UI, and Electron app. Bundled PHP and MariaDB binaries are distributed separately as a GitHub Release ZIP.

## Requirements

- Windows 10 or 11
- Node.js 22 or newer, with npm
- Composer 2 only if `backend/vendor` is missing

The runtime ZIP contains PHP and MariaDB, so a separate XAMPP installation is not required.

## First-Time Setup

1. Clone or download this repository. From its GitHub **Releases** page, download the runtime ZIP matching the project version, then extract it into the project root. The extracted `runtime/` folder must be beside `backend/`, `frontend/`, and `desktop/`. Move the complete project folder to a writable location, for example `C:\CarRentalSystem`.

2. Keep the folder structure intact. Electron derives MariaDB's `basedir`, `datadir`, temporary directory, and error-log path from the project location at startup, so the project can be moved to another drive or directory without editing `my.ini`.

3. Configure Laravel. In PowerShell, from the project root:

	```powershell
	Set-Location backend
	if (-not (Test-Path .env)) { Copy-Item .env.example .env }
	```

	Open `backend/.env` and set the database values to match the bundled MariaDB:

	```dotenv
	DB_CONNECTION=mysql
	DB_HOST=127.0.0.1
	DB_PORT=3307
	DB_DATABASE=car_rental_db
	DB_USERNAME=root
	DB_PASSWORD=
	```

	If `backend/vendor` is absent, install Composer 2 and run this while still in `backend`:

	```powershell
	$env:PATH = "$(Resolve-Path ..\runtime\php);$env:PATH"
	composer install --no-dev --optimize-autoloader
	```

	Generate the Laravel application key and clear cached configuration from `backend`:

	```powershell
	..\runtime\php\php.exe artisan key:generate
	..\runtime\php\php.exe artisan config:clear
	Set-Location ..
	```

4. Build the Angular app. From the project root:

	```powershell
	Set-Location frontend
	npm ci
	npx ng build --base-href ./
	Set-Location ..
	```

5. Install Electron and launch the app:

	```powershell
	Set-Location desktop
	npm ci
	npm start
	```

	Electron starts MariaDB when it is not already running, starts the Laravel API, and opens the desktop window. The Angular build must exist at `frontend/dist/frontend/browser/index.csr.html` before launching.

## Database Backup and Restore

The live local database files are in `runtime/mariadb/data`. Keep this entire directory intact when using an existing runtime package; it contains the MariaDB system data and `car_rental_db` database. Do not import the backup over an existing database unless you intend to replace its tables and data.

The SQL backup is `database/backup/car_rental_db.sql`. To restore it into an already initialized and running local MariaDB, run these commands from the project root:

```powershell
.\runtime\mariadb\bin\mysql.exe -h 127.0.0.1 -P 3307 -u root -e "CREATE DATABASE IF NOT EXISTS car_rental_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
.\runtime\mariadb\bin\mysql.exe -h 127.0.0.1 -P 3307 -u root car_rental_db -e "source database/backup/car_rental_db.sql"
```

The dump contains `DROP TABLE` statements. Back up any existing data before restoring it.

## Troubleshooting

- **MariaDB executable/configuration not found:** confirm `runtime/mariadb/bin/mysqld.exe` and `runtime/mariadb/my.ini` exist, and keep the original runtime folder structure intact.
- **Database connection refused:** confirm MariaDB is listening on port `3307`; make sure `DB_PORT` in `backend/.env` is also `3307`.
- **Laravel API does not start:** confirm `backend/.env` exists, `backend/vendor` is installed, and port `8000` is available.
- **Angular build file not found:** run `npx ng build --base-href ./` from `frontend` and confirm `dist/frontend/browser/index.csr.html` exists.
- **Port already in use:** close another copy of this app or the service using port `3307` or `8000`, then try again.
- **Electron cache warnings:** Chromium cache warnings may appear on restricted or shared Windows profiles. They are separate from MariaDB/API startup; the app can still start if it reports `Car Rental Desktop is ready`.

## Publishing to GitHub

1. `runtime/` is excluded from Git by the root `.gitignore`. Push the remaining source files to the repository as usual.
2. Before packaging a runtime, inspect `runtime/mariadb/data` and `database/backup/car_rental_db.sql`. Do not publish real customer or other private data; prepare a sanitized sample database for public releases.
3. Zip the `runtime/` folder only, preserving its top-level folder name and structure. The ZIP should contain paths such as `runtime/php/php.exe` and `runtime/mariadb/bin/mysqld.exe`.
4. Create a GitHub Release for the matching source version and attach the runtime ZIP, for example `car-rental-runtime-v1.0.0-windows-x64.zip`.
5. Tell users to download the repository and the matching Release ZIP, extract the ZIP into the repository root, then follow [First-Time Setup](#first-time-setup).