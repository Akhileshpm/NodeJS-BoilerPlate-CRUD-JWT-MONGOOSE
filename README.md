

# Resource Planner
Basic nodejs application comprising mongodb setup, jwt-based authentication, CRUD APIs, and a logger setup too using winston. 

## A brief intro to the project
This is a simple back-end built using nodejs and expressjs for your easy setup. 

JWT : From the front-end we are expecting an access_token provided by google after the login steps are completed, you have to call the POST request with bearer token header. Then our passport service will do the verification and returns a jwt token for api authorizations.

MongoDB: After installing mongo or setting it up in remote atlas. Paste its link in the .env file as the value of mongoURI. 

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




