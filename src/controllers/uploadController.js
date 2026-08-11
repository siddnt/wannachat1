const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

if (process.env.CLOUDINARY_URL) {
    cloudinary.config(process.env.CLOUDINARY_URL);
}

const uploadImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'wannachat' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ error: 'Upload to Cloudinary failed' });
        }
        res.json({ imageUrl: result.secure_url });
      }
    );

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);
    bufferStream.pipe(uploadStream);

  } catch (error) {
    console.error('Error in uploadImage:', error);
    res.status(500).json({ error: 'Failed to process upload' });
  }
};

module.exports = {
  uploadImage
};
