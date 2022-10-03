import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";
import discord from "discord.js"
import { EmbedBuilder, WebhookClient } from 'discord.js';
//fine so far
config(); //Read .env file lines as though they were env vars.
const webhookClient = new WebhookClient({ id: process.env.DISCORD_ID, token: process.env.DISCORD_TOKEN });

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL ? false : herokuSSLSetting;
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();
/*--------------------------Get all users on the database ---------------------------------*/
app.get("/users", async (req, res) => {
  const allUsers = await client.query("SELECT * FROM users");
  res.json(allUsers.rows);
});

/*--------------------------Get single user on the database ---------------------------------*/
app.get("/user/:id", async (req, res) => {
  const { id } = req.params;
  const singlUser = await client.query(
    "SELECT user_name FROM users WHERE user_id = $1",
    [id]
  );
  res.json(singlUser.rows);
});

/*--------------------------Get all the study resources ---------------------------------*/
app.get("/resources", async (req, res) => {
  const allResources = await client.query(
    "SELECT * FROM resources ORDER BY date DESC "
  );
  res.json(allResources.rows);
});

/*--------------------------Get A Single Study Resource For A Given resource_id ---------------------------------*/
app.get("/resource/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await client.query(
      "SELECT * FROM resources WHERE resource_id = $1 ",
      [id]
    );
    res.json(response.rows);
  } catch (error) {
    console.error(error);
  }
});

/*--------------------------Get all the study resources that a single user has made ---------------------------------*/
app.get("/myPost/:userId", async (req, res) => {
  const { userId } = req.params;
  const myPost = await client.query(
    "SELECT resources.resource_id FROM resources INNER JOIN users ON resources.user_id=users.user_id WHERE users.user_id=$1;",
    [userId]
  );
  res.json(myPost.rows);
  // returns every resource id for a post a specified user has submitted
});

/*--------------------------Get tags for a single resource ---------------------------------*/
app.get("/tags/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const resourceTags = await client.query(
    "SELECT tag from tags WHERE resource_id = $1",
    [resourceId]
  );
  res.json(resourceTags.rows);
});

/*--------------------------Get all resources for a given tag ---------------------------------*/
app.get("/resourcesTag/:tag", async (req, res) => {
  const { tag } = req.params;
  const groupedTagResources = await client.query(
    "SELECT resource_id FROM tags WHERE tag = $1",
    [tag]
  );
  res.json(groupedTagResources.rows);
});

/*--------------------------Get all Tags ---------------------------------*/
app.get("/tags", async (req, res) => {
  const allTags = await client.query("SELECT * FROM tags");
  res.json(allTags.rows);
});

/*--------------------------Get all favourites for a given user_id ---------------------------------*/
app.get("/favourites/:userId", async (req, res) => {
  const { userId } = req.params;
  const userFavourites = await client.query(
    "SELECT resource_id FROM favourites WHERE user_id=$1 ",
    [userId]
  );
  res.json(userFavourites.rows);
});

/*--------------------------Get all likes for a given resource_id ---------------------------------*/
app.get("/likes/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const likes = await client.query(
    "SELECT likes FROM resources WHERE resource_id=$1 ",
    [resourceId]
  );
  res.json(likes.rows);
});

/*--------------------------Like A Post ---------------------------------*/
app.put("/like/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const response = await client.query(
    "UPDATE resources SET likes =  likes + 1 WHERE resource_id = $1",
    [resourceId]
  );
  res.json("you have increased the likes by 1 !!!!!");
});

/*--------------------------Dislike A Post ---------------------------------*/
app.put("/dislike/:resourceId", async (req, res) => {
  const { resourceId } = req.params;
  const response = await client.query(
    "UPDATE resources SET likes =  likes - 1 WHERE resource_id = $1",
    [resourceId]
  );
  res.json("you have decreased the likes by 1 !!!!!");
});

/*--------------------------Get All comments for a post ---------------------------------*/
app.get("/comments/:resourceId", async (req, res) => {
  try {
    const { resourceId } = req.params;
    const response = await client.query(
      "SELECT * FROM comments WHERE resource_id = $1",
      [resourceId]
    );

    res.json(response.rows);
  } catch (error) {
    console.error(error);
  }
});

