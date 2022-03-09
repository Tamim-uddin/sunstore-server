const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ww2yo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        
        const database = client.db('sunstore');
        const bookingsCollection = database.collection('bookings');
        const productsCollection = database.collection('products');
        const reviewsCollection = database.collection('reviews');
        const usersCollection = database.collection('users');


        // collect a product
        app.post('/products', async(req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product);
            console.log(result);
            res.json(result);
        })


        // send all products
        app.get('/products', async(req, res) => {
            const cursor = productsCollection.find({});
            const products = await cursor.toArray();
            res.json(products);
        })

        // collect all bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking);
            console.log(result);
            res.json(result);
        })

        // send all bookings
        app.get('/bookings/admin', async(req, res) => {
            const cursor = bookingsCollection.find({});
            const bookings = await cursor.toArray();
            res.json(bookings);
        })

          // send specific booking for payment
        app.get('/bookings/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await bookingsCollection.findOne(query);
            res.json(result);
        })

        // update a booking for complete the payment 
        app.put('/bookings/:id', async(req, res) => {
            const id = req.params.id;
            const payment = req.body;
            const filter = {_id: ObjectId(id)};
            const updateDoc ={ 
                $set: {
                    payment: payment
                }
            };
            const result = await bookingsCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // send all bookings via email
        app.get('/bookings', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const cursor = bookingsCollection.find(query);
            const bookings = await cursor.toArray();
            res.json(bookings);
        })


        // collect all reviews
        app.post('/reviews', async(req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            console.log(result);
            res.json(result);
        })

        // send all reviews
        app.get('/reviews', async(req, res) => {
            const cursor = reviewsCollection.find({});
            const reviews = await cursor.toArray();
            res.json(reviews);
        })

        // delete booking
        app.delete('/bookings/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await bookingsCollection.deleteOne(query);
            console.log(result);
            res.json(result);
        });

        // save user via register
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log(result);
            res.json(result);
        });

        // save user via google
        app.put('/users', async(req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = {$set: user};
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        });

        // make admin
       app.put('/users/admin', async(req, res) => {
           const user = req.body;
           const filter = { email: user.email };
           const updateDoc = {$set: {role: 'admin'}};
           const result = await usersCollection.updateOne(filter, updateDoc);
           res.json(result);
       });

    //    secure admin
    app.get('/users/:email', async(req, res) => {
        const email = req.params.email;
        const query = {email: email};
        const user = await usersCollection.findOne(query);
        let isAdmin = false;
        if(user?.role === 'admin'){
            isAdmin = true;
        }
        res.json({admin: isAdmin})
    })

    // payment
    app.post('/create-payment-intent', async(req, res) => {
        const paymentInfo = req.body;
        const amount = paymentInfo.price * 100;
        const paymentIntent = await stripe.paymentIntents.create({
            currency: 'usd',
            amount: amount,
            payment_method_types: ['card']
        });
        res.json({clientSecret: paymentIntent.client_secret})
    })





    }
    finally {
        // await client.close()
    }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello Sunstore!')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})