On a linux machine (preferably ubuntu). You can also use WSL2 on windows:

1. Install node.js
       sudo apt install nodejs npm
3. Install mySQL
       'sudo apt install mysql-server'
       for workbench you'll need to run these commands
       'wget https://dev.mysql.com/get/mysql-apt-config_0.8.29-1_all.deb'
        if it asks, select Ubuntu Jammy as the version
       run 'sudo apt update'
        then run 'sudo snap install mysql-workbench-community'

5. navigate to Documents folder
6. Clone this repo. to be able to clone, you'll need to generate an SSH key and add it to your github account
   ssh-keygen -t ed25519 -C "your_email@example.com"
   
8. run npm install
9. in the server/ directory. create a file called .env and paste this in there  
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
5. you will also want to check the box next to Guest Additions
6. under unattended install, enter a username and password for the machine
7. under hardware, chose 4096 MB (you can allocate more if you have more than 8GB ram) and 2 CPU (you can allocate more if you have a more powerful machine)
8. under hard disk, chose 15GB
9. after the VM boots up, you'll want to select Try or Install Ubuntu
11. Ubuntu may take quite a few minutes to boot up the first time

