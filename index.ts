type Store = {
  currentPage: number;
  feeds: NewsFeed[];
};
type News = {
  id: number;
  url: string;
  time_ago: string;

  title: string;
  content: string;
  user: string;
};

type NewsFeed = News & {
  comments_count: number;

  points: number;

  read?: boolean;
};
type NewsDetail = News & {
  comments: NewsComment[];
  level: number;
};
type NewsComment = News & {
  comments: NewsComment[];
  level: number;
};
const ajax: XMLHttpRequest = new XMLHttpRequest();
const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
const container: HTMLElement | null = document.getElementById("root");
const content = document.createElement("div");
//container 변수화하는 이유가 코드를 중복사용하지 않기 위해서도 있지만 (보기 좋기 짧게 하기 위해서 )id나 className이 바뀌었을 때 모든 getElementsById 속 id를 바꾸지 않기 위해서도 있다.

const store: Store = {
  currentPage: 1,
  feeds: [],
};

const getData = <AjaxResponse>(url: string): AjaxResponse => {
  // getData는 return 값이 url에 따라서 두가지 타입으로 출력되고 있으므로 위와 같이 | 사용하여 구분해준다.

  ajax.open("GET", url, false); // false -> 데이터를 동기적으로 처리하겠다.
  ajax.send(); //데이터를 가져오는 메서드

  return JSON.parse(ajax.response); //return은 결과물을 내보낼때 필요
}; //중복되는 코드 함수로 코드 묶기

const makeFeeds = (feedsData: NewsFeed[]): NewsFeed[] => {
  //feedsData: NewsFeed[] 입력매개변수의 타입
  // NewsFeed[] 반환값의 타입
  for (let i = 0; i < feedsData.length; i++) {
    feedsData[i].read = false; //모든 뉴스 항목의 초기 읽음 여부를 false로 설정 (read key 추가)
  }
  return feedsData;
};

// container가 null인 경우 , innerHTML 속성을 쓸 수 없기 때문에 type에러가 남. 이 부분에 대하여 따로 처리하기 위해 함수 작성
const updateView = (html: string): void => {
  // 반환값이 없기 때문에 void 사용
  if (container) {
    container.innerHTML = html;
  } else {
    console.error("에러가 났습니다");
  }
};

const newsFeed = (): void => {
  let newsFeeds: NewsFeed[] = store.feeds;
  const newsList = [];
  let template = `
    <div class="bg-gray-600 min-h-screen">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/{{__prev_page__}}" class="text-gray-500">
                Previous
              </a>
              <a href="#/page/{{__next_page__}}" class="text-gray-500 ml-4">
                Next
              </a>
            </div>
          </div> 
        </div>
      </div>
      <div class="p-4 text-2xl text-gray-700">
        {{__news_feed__}}        
      </div>
    </div>
  `;
  if (!newsFeeds.length) {
    newsFeeds = makeFeeds(getData<NewsFeed[]>(NEWS_URL)); // 초기에 한번 데이터를 가져온다
  }
  for (let i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
    newsList.push(`
      <div class="p-6 ${
        newsFeeds[i].read ? "bg-red-500" : "bg-white"
      } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
        <div class="flex">
          <div class="flex-auto">
            <a href="#/show/${newsFeeds[i].id}">${newsFeeds[i].title}</a>  
          </div>
          <div class="text-center text-sm">
            <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${
              newsFeeds[i].comments_count
            }</div>
          </div>
        </div>
        <div class="flex mt-3">
          <div class="grid grid-cols-3 text-sm text-gray-500">
            <div><i class="fas fa-user mr-1"></i>${newsFeeds[i].user}</div>
            <div><i class="fas fa-heart mr-1"></i>${newsFeeds[i].points}</div>
            <div><i class="far fa-clock mr-1"></i>${newsFeeds[i].time_ago}</div>
          </div>  
        </div>
      </div>    
    `); //domAPI를 최소화하는 것이 좋다
  }
  template = template.replace("{{__news_feed__}}", newsList.join(""));
  // newsList이 배열이기 때문에 문자열로 합치기 위해 join 사용
  // newsList 자체는 배열이기 때문에 innerHTML에 들어갈 수 없다. 따라서 join함수를 이용해서 문자열로 바꿔준다.
  template = template.replace(
    "{{__prev_page__}}",
    String(store.currentPage > 1 ? store.currentPage - 1 : 1)
  ); //이전 페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
  template = template.replace(
    "{{__next_page__}}",
    String(store.currentPage < 3 ? store.currentPage + 1 : 3)
  ); //다음  페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
  //마지막 페이지가 3페이지기에 3을 기준으로 변경
  updateView(template);
};
const newsDetail = (): void => {
  const id = location.hash.substring(7); // 여기에 this.location.hash 랑 그냥 location.hash의 차이를 알아보자 (this를 자동완성해주었다.)
  const newsContent = getData<NewsDetail>(CONTENT_URL.replace("@id", id));
  let template = `
    <div class="bg-gray-600 min-h-screen pb-8">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/${store.currentPage}" class="text-gray-500">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full border rounded-xl bg-white m-6 p-4 ">
        <h2>${newsContent.title}</h2>
        <div class="text-gray-400 h-20">
          ${newsContent.content}
        </div>

        {{__comments__}}

      </div>
    </div>
  `;

  for (let i = 0; i < store.feeds.length; i++) {
    console.log("hello");
    if (store.feeds[i].id === Number(id)) {
      console.log("hello");
      store.feeds[i].read = true;
      break;
    }
  }

  updateView(
    template.replace("  {{__comments__}}", makeComment(newsContent.comments))
  );
};
const makeComment = (comments: NewsComment[]): string => {
  const commentString = [];
  //대댓글 구현하는 구조 잘 봐두기!!
  for (let i = 0; i < comments.length; i++) {
    const comment: NewsComment = comments[i];
    commentString.push(`
        <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
          <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comment.user}</strong> ${comment.time_ago}
          </div>
          <p class="text-gray-700">${comment.content}</p>
        </div>      
      `);
    if (comment.comments.length > 0) {
      // console.log(called);
      commentString.push(makeComment(comment.comments)); //재귀호출
      // console.log(commentString);
    } // => 대댓글을 구현하는 구조
    //대댓글이 있으면 재귀호출을 사용해서 makeComment를 호출하고 commentString에 넣는다
  }
  // console.log(commentString);
  return commentString.join("");
};
const router = (): void => {
  const routePath = location.hash;
  // console.log(routePath);
  if (routePath === "") {
    newsFeed(); // 초기 페이지 로딩시 실행됨 (현재 페이지의 해시값이 비어 있는 경우)
  } else if (routePath.indexOf("#/page/") >= 0) {
    store.currentPage = Number(routePath.substring(7)); //단순히  routePath.substring(7) 이렇게만 하면 문자열이기 때문에 currentPage가 더해지지 않고 11 12 이런식으로 붙여서 나온다. 그래서 Number함수를 사용.
    // console.log(routePath.substring(7));
    newsFeed();
  } else {
    newsDetail();
  }
};
window.addEventListener("hashchange", router);
router();
