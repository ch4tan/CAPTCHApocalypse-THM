const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

const inputImage = './captcha.png';
const processedImage = 'processed.png';

async function preprocessImage() {
  await sharp(inputImage)
    .resize({ width: 1500 })     
    .grayscale()                 
    .threshold(150)              
    .normalize()                 
    .toFile(processedImage);
}

async function recognizeText() {
    const worker = await createWorker("eng");

    await worker.reinitialize('eng');
    await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    });

    const {
      data: { text },
    } = await worker.recognize(processedImage);

    const confusionMap = {
        '0': 'Q',
    };

    const corrected = text.split('').map(char => confusionMap[char] || char).join('');

    
    await worker.terminate();

    return corrected;
}

const resolveCaptcha = async () => {
    const corrected = (async () => {
        await preprocessImage();
        return await recognizeText();
    })();

    return corrected;
};

module.exports = resolveCaptcha;
