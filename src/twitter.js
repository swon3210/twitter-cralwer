const puppeteer = require("puppeteer");

const BASE_URL = "https://twitter.com/";
const HOME_URL = "https://twitter.com/home"
const LOGIN_URL = "https://twitter.com/login/";
const USERNAME_URL = (username) => `https://twitter.com/${username}/`

let browser = null;
let page = null;

const twitter = {
  initialize: async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();

    await page.goto(BASE_URL);
  },
  login: async (username, password) => {
    await page.goto(LOGIN_URL);
    await page.waitFor('form[class="t1-form clearfix signin js-signin"] input[name="session[username_or_email]"]');
    await page.type('form[class="t1-form clearfix signin js-signin"] input[name="session[username_or_email]"]', username);
    await page.type('form[class="t1-form clearfix signin js-signin"] input[name="session[password]"', password);
    await page.click('button[type="submit"]');
    
    // 로그인 되서 페이지 로딩될 때까지 기다리기. 시간초로 하면 인터넷 사정에 따라 어떻게 달라질지 모르기에 불확실함
    await page.waitFor('a[href="/compose/tweet"]');

  },

  end: async () => {
    await page.close();
  },

  postTweet: async (message) => {
    // 현재의 URL 리턴
    const url = await page.url();
    
    // 쓸데 없은 request 줄이기 - 근데 /home인데...상관없으려나
    if (url !== HOME_URL) {
      await page.goto(HOME_URL);
    }

    await page.waitFor('a[href="/compose/tweet"]');
    await page.click('a[href="/compose/tweet"]');
    // 오토 포커스 등의 이유로 셀렉터로 요소를 선택할 필요가 없거나 셀렉터를 통해 요소를 찾기 어려울 때를 대비해서 실제 사람과 같은 동작이 필요하다
    await page.waitFor(500);
    await page.keyboard.type(message, { delay: 50 });
    await page.click('div[role="button"][data-testid="tweetButton"]');

  },

  getUserInfo: async (username) => {

    const url = await page.url();

    if (url !== USERNAME_URL(username)) {
      await page.goto(USERNAME_URL(username));
    }

    await page.waitFor('div[dir="ltr"] span');

    // 실제 브라우저 콘솔에 접근하여 코드를 쓴다
    // 아! 에뮬레잇은 콘솔에서 동작하는거라서 여기서는 디버거를 써도 안걸리는 구나. 이 함수 자체를 넘기는 거지 여기서 실행하는게 아니기 때문에
    // 계정에 따라 주소가 있을 수도 있고, 없을 수도 있기 때문에 혹시 요소가 없을 때를 대비해서 예외처리를 해야한다.
    const user_info = await page.evaluate(() => {

      const tweets = document.querySelectorAll('h2[role="heading"]')[1].nextSibling.innerText.replace(' Tweets', '')
      const items = document.querySelector('div[data-testid="UserProfileHeader_Items"]');

      return {
        full_name: document.querySelector('div[dir="ltr"]').parentElement.previousSibling.innerText,
        desc: document.querySelector('div[data-testid="UserDescription"] span').innerText,
        following_count: document.querySelector('a[href="/udemy/following"]').getAttribute('title'),
        followers_count: document.querySelector('a[href="/udemy/followers"]').getAttribute('title'),
        tweets_count: tweets.includes("K") ? Number(tweets.slice(0, -1)) * 1000 : Number(tweets),
        address: items.children[0] ? items.children[0].innerText : "not registered",
        link: items.children[1] ? items.children[1].innerText : "not registered",
        joined_data: items.children[2] ? items.children[2].innerText : "not registered",
      }
    })


    return user_info;
  },

  getTweets: async (username, count = 10) => {
    
    console.log(count)

    const url = await page.url();

    if (url !== USERNAME_URL(username)) {
      await page.goto(USERNAME_URL(username));
    } 

    await page.waitFor('div[aria-label="Timeline: Udemy’s Tweets"] div[data-testid="tweet"] > div > div');

    await page.waitFor(3000);

    // 트위터 텍스트 크롤링

    let tweets = [];
    let tweets_length = 0;

    // 브라우저 스크롤링
    while (tweets.length < count ) {

      console.log('배열 : ', tweets.length, '렝스 : ', tweets_length);

      tweets_length = tweets.length;

      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitFor(7000)

      tweets = await page.evaluate(() => {
        let tweet_list = [];
  
        let list = document.querySelectorAll('div[data-testid="tweet"]');
        for (let i of list) {
          console.log(i.innerText);
          tweet_list.push(i.innerText);
        }
        return tweet_list;
      });
    }
      
    debugger;
    
    // 어쩔 수 없겠네 $eval 제대로 사용하는 법 알 때까지는 일단 차선책이라고 생각하자.



    // for (let tweetElement of twitterArray) {
    //   // this says 
    //   let tweet = await tweetElement.$eval(`div[data-testid="tweet"]`, element => {
    //     return {
    //       header: element.children[1].children[0],
    //       text: element.children[1].children[1],
    //       buttons: element.children[1].children[2]
    //     }
    //   }).catch(err => {
    //     console.log(err);
    //   })
    //   tweets.push(tweet);
    // }
  }
}

module.exports = twitter;