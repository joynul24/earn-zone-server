const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;


// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'https://earn-zone-client.web.app', 'https://earn-zone-client.firebaseapp.com'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.svgbh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const usersCollection = client.db('earnZoneDB').collection('users')
    const reviewsCollection = client.db('earnZoneDB').collection('reviews')
    const tasksCollection = client.db('earnZoneDB').collection('tasks')
    const submissionCollection = client.db('earnZoneDB').collection('submissions')
    const withdrawalsCollection = client.db('earnZoneDB').collection('withdrawals')

    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    // All users Delete API
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });


    // ALL users Role Update API
    app.patch('/users/:id', async (req, res) => {
      const id = req.params.id;
      const { role } = req.body;
      const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { role } }
      );
      res.send(result);
    });




    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })



    // Buyer Task save API
    app.post('/buyer/tasks', async (req, res) => {
      try {
        const task = req.body;
        const result = await tasksCollection.insertOne(task);
        res.status(201).json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to add task" });
      }
    });


    // All Task manage API for Admin
    app.get('/tasks/all', async (req, res) => {
      try {
        const allTasks = await tasksCollection.find().toArray();
        res.status(200).json(allTasks);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });





    // Add Coin API (কয়েন যোগ করা)
    app.patch('/users/add-coin/:email', async (req, res) => {
      const email = req.params.email;
      const { coin } = req.body;

      try {
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const result = await usersCollection.updateOne(
          { email },
          { $inc: { coin: coin } }
        );

        const updatedUser = await usersCollection.findOne({ email });

        res.json({ message: "Coin added", updatedCoins: updatedUser.coin });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });


    // worker task submission pawar api
    app.get('/submissions/by-worker/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const submissions = await submissionCollection.find({ worker_email: email }).toArray();
        res.status(200).json(submissions);
      } catch (error) {
        res.status(500).json({ message: 'Failed to fetch submissions' });
      }
    });




    // Coin Withdrols releted API

    app.get('/withdrawals/history/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const result = await withdrawalsCollection
          .find({ worker_email: email })
          .sort({ withdraw_date: -1 }) // latest first
          .toArray();

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch payment history." });
      }
    });


    app.get('/users/coin/:email', async (req, res) => {
      const email = req.params.email;
      const user = await usersCollection.findOne({ email });
      res.send({ coin: user?.coin || 0 });
    });


    app.post('/withdrawals', async (req, res) => {
      const data = req.body;
      const result = await withdrawalsCollection.insertOne(data);
      res.send(result);
    });




    // user Coin pawar API
    app.get("/users/coin/:email", async (req, res) => {
      const email = req.params.email;

      try {
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        res.json({ coin: user.coin || 0 });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });



    // dashboard a user role condition ar api
    app.get('/users/role/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const user = await usersCollection.findOne({ email });
        if (!user) {
          return res.status(404).json({ role: null });
        }
        res.json({ role: user.role || 'worker' });
      } catch (error) {
        res.status(500).json({ message: 'Server error' });
      }
    });


    // get the user coin api
    app.get('/users/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.send({
            email,
            coin: 0,
            role: 'worker',
            name: '',
            image: ''
          });
        }

        // Ensure all required fields are present
        res.send({
          email: user.email,
          coin: user.coin || 0,
          role: user.role || 'worker',
          name: user.name || '',
          image: user.image || ''
        });
      } catch (error) {
        res.status(500).send({ error: 'Internal Server Error' });
      }
    });



    app.post('/users', async (req, res) => {
      const user = req.body;
      const existingUser = await usersCollection.findOne({ email: user.email });

      if (existingUser) {
        return res.status(200).send({ message: "User already exists" });
      }

      const result = await usersCollection.insertOne({
        email: user.email,
        name: user.name,
        image: user.image,
        coin: user.coin || 0,
        role: user.role || "worker",
      });

      res.status(201).send(result);
    });


    // Task submission releted API
    app.post('/submissions/task', async (req, res) => {
      try {
        const submission = req.body;

        if (!submission.task_id || !submission.worker_email || !submission.submission_details) {
          return res.status(400).json({ message: 'Task ID, Worker Email, এবং Submission Details Needed' });
        }

        submission.status = submission.status || 'pending';
        submission.current_date = submission.current_date || new Date();

        const result = await submissionCollection.insertOne(submission);
        res.status(201).json({ message: 'Submission saved!', id: result.insertedId });
      } catch (err) {
        res.status(500).json({ message: 'Server error' });
      }
    })


    // Get single task by ID
    app.get('/tasks/details/:id', async (req, res) => {
      try {
        const taskId = req.params.id;
        const task = await tasksCollection.findOne({ _id: new ObjectId(taskId) });

        if (!task) {
          return res.status(404).json({ message: "Task not found" });
        }

        res.status(200).json(task);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });


    // get tasks by user email
    app.get('/tasks/by-user/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const tasks = await tasksCollection.find({ email: email }).toArray();
        res.status(200).json(tasks);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });



    // Get all available tasks (required_workers > 0)
    app.get('/tasks/available', async (req, res) => {
      try {
        const availableTasks = await tasksCollection
          .find({
            $expr: {
              $gt: [{ $toInt: "$required_workers" }, 0]
            }
          })
          .sort({ completion_date: 1 })
          .toArray();
        res.status(200).json(availableTasks);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });





    // Update Task by ID
    app.patch('/tasks/:id', async (req, res) => {
      try {
        const taskId = req.params.id;
        const updatedTask = req.body;

        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: updatedTask }
        );

        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });




    // Delete Task by ID
    app.delete('/tasks/:id', async (req, res) => {
      try {
        const taskId = req.params.id;
        const result = await tasksCollection.deleteOne({ _id: new ObjectId(taskId) });

        if (result.deletedCount === 1) {
          res.status(200).json({ message: 'Task deleted successfully' });
        } else {
          res.status(404).json({ message: 'Task not found' });
        }
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });



    // Coin increase API
    app.patch('/users/coin-increase/:email', async (req, res) => {
      const email = req.params.email;
      const { coin } = req.body;

      try {
        const result = await usersCollection.updateOne(
          { email },
          { $inc: { coin: coin } }
        );
        res.json({ message: "Coin refunded", result });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });





    // coin cut API
    app.patch('/users/deduct-coin/:email', async (req, res) => {
      const email = req.params.email;
      const { coin } = req.body;

      try {
        const user = await usersCollection.findOne({ email });

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        if (user.coin < coin) {
          return res.status(400).json({ message: "Insufficient coins" });
        }

        const result = await usersCollection.updateOne(
          { email },
          { $inc: { coin: -coin } }
        );

        res.json({ message: "Coin deducted", result });
      } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }
    });



    app.post('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = req.body;
      const isExist = await usersCollection.findOne(query);
      if (isExist) {
        return res.send(isExist)
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
    })


    // Send a ping to confirm a successful connection

  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





app.get('/', (req, res) => {
  res.send('Hello I am Earn Zone server')
});

app.listen(port, () => {
  console.log(`Server is running port: ${port}`);
})