const ajax = new XMLHttpRequest();
const content = document.createElement("div");
const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
const container = document.getElementById("root");
//container 변수화하는 이유가 코드를 중복사용하지 않기 위해서도 있지만 (보기 좋기 짧게 하기 위해서 )id나 className이 바뀌었을 때 모든 getElementsById 속 id를 바꾸지 않기 위해서도 있다.

const store = {
  currentPage: 1,
};

const getData = (url) => {
  ajax.open("GET", url, false); // false -> 데이터를 동기적으로 처리하겠다.
  ajax.send(); //데이터를 가져오는 메서드
  return JSON.parse(ajax.response); //return은 결과물을 내보낼때 필요
}; //중복되는 코드 함수로 코드 묶기

const newsFeed = () => {
  const newFeed = getData(NEWS_URL); // 데이터를 Json 형식으로 바꾸기
  const newsList = [];
  newsList.push("<ul>");
  for (let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
    newsList.push(
      `<li><a href="#/show/${newFeed[i].id}">${newFeed[i].title} (${newFeed[i].comments_count})</a></li>`
    ); //domAPI를 최소화하는 것이 좋다
  }
  newsList.push("</ul>");
  newsList.push(`<div><a href='#/page/${
    store.currentPage > 1 ? store.currentPage - 1 : 1
  }'>이전페이지 </a> <a href='#/page/${
    store.currentPage + 1
  }'>다음페이지 </a></div>
`);
  container.innerHTML = newsList.join("");
  // newList 자체는 배열이기 때문에 innerHTML에 들어갈 수 없다. 따라서 join함수를 이용해서 문자열로 바꿔준다.
};
const newsDetail = () => {
  const id = location.hash.substring(7); // 여기에 this.location.hash 랑 그냥 location.hash의 차이를 알아보자 (this를 자동완성해주었다.)

  const newsContent = getData(CONTENT_URL.replace("@id", id));

  container.innerHTML = `<h1> ${newsContent.title}</h1> <div> <a href='#/page/${store.currentPage}'>목록으로</div>`;
};

const router = () => {
  const routePath = location.hash;
  if (routePath === "") {
    newsFeed();
  } else if (routePath.indexOf("#/page/") >= 0) {
    store.currentPage = Number(routePath.substring(7)); //단순히  routePath.substring(7) 이렇게만 하면 문자열이기 때문에 currentPage가 더해지지 않고 11 12 이런식으로 붙여서 나온다.
    // console.log(routePath.substring(7));
    newsFeed();
  } else {
    newsDetail();
  }
};
window.addEventListener("hashchange", router);
router();
