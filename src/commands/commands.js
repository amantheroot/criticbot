const getGame = require("./game/critic");

const ExecuteCommand = (command, args, message) => {
  switch (command) {
    case "ping":
      message.channel.send("pong!");
      break;
    case "game":
      getGame(args, message);
      break;
    default:
      return;
  }
};

module.exports = ExecuteCommand;