/*-------------------------- Post A Single Comment ---------------------------------*/
app.post("/comment", async (req, res) => {
  try {
    const { resource_id, user_name, comment } = req.body;
    const response = await client.query(
      "INSERT INTO COMMENTS (resource_id, user_name, comment) VALUES($1,$2,$3) ",
      [resource_id, user_name, comment]
    );

    console.log(resource_id, user_name, comment);

    res.json("your comment has been posted");
  } catch (error) {
    console.error(error);
  }
});

/*--------------------------Add to Favourites  ---------------------------------*/
app.post("/addFav/:userName/:resourceId", async (req, res) => {
  try {
    const { userName, resourceId } = req.params;
    const response = await client.query(
      "INSERT INTO favourites (user_name, resource_id) VALUES($1,$2) ON CONFLICT DO NOTHING",
      [userName, resourceId]
    );
    res.json(
      "This may have been added to your favourites if it wasn't there already"
    );
  } catch (error) {
    console.error(error.message);
    res.status(409);
  }
});

/*--------------------------Remove Favourites  ---------------------------------*/
app.delete("/removeFav/:userId/:resourceId", async (req, res) => {
  try {
    const { userId, resourceId } = req.params;
    const response = await client.query(
      "DELETE FROM favourites WHERE user_name = $1 AND resource_Id = $2",
      [userId, resourceId]
    );
    res.json("It's gone we took care of  it no longer in your favourites");
  } catch (error) {
    console.error(error.message);
    res.status(409);
  }
});

/*--------------------------Check if resource is a favourite  ---------------------------------*/
app.get("/getFav/:userId/:resourceId", async (req, res) => {
  try {
    const { userId, resourceId } = req.params;
    const response = await client.query(
      "SELECT * FROM favourites WHERE user_name = $1 AND resource_id = $2",
      [userId, resourceId]
    );
    const isFav = (response.rows.length > 0 ? true : false)

    res.json(isFav);
  } catch (error) {
    console.error(error.message);
    res.status(409);
  }
});


/*--------------------------Post Resource Submission  ---------------------------------*/
app.post("/postResource", async (req, res) => {
  console.log("we are in the postResource ");

  try {
    const {
      resource_name,
      author_name,
      url,
      content_type,
      learning_stage,
      user_name,
      thumbnail,
      review,
      tags_array,

    } = req.body;

    const finalTags = tags_array[tags_array.length - 1];
    // console.log(tags_array[tags_array.length -1])
    console.log(finalTags);

    const postResource = await client.query(
      `INSERT INTO resources (resource_name, author_name, url, content_type, learning_stage, user_name, review, thumbnail) 
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [
        resource_name,
        author_name,
        url,
        content_type,
        learning_stage,
        user_name,
        review,
        thumbnail,
      ]
    );

    const response = (
      await client.query(`SELECT resource_id FROM resources WHERE url = $1`, [
        url,
      ])
    ).rows;
    const resourceId = response[0].resource_id;
    console.log("the resource id is:", resourceId);

    if (finalTags.length > 0) {
      for (let item of finalTags) {
        const postResourceTags = await client.query(
          `
        INSERT INTO tags (resource_id, tag) VALUES ($1,$2)`,
          [resourceId, item]
        );
      }

    }

    res.json("is this working?");
    const thumbnailCheck = () => {
      const imageLength = thumbnail.length > 0
      if (imageLength) {
        return (thumbnail)
      }
      else {
        return "https://assets.goodspeed.io/img/blog/10-best-places-to-see-the-northern-lights.4772723ac245f014.jpg"
      }
    } //sets default image of webhook thumbnail (northern lights)
    const embed = new EmbedBuilder()
      .setTitle(`${user_name} - has posted: ${resource_name}`)
      .setImage(thumbnailCheck())
      .setDescription(`${review} Follow this link here to check it out: https://c5c2-study-resources.netlify.app/study/${resourceId}`)
      .setColor(0x00FFFF);
    // const { resource_name, author_name, url, user_name, thumbnail, review, tags_array, content_type } = req.body
    console.log(embed)
    webhookClient.send({
      content: ``,
      username: 'Resources',
      avatarURL: 'https://i.pinimg.com/originals/18/b5/a4/18b5a451191bda28ebe4708c864ee464.jpg',
      embeds: [embed],
    });

  } catch (error) {
    console.error(error);
    res.json("you got an error buddy");
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
