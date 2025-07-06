const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
// Firebase Admin SDK
const admin = require("firebase-admin");

const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString(
  "utf8"
);

const serviceAccount = JSON.parse(decoded);

// Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sltbrlg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const verifyFireBaseToken = async (req, res, next) => {
  const authHeader = req.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }

  const token = authHeader.split(" ")[1];

  // console.log("authHeader token",token);

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    req.decoded = decoded;

    next();
  } catch (error) {
    return res.status(401).send({ message: "Unauthorized Access" });
  }
};

const verifyEmailToken = (req, res, next) => {
  if (req.query.email !== req.decoded.email) {
    return res.status(403).send({ message: "Forbidden Access" });
  }
  next();
};

async function run() {
  try {
    //  await client.connect();

    const marathonCollection = client.db("marathonDB").collection("marathon");
    const usersCollection = client.db("marathonDB").collection("users");







app.get("/marathon", async (req, res) => {
  const { search, sort } = req.query;

  const query = {};

  if (search) {
    query.name = { $regex: search, $options: "i" }; // case-insensitive search by name
  }

  let sortOption = {};

  if (sort === "asc") {
    sortOption.StartRegistrationDate = 1; // ascending
  } else if (sort === "desc") {
    sortOption.StartRegistrationDate = -1; // descending
  } else {
    sortOption.createdAt = -1; // default: newest first
  }

  try {
    const marathons = await marathonCollection.find(query).sort(sortOption).toArray();
    res.json(marathons);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
});






    // app.get("/marathon", async (req, res) => {
    //   const { search, sort } = req.query;

    //   const query = {};

    //   if (search) {
    //     query.name = { $regex: search, $options: "i" }; // case-insensitive search
    //   }

    //   let sortOption = {};
    //   if (sort === "asc") {
    //     sortOption.StartRegistrationDate = 1;
    //   } else if (sort === "desc") {
    //     sortOption.StartRegistrationDate = -1;
    //   }

    //   try {
    //     const marathons = await marathonCollection.find(query).sort(sortOption);
    //     res.json(marathons);
    //   } catch (err) {
    //     res.status(500).json({ error: "Server Error" });
    //   }
    // });

    // app.get("/marathon", async (req, res) => {
    //   try {
    //     const marathons = await marathonCollection
    //       .find()
    //       .sort({ createdAt: 1 }) // or -1 for latest first
    //       .toArray();

    //     res.send(marathons);
    //   } catch (error) {
    //     res.status(500).send({ message: "Failed to fetch marathons", error });
    //   }
    // });

    // singleDetails section
    app.get("/marathon/:id", verifyFireBaseToken, async (req, res) => {
      const id = req.params.id;

      try {
        const objectId = new ObjectId(id);
        const marathon = await marathonCollection.findOne({ _id: objectId });

        if (!marathon) {
          return res.status(404).send({ message: "marathon not found" });
        }

        res.send(marathon);
      } catch (error) {
        // Invalid ObjectId format
        return res.status(400).send({ message: "Invalid ID format" });
      }
    });

    // Add marathon data on mongodb database
    app.post("/marathon", async (req, res) => {
      const newMarathon = req.body;

      //   date convert
      newMarathon.StartRegistrationDate = new Date(
        newMarathon.StartRegistrationDate
      );
      newMarathon.EndRegistrationDate = new Date(
        newMarathon.EndRegistrationDate
      );
      newMarathon.MarathonStartDate = new Date(newMarathon.MarathonStartDate);
      newMarathon.createdAt = new Date(newMarathon.createdAt);
      //   console.log(newMarathon);

      const result = await marathonCollection.insertOne(newMarathon);
      //   res.send(result);
      res.status(201).send({ ...result, message: "Data pai ce" });
      //   console.log(newMarathon);
    });

    // Deleted section
    app.delete("/marathon/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = marathonCollection.deleteOne(query);
      res.send(result);
    });

    // Update Marathon
    app.put("/marathon/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateMarathon = req.body;

      //   date convert
      updateMarathon.StartRegistrationDate = new Date(
        updateMarathon.StartRegistrationDate
      );
      updateMarathon.EndRegistrationDate = new Date(
        updateMarathon.EndRegistrationDate
      );
      updateMarathon.MarathonStartDate = new Date(
        updateMarathon.MarathonStartDate
      );
      updateMarathon.createdAt = new Date(updateMarathon.createdAt);

      const updateDoc = {
        $set: updateMarathon,
      };
      const result = await marathonCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    // New Marathon Sort section
    app.get("/new-marathon", async (req, res) => {
      const result = await marathonCollection
        .find({})
        .sort({ _id: -1 })
        .limit(8)
        .toArray();
      res.send(result);
    });

    //! User section

    //? display data
    app.get(
      "/users",
      verifyFireBaseToken,
      verifyEmailToken,
      async (req, res) => {
        const searchParams = req.query.searchParams;
        const email = req.query.email;

        // console.log("Query Email:", email);
        // console.log(email);
        // const userEmail = req.decoded.email;
        let query = {};

        // Filter by email if provided
        if (email) {
          query.email = email;
        }

        // Filter by name if search param provided
        if (searchParams) {
          query.displayName = { $regex: searchParams, $options: "i" };
        }

        const result = await usersCollection.find(query).toArray();
        res.send(result);
      }
    );

    // Add registration data on mongodb database
    app.post("/users", async (req, res) => {
      const newUsers = req.body;
      const result = await usersCollection.insertOne(newUsers);
      res.status(201).send({ ...result, message: "Data pai ce" });
      // console.log(result);
    });

    // Update users
    app.put("/users/:id", async (req, res) => {
      //  console.log("PUT /users/:id hit"); // ✅ Check if this logs
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateUsers = req.body;

      updateUsers.MarathonStartDate = new Date(updateUsers.MarathonStartDate);

      const updateDoc = {
        $set: updateUsers,
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
      //   console.log(result);
    });

    // Deleted section
    app.delete("/users/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = usersCollection.deleteOne(query);
      res.send(result);
    });

    // await client.db("admin").command({ ping: -1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("simply World's Marathons Server running");
});

app.listen(port, () => {
  console.log(`Simply World's Marathons server running on ${port}`);
});
