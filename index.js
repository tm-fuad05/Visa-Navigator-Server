require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const logger = (req, res, next) => {
  console.log("inside the logger");
  next();
};

const verifyToken = (req, res, next) => {
  console.log("Inside the verifyToken");
  const token = req?.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SEC, function (err, decoded) {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

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

    // Auth Related APIs
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SEC, {
        expiresIn: "1h",
      });

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // Add VIsa
    const database = client.db("VisaDB");
    const visaCollection = database.collection("visa");

    // Visa Apply
    const appliedVisaCollection = database.collection("Applied Visas");

    // Add Visa Server
    app.post("/visa", async (req, res) => {
      const visa = req.body;

      const result = await visaCollection.insertOne(visa);
      res.send(result);
    });

    app.get("/visa", logger, async (req, res) => {
      const filter = req.query.filter;
      let query = {};
      if (filter) query.visaType = filter;
      const cursor = visaCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/visa/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.findOne(query);
      res.send(result);
    });

    app.get("/my-added-visas", verifyToken, async (req, res) => {
      const email = req.query.email;

      // Jwt Authorization
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const filteredData = await visaCollection.find({ email }).toArray();
      console.log("Cookies:", req.cookies);
      res.send(filteredData);
    });

    // Get Latest 6 Data
    app.get("/latest-added-visas", async (req, res) => {
      const result = await visaCollection
        .find()
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    app.put("/visa/:id", async (req, res) => {
      const id = req.params.id;
      const visaInfo = req.body;

      const filter = { _id: new ObjectId(id) };
      const options = { upser: true };
      const upadtedVisaInfo = {
        $set: {
          image: visaInfo.image,
          countryName: visaInfo.countryName,
          visaType: visaInfo.visaType,
          processingTime: visaInfo.processingTime,
          requiredDocuments: visaInfo.requiredDocuments,
          description: visaInfo.description,
          ageRestriction: visaInfo.ageRestriction,
          fee: visaInfo.fee,
          validity: visaInfo.validity,
          applicationMethod: visaInfo.applicationMethod,
        },
      };
      const result = await visaCollection.updateOne(
        filter,
        upadtedVisaInfo,
        options
      );
      res.send(result);
    });

    app.delete("/visa/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await visaCollection.deleteOne(query);
      res.send(result);
    });

    // Visa Apply Server
    app.post("/applied-visas", async (req, res) => {
      const appliedVisa = req.body;

      const result = await appliedVisaCollection.insertOne(appliedVisa);
      res.send(result);
    });

    app.get("/applied-visas", verifyToken, async (req, res) => {
      const email = req.query.email;
      const search = req.query.search;

      let query = {
        countryName: {
          $regex: search,
          $options: "i",
        },
        email,
      };

      // Jwt Authorization
      if (req.user.email !== email) {
        return res.status(403).send({ message: "Forbidden access" });
      }

      const cursor = appliedVisaCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    app.delete("/applied-visas/:id", async (req, res) => {
      const id = req.params.id;

      const query = { _id: new ObjectId(id) };
      const result = await appliedVisaCollection.deleteOne(query);
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
