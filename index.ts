interface Store {
  currentPage: number;
  feeds: NewsFeed[];
}
interface News {
  readonly id: number; //readonly를 붙이면 타입값이 변하지 않음.
  readonly url: string;
  readonly time_ago: string;
  readonly title: string;
  readonly content: string;
  readonly user: string;
}
interface RouteInfo {
  path: string;
  page: View;
}
interface NewsFeed extends News {
  readonly comments_count: number;
  readonly points: number;
  read?: boolean; //read는 true / false 로 변환시키기 때문에 readonly로 사용하지 않는다
}
interface NewsDetail extends News {
  readonly comments: NewsComment[];
}
interface NewsComment extends News {
  readonly comments: NewsComment[];
  readonly level: number;
}
const ajax: XMLHttpRequest = new XMLHttpRequest();
const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
const container: HTMLElement | null = document.getElementById("root");
const content = document.createElement("div");
//container 변수화하는 이유가 코드를 중복사용하지 않기 위해서도 있지만 (보기 좋기 짧게 하기 위해서 )id나 className이 바뀌었을 때 모든 getElementsById 속 id를 바꾸지 않기 위해서도 있다.

const applyApiMixins = (targetClass: any, baseClasses: any[]): void => {
  baseClasses.forEach((baseClass) => {
    Object.getOwnPropertyNames(baseClass.prototype).forEach((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        baseClass.prototype,
        name
      );

      if (descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    });
  });
};
// 상속을 applyApiMixins을 통해서 직접 구현 (mixins)

const store: Store = {
  currentPage: 1,
  feeds: [],
};
class Api {
  ajax: XMLHttpRequest;
  url: string;
  constructor(url: string) {
    this.ajax = new XMLHttpRequest();
    this.url = url;
  }
  getRequest<AjaxResponse>(): AjaxResponse {
    //<AjaxResponse> => 제네릭 문법 사용 (아직 확정되지 않은 타입이라는 의미 )
    // 위 코드를 간단히 해석하면 AjaxResponse는 어떤 타입인지 모르는데, 호출 순간에 타입이 확정되면 반환값으로 AjaxResponse를 쓸거야

    this.ajax.open("GET", this.url, false);
    this.ajax.send();

    return JSON.parse(this.ajax.response);
  }
}

class NewsFeedApi extends Api {
  getData(): NewsFeed[] {
    return this.getRequest<NewsFeed[]>();
  }
}
class NewsDetailApi extends Api {
  getData(): NewsDetail {
    return this.getRequest<NewsDetail>();
  }
}

interface NewsFeedApi extends Api {}
interface NewsDetailApi extends Api {}
// 타입스크립트 컴파일러한테 이 두가지 class가 합성될거야 라는 걸 알려주기 위해서 사용

applyApiMixins(NewsFeedApi, [Api]); // [Api] => 다중상속 가능성 열어두기
applyApiMixins(NewsDetailApi, [Api]);
// 인자로 받은 두개의 클래스가 아무런 연관관계가 없기 때문에, 믹스인 함수를 통해서 두 기능이 합성된다는 것을 추적하지 못함

// container가 null인 경우 , innerHTML 속성을 쓸 수 없기 때문에 type에러가 남. 이 부분에 대하여 따로 처리하기 위해 함수 작성

abstract class View {
  template: string;
  private renderTemplate: string;
  private container: HTMLElement;
  htmlList: string[];
  // 타입선언 후
  constructor(containerId: string, template: string) {
    const containerElement = document.getElementById(containerId); //containerId를 인자로 어디서 받아오는거지??

    if (!containerElement) {
      throw "최상위 컨데이너가 없어 UI를 진행하지 못합니다";
    }
    this.container = containerElement;
    this.template = template;
    this.htmlList = [];
    this.renderTemplate = template;
  }

  protected updateView = (): void => {
    // 반환값이 없기 때문에 void 사용

    this.container.innerHTML = this.renderTemplate;
    this.renderTemplate = this.template;
    //template으로 업데이트 안하고 renderTemplate을 만들어준 이유
    // 기존 변수인 template만 업데이트 하다보면 초기상태로 되돌릴 수 없다.
    //따라서 새로운 데이터 렌더링 후 초기상태로 돌아가려면 renderTemplate을 실제 렌더링 템플릿으로 사용하고 template은 오로지 초기상태로 돌아가기 위한 변수로만 사용하는 것이다.
    // 그 다음 ui가 업데이트 전까지는 setTemplateData가 다시 호출될 가능성이 있다.
  };
  protected addhtml = (htmlString: string): void => {
    this.htmlList.push(htmlString);
  };
  protected getHtml = (): string => {
    const snapshot = this.htmlList.join("");
    // addhtml같은 경우 사용하는 곳이 많은데,  계속 push만 하면 안되니까 clear하는 작업이 필요하다.  따라서 snapshot이라는 변수를 새로 만들고,
    // clearHtmlList를 사용하여 배열을 초기화해준다.
    this.clearHtmlList();
    return snapshot;
  };
  protected setTemplateData(key: string, value: string): void {
    this.renderTemplate = this.renderTemplate.replace(`{{__${key}__}}`, value);
  }
  protected clearHtmlList = (): void => {
    this.htmlList = [];
  };
  // 자식메서드는 render함수를 꼭 구현하도록
  abstract render(): void;
}

