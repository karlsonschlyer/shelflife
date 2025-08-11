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

Setting up local linux virtual machine
You'll need to download an .iso of the ubuntu desktop operating system first Ubuntu Desktop 24.04.3 LTS
1. install Oracle VirtualBox
2. click New
3. enter name for VM
4. Type = linux
5. subtype = ubuntu
6. on the next screen, processors - 1 CPU, base memory = 2 GBs (2048 MBs)
7. next screen, virtual hard disk of 10GB
