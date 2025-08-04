const fs = require("fs");
const { search, countwords } = require("./utils.js");

// Searching words

const searchTerm = /\bcuando era pibe\b/i;
const results = search(searchTerm);
const commands = results.map((result) => result.command).join("\n");
console.log(results);
fs.writeFileSync("./download-batch.zsh", commands);

// Counting words

const { countByAmount, countAlphabetic } = countwords();
fs.writeFileSync("./countByAmount.json", JSON.stringify(countByAmount, null, 2));
fs.writeFileSync("./countAlphabetic.json", JSON.stringify(countAlphabetic, null, 2));
