const test = require('node:test');
const assert = require('node:assert/strict');

const { createReviewStore } = require('../server.js');

test('createReviewStore keeps review data in memory when MongoDB is unavailable', async () => {
  const store = createReviewStore();

  const saved = await store.saveReview({
    rating: 5,
    title: 'Helpful app',
    description: 'Works well offline.',
    createdAt: new Date('2025-01-01T00:00:00.000Z')
  });

  assert.equal(saved.rating, 5);
  assert.equal(saved.title, 'Helpful app');
  assert.equal((await store.listReviews()).length, 1);
});
