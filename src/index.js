console.clear();

const Discord = require("discord.js");
const bot = new Discord.Client();
const TOKEN = "NTQzODA4MzU4NDI4MTgwNDgx.D0CAKQ.xd7CrRUnnVz7RAPh2H2avC_-XQg";

let config = {
  prefix: "guruji" // COmmand Prefix
}

const ExecuteCommand = require("./commands/commands");

bot.on("message", message => {
  if (message.author.bot) return;
  if (message.content.toLowerCase().indexOf(config.prefix) !== 0) return;

  let args = message.content
    .slice(config.prefix.length)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase();
  args = args.join(" ");

  ExecuteCommand(command, args, message);
});

bot.login(TOKEN);