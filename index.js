const express = require("express");
const cors = require("cors");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return response.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.7n2eiiw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // auth related apis
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: false,
        })
        .send({ success: true });
    });

    // food related apis
    const foodsCollection = client.db("feastlyDB").collection("foods");

    app.get("/foods", async (req, res) => {
      const cursor = foodsCollection.find({});
      const results = await cursor.toArray();
      res.send(results);
    });

    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const result = await foodsCollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/myFoods", verifyToken, async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (req.user.email !== req.query.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      if (email) {
        query = { "addedBy.email": email };
      }
      const results = await foodsCollection.find(query).toArray();
      res.send(results);
    });

    app.post("/foods", async (req, res) => {
      const newFood = req.body;
      console.log(newFood);
      const result = await foodsCollection.insertOne(newFood);
      res.send(result);
    });

    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const doc = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: doc,
      };
      const result = await foodsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsCollection.deleteOne(query);
      res.send(result);
    });

    app.get("/foods", async (req, res) => {
      const { category, minPrice, maxPrice } = req.query;
      const query = {};
      if (category) {
        query.category = category;
      }
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) {
          query.price.$gte = parseFloat(minPrice);
        }
        if (maxPrice) {
          query.price.$lte = parseFloat(maxPrice);
        }
      }
      try {
        const foods = await foodsCollection.find(query).toArray();
        res.json(foods);
      } catch (err) {
        console.error("Error fetching foods:", err);
        res.status(500).json({ error: "Server error" });
      }
    });

    // purchase related apis

    const purchaseCollection = client.db("purchaseDB").collection("purchase");

    // app.get("/purchase", async (req, res) => {
    //   const cursor = purchaseCollection.find({});
    //   const result = await cursor.toArray();
    //   res.send(result);
    // });

    app.get("/purchase", async (req, res) => {
      const email = req.query.email;
      let query = {};
      console.log(req.cookies);
      if (email) {
        query = { buyerEmail: email };
      }
      const result = await purchaseCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/purchase", async (req, res) => {
      const newPurchase = req.body;
      console.log(newPurchase);
      const result = await purchaseCollection.insertOne(newPurchase);
      res.send(result);
    });

    app.delete("/purchase/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("food is falling from the sky");
});

app.listen(port, () => {
  console.log(`food is waiting at ${port}`);
});

// XgFtnSZXq0o78fmk
