const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: 'http://localhost:5173',
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
    await client.connect();

    const usersCollection = client.db('earnZoneDB').collection('users')
    const reviewsCollection = client.db('earnZoneDB').collection('reviews')


    app.get('/reviews', async (req, res) => {
      const result = await reviewsCollection.find().toArray();
      res.send(result);
    })

    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result)
    })


    // get the user coin api
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email.toLowerCase();
      const user = await usersCollection.findOne({ email });
      if (!user) {
        return res.send({ email, coin: 0 });
      }

      res.send(user);

    })


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


    // Coin Update API
    // app.post('/update-coin', async (req, res) => {
    //   const { userId, amount } = req.body;

    //   if (!userId || typeof amount !== 'number') {
    //     return res.status(400).json({ success: false, message: 'Invalid data' });
    //   }

    //   try {
    //     const user = await User.findById(userId);
    //     if (!user) {
    //       return res.status(404).json({ success: false, message: 'User not found' });
    //     }

    //     user.coins += amount;

    //     // Coin কখনো negative হলে না রাখতে চাইলে:
    //     if (user.coins < 0) user.coins = 0;

    //     await user.save();
    //     res.json({ success: true, coins: user.coins });
    //   } catch (err) {
    //     res.status(500).json({ success: false, message: 'Server error' });
    //   }
    // });



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
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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