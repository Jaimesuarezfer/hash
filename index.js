const express = require('express');
const sharp = require('sharp');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

async function downloadAndResize(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await response.buffer();
  const resized = await sharp(buffer)
    .resize(8, 8, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer();
  return resized;
}

function calculateDifference(buffer1, buffer2) {
  let diff = 0;
  for (let i = 0; i < buffer1.length; i++) {
    if (buffer1[i] !== buffer2[i]) diff++;
  }
  return diff;
}

app.post('/compare', async (req, res) => {
  const { url_1, url_2, tolerance = 5 } = req.body;

  if (!url_1 || !url_2) {
    return res.status(400).json({ error: 'Both url_1 and url_2 are required.' });
  }

  try {
    const img1 = await downloadAndResize(url_1);
    const img2 = await downloadAndResize(url_2);

    const diffPixels = calculateDifference(img1, img2);
    const totalPixels = img1.length;
    const percentDifference = (diffPixels / totalPixels) * 100;

    res.json({
      pixels_different: diffPixels,
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
