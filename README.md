# coup_challenge

Download package information at 12:00 pm every day, store all information in the database, and manage the index for the latest version package.

## USING TOOLS
* Node.js
* Express
* MongoDB
* Sublime Text
* MacOS Terminal

## WEBSERVER TEST URL (GET METHOD)

### Download PACKAGES file and download 50 package files, extract package file & parsing DESCRIPTION file
http://127.0.0.1:3000/packages/download

### Download 50 package files, extract package file & parsing DESCRIPTION file (Using aleady downloaded PACKAGES file)
http://127.0.0.1:3000/packages/parse

### Display Stored Pacakges Index Info
http://127.0.0.1:3000/packages/index

## RUNNIG PROGRAM

* install node.js & mongodb
* git clone this project
* run "npm install" at project root folder
* run "node bin/www" at project root folder
* run webbrowser
* connect to http://127.0.0.1:3000 in webbrowser