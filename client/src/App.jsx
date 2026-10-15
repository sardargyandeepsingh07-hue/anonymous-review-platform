import { useState } from "react";
import "./App.css";

function App() {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (rating === 0) {
      setMessage("Please select a star rating.");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setMessage("Please complete all fields.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("https://anonymous-review-platform.onrender.com/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          title: title.trim(),
          description: description.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not submit your review.");
      }

      setMessage("Your review was submitted successfully!");
      setRating(0);
      setTitle("");
      setDescription("");
    } catch (error) {
      console.error("Review submission failed:", error);
      setMessage(
        error.message || "Could not connect to the server. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page">
      <section className="review-card">
        <div className="brand">REVIEW SPACE</div>

        <h1>Share your experience</h1>

        <p className="subtitle">
          Your voice matters. Your identity stays private.
        </p>

        <form onSubmit={handleSubmit}>
          <label className="field-label">Your rating</label>

          <div className="stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={star <= rating ? "star active" : "star"}
                onClick={() => setRating(star)}
                aria-label={`${star} star rating`}
              >
                ★
              </button>
            ))}
          </div>

          <p className="rating-hint">
            {rating === 0
              ? "Choose from 1 to 5 stars"
              : `You selected ${rating} out of 5 stars`}
          </p>

          <label className="field-label" htmlFor="title">
            Review title
          </label>

          <input
            id="title"
            type="text"
            placeholder="Summarize your experience"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={100}
            required
          />

          <label className="field-label" htmlFor="description">
            Your review
          </label>

          <textarea
            id="description"
            placeholder="Tell us what you think..."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={5}
            required
          />

          <p className="privacy-note">
            🔒 No name or email is requested.
          </p>

          <button
            className="submit-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit review →"}
          </button>

          {message && (
            <p className="message" role="status">
              {message}
            </p>
          )}
        </form>
      </section>
    </main>
  );
}

export default App;