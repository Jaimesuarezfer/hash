const express = require('express');
const fetch = require('node-fetch');
const { imageHash } = require('image-hash');

const app = express();
app.use(express.json());

function hammingDistance(a, b) {
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) dist++;
  }
  return dist;
}

// Promisify manualmente imageHash
function getImageHash(buffer) {
  return new Promise((resolve, reject) => {
    imageHash(buffer, 16, true, (error, data) => {
      if (error) reject(error);
      else resolve(data);
    });
  });
}

app.post('/compare', async (req, res) => {
  const { url_1, url_2, tolerance = 5 } = req.body;

  try {
    const response1 = await fetch(url_1);
    const response2 = await fetch(url_2);

    if (!response1.ok || !response2.ok) {
      throw new Error('Failed to fetch one or both images.');
    }

    const buffer1 = await response1.buffer();
    const buffer2 = await response2.buffer();

    const hash1 = await getImageHash(buffer1);
    const hash2 = await getImageHash(buffer2);

    const distance = hammingDistance(hash1, hash2);
    const percentDifference = (distance / 64) * 100;

    res.json({
      hash1,
      hash2,
      bits_different: distance,
      percent_difference: percentDifference.toFixed(2),
      changed: percentDifference >= tolerance,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
