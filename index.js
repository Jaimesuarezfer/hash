const express = require('express');
const imghash = require('imghash');

const app = express();
app.use(express.json());

function hammingDistance(hash1, hash2) {
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

app.post('/compare', async (req, res) => {
  const { url_1, url_2, tolerance = 5 } = req.body;

  if (!url_1 || !url_2) {
    return res.status(400).json({ error: 'Both url_1 and url_2 are required.' });
  }

  try {
    const hash1 = await imghash.hash(url_1, 16); // 16x16
    const hash2 = await imghash.hash(url_2, 16);

    const distance = hammingDistance(hash1, hash2);
    const percentDifference = (distance / 64) * 100;

    res.json({
      hash1,
      hash2,
      bits_different: distance,
      percent_difference: percentDifference.toFixed(2),
      changed: percentDifference >= tolerance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
