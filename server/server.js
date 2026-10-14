
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Check that server/.env exists.");
  process.exit(1);
}

const client = new MongoClient(process.env.MONGODB_URI);

app.use(cors());
app.use(express.json());

// Health check: test whether the API is running
app.get("/", (req, res) => {
  res.send("Anonymous Review API is running!");
});

// Connect to MongoDB and start the server
async function startServer() {
  try {
    await client.connect();

    const db = client.db("anonymous_reviews");
    const reviews = db.collection("reviews");

    console.log("Connected to MongoDB successfully!");

    // Get all reviews
    app.get("/api/reviews", async (req, res) => {
      try {
        const allReviews = await reviews
          .find({})
          .sort({ createdAt: -1 })
          .toArray();

        res.json(allReviews);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({ message: "Could not fetch reviews." });
      }
    });

    // Submit a new anonymous review
    app.post("/api/reviews", async (req, res) => {
      try {
        const rating = req.body.rating;
        const title =
          typeof req.body.title === "string" ? req.body.title.trim() : "";
        const description =
          typeof req.body.description === "string"
            ? req.body.description.trim()
            : "";

        if (
          !Number.isInteger(rating) ||
          rating < 1 ||
          rating > 5 ||
          !title ||
          title.length > 100 ||
          !description ||
          description.length > 2000
        ) {
          return res.status(400).json({
            message:
              "Enter a rating from 1 to 5, a title up to 100 characters, and a review up to 2000 characters.",
          });
        }

        const newReview = {
          rating,
          title,
          description,
          createdAt: new Date(),
        };

        const result = await reviews.insertOne(newReview);

        res.status(201).json({
          message: "Review submitted successfully!",
          review: {
            ...newReview,
            _id: result.insertedId.toString(),
          },
        });
      } catch (error) {
        console.error("Error saving review:", error);
        res.status(500).json({ message: "Could not save your review." });
      }
    });

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    console.error(
      "Check your MONGODB_URI in server/.env and your Atlas network access settings."
    );
    process.exit(1);
  }
}

startServer();