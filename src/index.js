const puppeteer = require("puppeteer");
const twitter = require("./twitter.js");

(async () => {
  const USER_NAME = "01034303210";
  const PASSWORD = "ahqkdlf#02";

  await twitter.initialize();
  await twitter.login(USER_NAME, PASSWORD);

  // const user_info = await twitter.getUserInfo("udemy");
  const user_tweets = twitter.getTweets('udemy', 30);

  // await twitter.postTweet("안녕하세요");
})();