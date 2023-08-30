const ajax = new XMLHttpRequest();
const content = document.createElement("div");
const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
const container = document.getElementById("root");

const getData = (url) => {
  ajax.open("GET", url, false); // false -> 데이터를 동기적으로 처리하겠다.
  ajax.send(); //데이터를 가져오는 메서드
  return JSON.parse(ajax.response); //return은 결과물을 내보낼때 필요
}; //중복되는 코드 함수로 코드 묶기

const newFeed = getData(NEWS_URL); // 데이터를 Json 형식으로 바꾸기
const ul = document.createElement("ul");
document.getElementById("root").appendChild(ul);
window.addEventListener("hashchange", function () {
  const id = location.hash.substring(1); // 여기에 this.location.hash 랑 그냥 location.hash의 차이를 알아보자 (this를 자동완성해주었다.)

  const newsContent = getData(CONTENT_URL.replace("@id", id));
  const title = document.createElement("h1");
  console.log(newsContent);
  container.innerHTML = `<h1> ${newsContent.title}</h1> <div> <a href='#'>목록으로</div>`;
  // title.innerHTML = newsContent.title;

  // content.appendChild(title);
});

const newList = [];
newsList.push("<ul>");
for (let i = 0; i < 10; i++) {
  const div = document.createElement("div");
  newsList.push(
    `<li><a href="#${newFeed[i].id}">${newFeed[i].title} (${newFeed[i].comments_count})</a></li>`
  );
  // const li = document.createElement("li");
  // const a = document.createElement("a");
  // a.innerHTML = `${newFeed[i].title} (${newFeed[i].comments_count})`; -> dom api를 사용하여 만든것 (ui가 어떻게 생겼는지 직관적으로 보이지 않음 )
  // a.href = `#${newFeed[i].id}`;  아래 코드와 같이 문자열로 표현하는 것이 더 직관적이다.(마크업 구조가 더 잘 보인다.) + 태그를 포함시킬 수 있댜 (span, li같은)
  div.innerHTML = `<li><a href="#${newFeed[i].id}">${newFeed[i].title} (${newFeed[i].comments_count})</a></li>`;
  // li.appendChild(a);
  ul.appendChild(div.firstElementChild);
}
container.appendChild(ul);
container.appendChild(content);
// 변수화하는 이유가 코드를 중복사용하지 않기 위해서도 있지만 (보기 좋기 짧게 하기 위해서 )id나 className이 바뀌었을 때 모든 getElementsById 속 id를 바꾸지 않기 위해서도 있다.
