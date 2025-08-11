On a linux machine (preferably ubuntu):

1. Install node.js
2. Install mySQL
3. Clone repo
4. run npm install
5. in the server/ directory. create a file called .env and paste this in there
PORT=5500  
DB_HOST=localhost  
DB_USER=root  
DB_PASS=  
DB_NAME=shelflife  

For DB_PASS, enter the password that your mySQL database uses.

6. in mySQL setup database using the provided schema files in the schema/ directory