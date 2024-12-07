require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.dmsil.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    // Add VIsa
    const database = client.db("VisaDB");
    const visaCollection = database.collection("visa");
    console.log(visaCollection);

    // Visa User
    const visaUserCollection = database.collection("visa User");

    // Add Visa Server
    app.post("/visa", async (req, res) => {
      const visa = req.body;

      const result = await visaCollection.insertOne(visa);
      res.send(result);
    });

    app.get("/visa", async (req, res) => {
      const cursor = visaCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/visa/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-added-visas", async (req, res) => {
      const email = req.query.email;
      const filteredData = await visaCollection.find({ email }).toArray();
      res.send(filteredData);
    });

    app.delete("/visa/:id", async (req, res) => {
      const id = req.params.id;
      console.log("please delete my data", id);
      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.deleteOne(query);
      res.send(result);
    });

    // Visa User Server
    app.post("/visa_user", async (req, res) => {
      const visaUser = req.body;
      console.log(visaUser);
      const result = await visaUserCollection.insertOne(visaUser);
      res.send(result);
    });

    app.get("/visa_user", async (req, res) => {
      const cursor = visaUserCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
