require("dotenv").config();
const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_ADMIN}:${process.env.DB_PASS}@cluster0.glnanjr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send("Job Portal server is running");
});

async function run() {
  try {
    await client.connect();
    const jobCollections = client.db("Jobs-Collection").collection("jobs");
    const applicationCollections = client
      .db("Jobs-Collection")
      .collection("application");
    // all jobs
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      const query = {};
      if (email) {
        query.hr_email = email;
      }
      const cursor = jobCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    // specific jobs
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollections.findOne(query);
      res.send(result);
    });
    // add jobs in db
    app.post("/jobs", async (req, res) => {
      const newJobs = req.body;
      const result = await jobCollections.insertOne(newJobs);
      res.send(result);
    });

    // application related api
    app.get("/applications", async (req, res) => {
      const email = req.query.email;
      const query = {
        applicant: email,
      };
      const result = await applicationCollections.find(query).toArray();

      // bad way
      for (const application of result) {
        const id = application.jobId;
        const jobQuery = { _id: new ObjectId(id) };
        const job = await jobCollections.findOne(jobQuery);
        application.company = job.company;
        application.title = job.title;
        application.company_logo = job.company_logo;
      }
      res.send(result);
    });
    app.post("/applications", async (req, res) => {
      const application = req.body;
      const result = await applicationCollections.insertOne(application);
      res.send(result);
    });
    app.get("/applications/job/:id", async (req, res) => {
      const newId = req.params.id;
      const query = {
        jobId: newId,
      };
      const result = await applicationCollections.find(query).toArray();
      res.send(result);
    });
    app.patch("/applications/:id", async (req, res) => {
      const id = req.params.id;
      const updated = req.body;
      const filter = {
        _id: new ObjectId(req.params.id),
      };
      const updatedDoc = {
        $set: {
          status: req.body.status,
        },
      };

      const result = await applicationCollections.updateOne(filter, updatedDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Job portal app  listening on port ${port}`);
});
