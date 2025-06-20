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
    // await client.connect();

    const usersCollection = client.db('earnZoneDB').collection('users')
    const reviewsCollection = client.db('earnZoneDB').collection('reviews')
    const tasksCollection = client.db('earnZoneDB').collection('tasks')


    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })


    // Buyer Task save API
    app.post('/buyer/tasks', async (req, res) => {
      try {
        const task = req.body;
        const result = await tasksCollection.insertOne(task);
        res.status(201).json(result);
      } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ message: "Failed to add task" });
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
          { $inc: { coin: coin } } // কয়েন যোগ করা
        );

        // আপডেট শেষে ইউজারের নতুন কয়েন দেখাতে চাইলে:
        const updatedUser = await usersCollection.findOne({ email });

        res.json({ message: "Coin added", updatedCoins: updatedUser.coin });
      } catch (error) {
        console.error("Error adding coin:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
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
        console.error("Error fetching coin:", error);
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
        console.error(error);
        res.status(500).json({ message: 'Server error' });
      }
    });



    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })


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
        console.error("Error fetching user:", error);
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



    // get tasks by user email
    app.get('/tasks/by-user/:email', async (req, res) => {
      try {
        const email = req.params.email.toLowerCase();
        const tasks = await tasksCollection.find({ email: email }).toArray();
        res.status(200).json(tasks);
      } catch (error) {
        console.error("Error fetching tasks by user:", error);
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
        console.error("Error updating task:", error);
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
        console.error("Error deleting task:", error);
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
        console.error("Error refunding coin:", error);
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
        console.error("Error deducting coin:", error);
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
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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