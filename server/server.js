
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 5001;

function createReviewStore() {
  const reviews = [];

  return {
    async listReviews() {
      return [...reviews].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    },
    async saveReview(review) {
      const savedReview = {
        ...review,
        _id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        createdAt: review.createdAt || new Date(),
      };

      reviews.push(savedReview);
      return savedReview;
    },
  };
}

function createMongoReviewStore(collection) {
  return {
    async listReviews() {
      return collection.find({}).sort({ createdAt: -1 }).toArray();
    },
    async saveReview(review) {
      const result = await collection.insertOne(review);
      return {
        ...review,
        _id: result.insertedId.toString(),
      };
    },
  };
}

app.use(cors());
app.use(express.json());

// Health check: test whether the API is running
app.get("/", (req, res) => {
  res.send("Anonymous Review API is running!");
});

async function startServer() {
  let reviewStore = createReviewStore();

  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    const client = new MongoClient(mongoUri);

    try {
      await client.connect();

      const db = client.db("anonymous_reviews");
      const reviews = db.collection("reviews");
      reviewStore = createMongoReviewStore(reviews);

      console.log("Connected to MongoDB successfully!");
    } catch (error) {
      console.warn(
        "Could not connect to MongoDB. Falling back to in-memory storage.",
        error.message
      );
    }
  } else {
    console.warn(
      "Missing MONGODB_URI. Starting in-memory mode so the API can still run."
    );
  }

  // Get all reviews
  app.get("/api/reviews", async (req, res) => {
    try {
      const allReviews = await reviewStore.listReviews();
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

      const savedReview = await reviewStore.saveReview(newReview);

      res.status(201).json({
        message: "Review submitted successfully!",
        review: savedReview,
      });
    } catch (error) {
      console.error("Error saving review:", error);
      res.status(500).json({ message: "Could not save your review." });
    }
  });

  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  createReviewStore,
  startServer,
};