On a linux machine (preferably ubuntu). You can also use WSL2 on windows:

1. Install node.js
2. Install mySQL
3. Clone this repo
4. run npm install
5. in the server/ directory. create a file called .env and paste this in there  
PORT=5500  
DB_HOST=localhost  
DB_USER=root  
DB_PASS=  
DB_NAME=shelflife  

For DB_PASS, enter the password that your mySQL server uses.

6. in mySQL, setup your database using the provided schema files in the schema/ directory
7. inside the server/ directory, in the terminal, enter 'node server.js' to start the server
8. navigate to http://localhost:5500/ in your browser to access the site