class Router {
  routeTable: RouteInfo[];
  defaultRoute: RouteInfo | null;
  constructor() {
    window.addEventListener("hashchange", this.route.bind(this));
    this.routeTable = [];
    this.defaultRoute = null;
  }
  setDefaultPage = (page: View): void => {
    this.defaultRoute = { path: "", page };
  };
  //View class를 상속받은 페이지이기때문에 type은 View로
  addRoutePath = (path: string, page: View): void => {
    this.routeTable.push({ path, page });
  };
  route = () => {
    const routePath = location.hash;

    if (routePath === "" && this.defaultRoute) {
      this.defaultRoute.page.render();
    }

    for (const routerInfo of this.routeTable) {
      if (routePath.indexOf(routerInfo.path) >= 0) {
        routerInfo.page.render();
        // 원하는 동작에 따라 break문을 사용할지 여부 결정
        break;
      }
    }
  };
}

class NewsFeedView extends View {
  private api: NewsFeedApi;
  private feeds: NewsFeed[];
  constructor(containerId: string) {
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
    //상위 클래스의 생성자를 명시적으로 호출 해줘야 함.
    super(containerId, template);

    this.api = new NewsFeedApi(NEWS_URL);
    this.feeds = store.feeds;

    if (!this.feeds.length) {
      this.feeds = store.feeds = this.api.getData(); // 초기에 한번 데이터를 가져온다
      this.makeFeeds();
    }
  }
  // 이 부분만 render로 빼는 이유 : 언제 rendering이 될 지 불분명하기 때문에
  render(): void {
    store.currentPage = Number(location.hash.substring(7) || 1);
    for (
      let i = (store.currentPage - 1) * 10;
      i < store.currentPage * 10;
      i++
    ) {
      const { id, title, comments_count, user, points, time_ago, read } =
        this.feeds[i];
      this.addhtml(`
      <div class="p-6 ${
        read ? "bg-red-500" : "bg-white"
      } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
        <div class="flex">
          <div class="flex-auto">
            <a href="#/show/${id}">${title}</a>  
          </div>
          <div class="text-center text-sm">
            <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${comments_count}</div>
          </div>
        </div>
        <div class="flex mt-3">
          <div class="grid grid-cols-3 text-sm text-gray-500">
            <div><i class="fas fa-user mr-1"></i>${user}</div>
            <div><i class="fas fa-heart mr-1"></i>${points}</div>
            <div><i class="far fa-clock mr-1"></i>${time_ago}</div>
          </div>  
        </div>
      </div>    
    `); //domAPI를 최소화하는 것이 좋다
    }
    this.setTemplateData("news_feed", this.getHtml());
    // newsList이 배열이기 때문에 문자열로 합치기 위해 join 사용
    // newsList 자체는 배열이기 때문에 innerHTML에 들어갈 수 없다. 따라서 join함수를 이용해서 문자열로 바꿔준다.
    this.setTemplateData(
      "prev_page",
      String(store.currentPage > 1 ? store.currentPage - 1 : 1)
    ); //이전 페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
    this.setTemplateData(
      "next_page",
      String(store.currentPage < 3 ? store.currentPage + 1 : 3)
    ); //다음  페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
    //마지막 페이지가 3페이지기에 3을 기준으로 변경
    this.updateView();
  }

  //read 속성값을 변경해주는 함수
  private makeFeeds = (): void => {
    for (let i = 0; i < this.feeds.length; i++) {
      this.feeds[i].read = false; //모든 뉴스 항목의 초기 읽음 여부를 false로 설정 (read key 추가)
    }
  };
}

class NewsDetailView extends View {
  constructor(containerId: string) {
    let template = `
    <div class="bg-gray-600 min-h-screen pb-8">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="items-center justify-end">
              <a href="#/page/{{__currentPage__}}" class="text-gray-500">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full border rounded-xl bg-white m-6 p-4 ">
        <h2>{{__title__}}</h2>
        <div class="text-gray-400 h-20">
         {{__content__}}
        </div>

        {{__comments__}}

      </div>
    </div>
  `;
    super(containerId, template);
  }
  // 템플릿을 제외하고 렌더 메서드에 넣은 이유 : id 결정이 router가 호출될 당시에 결정되기 때문에 newdetailview의 생성 시점이 아니다아!
  render() {
    const id = location.hash.substring(7); // 여기에 this.location.hash 랑 그냥 location.hash의 차이를 알아보자 (this를 자동완성해주었다.)
    const api = new NewsDetailApi(CONTENT_URL.replace("@id", id));
    const newsDetail: NewsDetail = api.getData();
    for (let i = 0; i < store.feeds.length; i++) {
      if (store.feeds[i].id === Number(id)) {
        store.feeds[i].read = true;
        break;
      }
    }

    this.setTemplateData("  comments", this.makeComment(newsDetail.comments));
    this.setTemplateData("currentPage", String(store.currentPage));

    this.setTemplateData("title", newsDetail.title);
    this.setTemplateData("title", newsDetail.content);

    this.updateView();
  }
  private makeComment = (comments: NewsComment[]): string => {
    //대댓글 구현하는 구조 잘 봐두기!!
    for (let i = 0; i < comments.length; i++) {
      const comment: NewsComment = comments[i];
      this.addhtml(`
        <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
          <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comment.user}</strong> ${comment.time_ago}
          </div>
          <p class="text-gray-700">${comment.content}</p>
        </div>      
      `);
      if (comment.comments.length > 0) {
        this.addhtml(this.makeComment(comment.comments)); //재귀호출
      } // => 대댓글을 구현하는 구조
      //대댓글이 있으면 재귀호출을 사용해서 makeComment를 호출하고 commentString에 넣는다
    }

    return this.getHtml();
  };
}

// router();
const router: Router = new Router();
const newsFeedView = new NewsFeedView("root");
const newsDetailView = new NewsDetailView("root");

router.setDefaultPage(newsFeedView);
router.addRoutePath("/page/", newsFeedView);
router.addRoutePath("/show/", newsDetailView);
router.route();
