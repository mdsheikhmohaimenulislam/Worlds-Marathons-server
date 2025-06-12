const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

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

async function run() {
  try {
    //  await client.connect();

    const marathonCollection = client.db("marathonDB").collection("marathon");
    const usersCollection = client.db("marathonDB").collection("users");

    // marathon call
    app.get("/marathon", async (req, res) => {
      const marathons = await marathonCollection.find().toArray();
      res.send(marathons);
    });

    // singleDetails section
    app.get("/marathon/:id", async (req, res) => {
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
      updateMarathon.MarathonStartDate = new Date(updateMarathon.MarathonStartDate);

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



    //? User section

        // New Marathon Sort section
    app.get("/new-marathon", async (req, res) => {
      const result = await marathonCollection
        .find({})
        .sort({ _id: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // display data
    app.get("/users", async (req, res) => {
      const email = req.query.email;

      // email data find
      const query = email ? { email } : {};

      const result = await usersCollection.find(query).toArray();
      res.send(result);
    });

    // Add registration data on mongodb database
    app.post("/users", async (req, res) => {
      const newUsers = req.body;
      const result = await usersCollection.insertOne(newUsers);
      res.status(201).send({ ...result, message: "Data pai ce" });
      console.log(result);
    });



        // Update users
    app.put("/users/:id", async (req, res) => {
        //  console.log("PUT /users/:id hit"); // ✅ Check if this logs
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updateUsers = req.body;

        //   date convert
    //   updateMarathon.StartRegistrationDate = new Date(
    //     updateMarathon.StartRegistrationDate
    //   );
    //   updateMarathon.EndRegistrationDate = new Date(
    //     updateMarathon.EndRegistrationDate
    //   );
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



    await client.db("admin").command({ ping: -1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
