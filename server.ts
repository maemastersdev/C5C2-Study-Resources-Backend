import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false }
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()) //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();
/*--------------------------Get all users on the database ---------------------------------*/
app.get("/users", async (req, res) => {
 const allUsers = await client.query("SELECT * FROM users");
 res.json(allUsers.rows)
});


/*--------------------------Get all the study resources ---------------------------------*/
app.get("/resources", async (req, res) => {
  const allResources = await client.query("SELECT * FROM resources ORDER BY date DESC ");
  res.json(allResources.rows)
 });
/*--------------------------Get all the study resources that a single user has made ---------------------------------*/
 app.get("/myPost/:userId", async (req,res) => {
  const {userId} = req.params
  const myPost = await client.query("SELECT resources.resource_id FROM resources INNER JOIN users ON resources.user_id=users.user_id WHERE users.user_id=$1;",[userId])
  res.json(myPost.rows)
  // returns every resource id for a post a specified user has submitted
 })

/*--------------------------Get tags for a single resource ---------------------------------*/
app.get("/tags/:resourceId" , async (req,res) => {
  const {resourceId} = req.params;
  const resourceTags = await client.query("SELECT tag from tags WHERE resource_id = $1" , [resourceId]);
  res.json(resourceTags.rows);
})

/*--------------------------Get all resources for a given tag ---------------------------------*/
app.get("/resourcesTag/:tag" , async (req,res) => {
  const {tag} = req.params;
  const groupedTagResources = await client.query("SELECT resource_id FROM tags WHERE tag = $1", [tag]);
  res.json(groupedTagResources.rows);
})

/*--------------------------Get all favourites for a given user_id ---------------------------------*/
app.get("/favourites/:userId" , async (req,res) => {
  const {userId} = req.params;
  const userFavourites = await client.query("SELECT resource_id FROM favourites WHERE user_id=$1 ", [userId]);
  res.json(userFavourites.rows);
})

/*--------------------------Like A Post ---------------------------------*/
app.put("/like/:resourceId" , async (req,res) => {
  const {resourceId} = req.params;
  const response = await client.query("UPDATE resources SET likes =  likes + 1 WHERE resource_id = $1", [resourceId]);
  res.json("you have increase the likes by 1 !!!!!");
})

/*--------------------------Dislike A Post ---------------------------------*/
app.put("/dislike/:resourceId" , async (req,res) => {
  const {resourceId} = req.params;
  const response = await client.query("UPDATE resources SET likes =  likes - 1 WHERE resource_id = $1", [resourceId]);
  res.json("you have decreased the likes by 1 !!!!!");
})



 
//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw 'Missing PORT environment variable.  Set it in .env file.';
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
