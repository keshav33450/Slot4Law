import fs from "fs";
import path from "path";
import https from "https";

const jsonPath = "./src/lawyer_queres.json";

 // change if needed
const outputDir = "./public/lawyers";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

const download = (url, filePath) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        console.log("❌ Failed:", url);
        resolve(false);
        return;
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);

      file.on("finish", () => {
        file.close();
        console.log("✅ Downloaded:", filePath);
        resolve(true);
      });
    }).on("error", () => {
      console.log("❌ Error:", url);
      resolve(false);
    });
  });
};

const run = async () => {
  for (let i = 0; i < data.length; i++) {
    const lawyer = data[i];
    const url = lawyer.image_url;

    if (!url || !url.startsWith("http")) continue;

    const ext = path.extname(url.split("?")[0]) || ".jpg";
    const filename = `${i}${ext}`;
    const savePath = path.join(outputDir, filename);

    const ok = await download(url, savePath);

    if (ok) {
      lawyer.image_url = `/lawyers/${filename}`;
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2));
  console.log("\n🎉 Done! JSON updated.");
};

run();
