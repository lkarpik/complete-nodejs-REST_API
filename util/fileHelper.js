const path = require('path');
const fs = require('fs');

const clearImage = filePath => {
    const imgPath = path.join(__dirname, '..', filePath);
    fs.unlink(imgPath, err => console.log(err));
}

module.exports = clearImage;