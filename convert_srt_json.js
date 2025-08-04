const fs = require("fs");
const path = require("path");

function getSubtitleList(folderPath) {
  const files = fs.readdirSync(folderPath);
  return files.filter((fileName) => fileName.endsWith(".srt"));
}

function convertSrtToObj(filePath) {
  const fileString = fs.readFileSync(filePath).toString();
  const data = fileString.split("\n").filter((line) => line);
  const obj = [];
  for (let n = 0; n < data.length; n += 3) {
    const [startTime, endTime] = data[n + 1].split(" --> ");
    const text = data[n + 2];
    obj.push({ text, startTime, endTime });
  }
  return obj;
}

function convertAllSrtFilesToJson(folderPath) {
  const files = getSubtitleList(folderPath);
  files.forEach((filename) => {
    const filePath = path.join(folderPath, filename);
    const obj = convertSrtToObj(filePath);
    const jsonString = JSON.stringify(obj, null, 2);
    const jsonFilePath = path.join(
      folderPath.replace("raw", "json"),
      filename.replace(".srt", ".json")
    );
    fs.writeFileSync(jsonFilePath, jsonString);
  });
}

convertAllSrtFilesToJson("./subtitles_haa_raw");
convertAllSrtFilesToJson("./subtitles_hyf_raw");
