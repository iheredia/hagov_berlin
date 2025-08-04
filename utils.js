const fs = require("fs");
const path = require("path");

function getJsonFilesInFolder(folderPath) {
  const files = fs.readdirSync(folderPath).filter((fileName) => fileName.endsWith(".json"));
  return files.map((filename) => {
    const filePath = path.join(folderPath, filename);
    const youtubeId = filename.replace(".es.json", "");
    return {
      youtubeId,
      segments: JSON.parse(fs.readFileSync(filePath)),
    };
  });
}

function searchInFolder(folderPath, searchTerm) {
  return getJsonFilesInFolder(folderPath)
    .map(({ youtubeId, segments }) => {
      return {
        youtubeId,
        segments: segments.filter((subtitlePart, index) => {
          return (
            searchTerm.test(subtitlePart.text) || searchTerm.test(subtitlePart[index + 1]?.text)
          );
        }),
      };
    })
    .filter((match) => match.segments.length > 0);
}

function timeToSeconds(rawTimeString) {
  const [timeString] = rawTimeString.split(",");
  const [hoursString, minutesString, secondsString] = timeString.split(":");
  const hours = parseInt(hoursString, 10);
  const minutes = parseInt(minutesString, 10);
  const seconds = parseInt(secondsString, 10);
  return seconds + minutes * 60 + hours * 60 * 60;
}

function secondsToTime(secondsNumber) {
  const cleanedSeconds = Math.max(0, secondsNumber);
  const hoursString = Math.floor(cleanedSeconds / 60 / 60)
    .toString()
    .padStart(2, "0");
  const minutesString = Math.floor((cleanedSeconds % (60 * 60)) / 60)
    .toString()
    .padStart(2, "0");
  const secondsString = Math.floor(cleanedSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${hoursString}:${minutesString}:${secondsString}`;
}

function parseTimeRange(startTime, endTime) {
  const secondsStartTime = timeToSeconds(startTime);
  const secondsEndTime = timeToSeconds(endTime);
  const finalStartTime = secondsToTime(secondsStartTime - 5);
  const finalEndTime = secondsToTime(secondsEndTime + 5);
  return `${finalStartTime}-${finalEndTime}`;
}

function search(searchTerm) {
  const hyfMatches = searchInFolder("subtitles_hyf_json", searchTerm);
  const haaMatches = searchInFolder("subtitles_haa_json", searchTerm);
  const videoMatches = [...hyfMatches, ...haaMatches];
  return videoMatches.flatMap((videoMatch) => {
    const { segments, youtubeId } = videoMatch;
    const preffix = hyfMatches.includes(videoMatch) ? "hyf" : "haa";

    return segments.map((segment, index) => {
      const timeRange = parseTimeRange(segment.startTime, segment.endTime);
      const outputFilePath = `./search/${preffix}_${youtubeId}_${index}`;
      if (fs.existsSync(outputFilePath)) {
        console.log(`Skipping ${outputFilePath}. Already exists`);
        return;
      }
      return {
        preffix,
        link: `https://www.youtube.com/watch?v=${videoMatch.youtubeId}&t=${timeToSeconds(
          segment.startTime
        )}`,
        youtubeId: videoMatch.youtubeId,
        segment,
        command: `yt-dlp --download-sections "*${timeRange}" 'https://www.youtube.com/watch?v=${youtubeId}' -o ${outputFilePath} -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best"`,
      };
    });
  });
}

function normalizeForCount(word) {
  return word.toLowerCase().replace(/[\.,!¡¿?_\[\] \\"]/g, "");
}

function countwords() {
  const subtitles = [
    ...getJsonFilesInFolder("subtitles_hyf_json"),
    ...getJsonFilesInFolder("subtitles_haa_json"),
  ];

  const count = subtitles.reduce((accum, subtitleFile) => {
    subtitleFile.segments
      .flatMap((segment) => segment.text.split(" "))
      .forEach((word) => {
        let normalizedWord = normalizeForCount(word);
        if (normalizedWord) {
          if (accum[normalizedWord]) {
            accum[normalizedWord] += 1;
          } else {
            accum[normalizedWord] = 1;
          }
        }
      });
    return accum;
  }, {});
  const countByAmount = Object.entries(count)
    .sort((a, b) => b[1] - a[1])
    .map((pair) => pair.join(" "));
  const countAlphabetic = Object.entries(count)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map((pair) => pair.join(" "));
  return { countByAmount, countAlphabetic };
}

module.exports = {
  search,
  searchInFolder,
  countwords,
};
