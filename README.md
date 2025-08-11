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
You'll need to download an .iso of the ubuntu desktop operating system first, Ubuntu Desktop 24.04.3 LTS
1. install Oracle VirtualBox
2. click New
3. enter name for VM
4. in ISO image, navigate to your ISO in the file system and select it
6. under unattended install, enter a username and password for the machine
7. under hardware, chose 4096 MB (you can allocate more if you have more than 8GB ram) and 2 CPU (you can allocate more if you have a more powerful machine)
8. under hard disk, chose 15GB
9. after the VM boots up, you'll want to select Try or Install Ubuntu
10. if you get an error relating to the graphics, you made need to do this:
    In VirtualBox Settings → Display → Graphics Controller, change:
    From VMSVGA → VBoxSVGA (or vice versa, depending on your Ubuntu version).
11. Ubuntu may take quite a few minutes to boot up the first time

