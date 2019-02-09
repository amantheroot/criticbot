const Discord = require("discord.js");
const getGameData = require("./game");

const getGame = (args, message) => {
  let platform = args.split(" ")[0];
  let game = args.split(" ").slice(1).join(" ");

  getGameData(platform, game).then(gameData => {
    if (gameData.err) {
      message.channel.send(gameData.err);
    } else {
      let {name, imgurl, summary, releaseDate, platforms, genres, rating, developer, metaScore, userScore, mostPosCriticReview, mostNegCriticReview, mostPosUserReview, mostNegUserReview, price, purchaseLink, worthIt} = gameData;
      
      let poster = new Discord.Attachment(imgurl);
      let basic = `
__***Name:***__ *${name}*
__***Summary:***__ *${summary}*
      `;
      let details =`
__***Release Date:***__ *${releaseDate}*
__***Platforms:***__ *${platforms.join(", ")}*\n
__***Genre(s):***__ *${genres.join(", ")}*
__***Rating:***__ *${rating}*
__***Developer:***__ *${developer}*\n
__***Meta Score:***__ *${metaScore}*
__***User Score:***__ *${userScore}*
      `;
      let criticReviews = `
__***Most Positive Critic Score:***__  *${mostPosCriticReview.score}*
__***Most Positive Critic Review:***__  *${mostPosCriticReview.review}*\n
__***Most Negative Critic Score:***__  *${mostNegCriticReview.score}*
__***Most Negative Critic Review:***__  *${mostNegCriticReview.review}*
      `;
      let userReviews = `
__***Most Positive User Score:***__  *${mostPosUserReview.score}*
__***Most Positive User Review:***__  *${mostPosUserReview.review}*\n
__***Most Negative User Score:***__  *${mostNegUserReview.score}*
__***Most Negative User Review:***__  *${mostNegUserReview.review}*
      `;
      let purchase = `
__***Price:***__ *${price}*
__***Purchase Link:***__ *${purchaseLink}*
      `;
      let opinion = `
__***Guruji's Opinion:***__ *${worthIt ? `Get It!` : `Don't Get It!`}*
      `;

      message.channel.send(poster);
      message.channel.send(basic);
      message.channel.send(details);
      message.channel.send(criticReviews);
      message.channel.send(userReviews);
      message.channel.send(purchase);
      message.channel.send(opinion);
    }
  });
}

module.exports = getGame;