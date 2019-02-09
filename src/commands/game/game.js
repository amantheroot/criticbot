const rp = require("request-promise");
const cheerio = require("cheerio");

const nameFormat = (name) => name.toLowerCase().split(" ").join("-");

const metaCriticData = (url) => {
  return rp(url).then(html => {
    const $ = cheerio.load(html);
    
    let name = $(".product_title > a > h1").text();
    let imgurl = $("img.product_image").attr("src");
    let summary = $(".product_summary span.data").text();

    let releaseDate = $("ul.summary_details li.release_data span.data").text();
    let platforms = $("ul.summary_details li.product_platforms span.data").text().replace(/\n/g, '').split(",").map(pf => pf.trim());

    let details = $("#main > .product_details table tbody tr th").text().split(":").slice(0,-1);

    let genresIndex = details.indexOf("Genre(s)");
    let ratingIndex = details.indexOf("Rating");
    let developerIndex = details.indexOf("Developer");

    let genres = $(`#main > .product_details table tbody tr:nth-child(${genresIndex+1}) td`).text().replace(/\n/g, '').split(",").map(gen => gen.trim());
    let rating = $(`#main > .product_details table tbody tr:nth-child(${ratingIndex+1}) td`).text();
    let developer = $(`#main > .product_details table tbody tr:nth-child(${developerIndex+1}) td`).text();

    let metaScore = Number($(".metascore_wrap .metascore_w > span").text());
    let userScore = Number($(".userscore_wrap .metascore_w").text());

    return { name, imgurl, summary, releaseDate, platforms, genres, rating, developer, metaScore, userScore };
  })
}

const metaCriticReviews = (url) => {
  return rp(url).then(html => {
    const $ = cheerio.load(html);

    let reviewPath = (person, number) => {
      let basePath = `.${person}_reviews_module .body .${person}_reviews .${number}_review`;
      return [
        `${basePath} .review_body`, `${basePath} .review_stats .review_grade .metascore_w`
      ];
    }

    let checkReview = (person, number) => {
      let path = reviewPath(person, number)[0];

      if ($(`${path} span.inline_expand_collapse`).length) {
        path = `${path} span.inline_expand_collapse span.blurb_expanded`;
      }
      return $(path).text().replace(/\n/g, '').trim();
    }

    let mostPosCriticReview = { review: checkReview("critic", "first"), score: Number($(reviewPath("critic", "first")[1]).text())};
    let mostNegCriticReview = { review: checkReview("critic", "last"), score: Number($(reviewPath("critic", "last")[1]).text())};
    let mostPosUserReview = { review: checkReview("user", "first"), score: Number($(reviewPath("user", "first")[1]).text())};
    let mostNegUserReview = { review: checkReview("user", "last"), score: Number($(reviewPath("user", "last")[1]).text())};

    return { mostPosCriticReview, mostNegCriticReview, mostPosUserReview, mostNegUserReview };
  })
}

const steamPrice = (game) => {
  let steamGameName = game.split("-").join("%20");
  let url = `https://store.steampowered.com/search/?term=${steamGameName}`;

  return rp(url).then(html => {
    const $ = cheerio.load(html);

    let aTags = $(".page_content_ctn .page_content #search_results #search_result_container a");

    let titles = [];
    aTags.each((id,atag) => {
      titles.push($(atag).find(".responsive_search_name_combined .search_name span.title").text());
    });
    let gameIndex = titles.map(title => nameFormat(title)).indexOf(game);
    
    let price = "";
    let purchaseLink = "";

    aTags.each((id,atag) => {
      if (id === gameIndex) {
        let priceTag = $(atag).find(".responsive_search_name_combined .search_price_discount_combined .search_price");
        if (priceTag.length) {
          price = priceTag.clone().children().remove().end().text().trim();
        } else {
          price = priceTag.text().trim();
        }

        purchaseLink = $(atag).attr('href');
      }
    });

    return { price, purchaseLink };
  })
}

const criticise = gameData => {
  let scoreThreshold = 0.65;
  let maxPrice = 6000;

  let cScore = gameData.metaScore / 10;
  let uScore = gameData.userScore;
  let score = (cScore + uScore) / 20;

  if (gameData.price !== "") {
    let cost;
    if(gameData.price.includes("Free")) {
      cost = 0;
    } else {
      cost = Number(gameData.price.split(" ").pop().split(",").join(""));
    }
    score *= (1 - (cost/maxPrice));
  }
  if (score >= scoreThreshold) {
    return true;
  } else {
    return false;
  }
}

const getGameData = (platformName, gameName) => {
  let platform = nameFormat(platformName);
  switch (platform) {
    case "ps4":
      platform = nameFormat("PlayStation 4");
      break;
    case "ps3":
      platform = nameFormat("PlayStation 3");
      break;
    default:
      break;
  }
  let game = nameFormat(gameName);

  let platformList = ["PC", "PlayStation 4", "PlayStation 3", "Xbox One", "Xbox 360", "Switch", "Wii U", "3DS", "PlayStation Vita","IOS"];
  let platformListFormatted = platformList.map(pf => nameFormat(pf));
  if (!platformListFormatted.includes(platform)) {
    return new Promise((resolve) => {resolve({err: "Platform Not Found!"})});
  } 

  let baseUrl = `https://www.metacritic.com/game/${platform}/${game}`;
  let detailsUrl = `${baseUrl}/details`;

  return metaCriticData(detailsUrl).then(data => {
    return metaCriticReviews(baseUrl).then(reviews => {
      return steamPrice(game).then(price => {
        let gameData = {...data, ...reviews, ...price };

        gameData = {...gameData, platforms: [...data.platforms, platformList[platformListFormatted.indexOf(platform)]]};

        gameData.worthIt = criticise(gameData);

        return gameData;
      }).catch(() => {
        return {err: "Prices Not Found!"};
      })
    }).catch(() => {
      return {err: "Reviews Not Found!"};
    })
  }).catch(() => {
    return {err: "Game Not Found!"};
  });
}

module.exports = getGameData;