console.clear();
const rp = require("request-promise");
const cheerio = require("cheerio");

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

const getGameData = (platformName, gameName) => {
  let nameFormat = (name) => name.toLowerCase().split(" ").join("-");

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
    console.error("Platform Not Found!");
    return new Promise((resolve) => {resolve(undefined)});
  } 

  let baseUrl = `https://www.metacritic.com/game/${platform}/${game}`;
  let detailsUrl = `${baseUrl}/details`;

  return metaCriticData(detailsUrl).then(data => {
    return metaCriticReviews(baseUrl).then(reviews => {
      return {...data, ...reviews, platforms: [...data.platforms, platformList[platformListFormatted.indexOf(platform)]]};
    })
  }).catch(() => {
    console.error("Game Not Found!");
    return;
  });
}

// Parameters
let platformName = "ps4";
let gameName = "Apex Legends";

getGameData(platformName, gameName)
  .then(gameData => {
    console.log(gameData);
  });
