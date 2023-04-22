

# Resource Planner
A web app to manage the organization's resources effortlessly.



## Run Locally

Clone the project

```bash
  git clone https://code.qburst.com/qb-resource-planner/qb-resource-planner-api.git
```

Go to the project directory

```bash
  cd qb-resource-planner-api
```

Install dependencies

```bash
  npm install
```
To run locally, setup local mongodb. For reference : https://www.mongodb.com/docs/manual/tutorial/install-mongodb-on-ubuntu/. After the installation, start the mongodb local service by:

```
    sudo service mongo start
```
In this application, we utilise mongoDB's transactions and sessions feature. For the same purpose the standalone MongoDB Instance has to be converted into a replica set.

To convert your standalone MongoDB instance into a replica set, begin by opening up the MongoDB configuration file

```
    sudo nano /etc/mongod.conf
```

Find the section that reads #replication: towards the bottom of this file. 

Then add a replSetName directive below this line followed by a name that MongoDB will use to identify the replica set:

```
    . . .
    replication:
    replSetName: "rs0"
    . . .
```
Following that, restart the mongod service to implement the new configuration changes:
```
    sudo systemctl restart mongod
```
After restarting the service, open up the MongoDB shell to connect to the MongoDB instance running on your server:
```
    mongo
```
From the MongoDB prompt, run the following rs.initiate() method. This will turn your standalone MongoDB instance into a single-node replica set that you can use for testing:
```
    rs.initiate()    
```
If this method returns "ok" : 1 in its output, it means the replica set was started successfully:
```
    Output
    {
    . . .
        "ok" : 1,
    . . .
```
Assuming this is the case, your MongoDB shell prompt will change to indicate that the instance the shell is connected to is now a member of the rs0 replica set:
```
    rs0:SECONDARY>

```
Note that this example prompt reflects that this MongoDB instance is a secondary member of the replica set. This is to be expected, as there is usually a gap between the time when a replica set is initiated and the time when one of its members is promoted to become the primary member.

If you were to run a command or even just press ENTER after waiting a few moments, the prompt will update to reflect that you’re connected to the replica set’s primary member:

```
    rs0:PRIMARY>
```
Your standalone MongoDB instance is now running as a single-node replica set that you can use for testing transactions. Keep the prompt open for now, as you’ll use the MongoDB shell in the next step to create an example collection and insert some sample data into it.
  
After creating a database in mongodb, take the mongoURI and add it to the environment variables. Sample mongoURI:
  ```
    'mongodb://localhost:27017/db_name'
  ```

Start the server

```bash
  npm run start
```
## Environment Variables

To run this project, you will need some environment variables. First create a file named '.env' add it to the root folder and then add the following keys and their values.

`googleClientID`

`googleClientSecret`

`mongoURI`

`jwtSecretKey`




