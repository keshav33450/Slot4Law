import fs from "fs";
import path from "path";
import https from "https";

const jsonPath = "./src/lawyers.json";
const outputDir = "./public/lawyers";
const placeholder = "/lawyers/placeholder.jpg";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// create placeholder image if missing
const placeholderPath = path.join(outputDir, "placeholder.jpg");
if (!fs.existsSync(placeholderPath)) {
  fs.writeFileSync(placeholderPath, "");
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

const download = (url, filePath) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        resolve(false);
        return;
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close();
        resolve(true);
      });
    }).on("error", () => resolve(false));
  });
};

const run = async () => {
  for (let i = 0; i < data.length; i++) {
    const lawyer = data[i];
    const url = lawyer.image_url;

    const filename = `${i}.jpg`;
    const savePath = path.join(outputDir, filename);

    let ok = false;

    if (url && url.startsWith("http")) {
      ok = await download(url, savePath);
    }

    lawyer.image_url = ok ? `/lawyers/${filename}` : placeholder;
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log("🎉 JSON updated with safe local paths.");
};

run();
