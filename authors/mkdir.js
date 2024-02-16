import fs from "fs";
import path from "path";

const authors = [];
const author19s = fs.readFileSync("./authors.19.json", { encoding: "utf-8" });
authors.push(...JSON.parse(author19s));
const author20s = fs.readFileSync("./authors.20.json", { encoding: "utf-8" });
authors.push(...JSON.parse(author20s));

const dataDir = "data";

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

authors.forEach((author) => {
  const authorDir = path.join(dataDir, author);
  if (!fs.existsSync(authorDir)) {
    fs.mkdirSync(authorDir);
  }
});
