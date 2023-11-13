// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  var error;
  for (var i = 0; i < entry.length; i++) {
    try {
      newRequire(entry[i]);
    } catch (e) {
      // Save first error but execute all entries
      if (!error) {
        error = e;
      }
    }
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  parcelRequire = newRequire;

  if (error) {
    // throw error from earlier, _after updating parcelRequire_
    throw error;
  }

  return newRequire;
})({"index.ts":[function(require,module,exports) {
"use strict";

var ajax = new XMLHttpRequest();
var NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
var CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";
var container = document.getElementById("root");
var content = document.createElement("div");
//container 변수화하는 이유가 코드를 중복사용하지 않기 위해서도 있지만 (보기 좋기 짧게 하기 위해서 )id나 className이 바뀌었을 때 모든 getElementsById 속 id를 바꾸지 않기 위해서도 있다.
var store = {
  currentPage: 1,
  feeds: []
};
var getData = function getData(url) {
  // getData는 return 값이 url에 따라서 두가지 타입으로 출력되고 있으므로 위와 같이 | 사용하여 구분해준다.
  ajax.open("GET", url, false); // false -> 데이터를 동기적으로 처리하겠다.
  ajax.send(); //데이터를 가져오는 메서드
  return JSON.parse(ajax.response); //return은 결과물을 내보낼때 필요
}; //중복되는 코드 함수로 코드 묶기
var makeFeeds = function makeFeeds(feedsData) {
  for (var i = 0; i < feedsData.length; i++) {
    feedsData[i].read = false; //모든 뉴스 항목의 초기 읽음 여부를 false로 설정 (read key 추가)
  }

  return feedsData;
};
// container가 null인 경우 , innerHTML 속성을 쓸 수 없기 때문에 type에러가 남. 이 부분에 대하여 따로 처리하기 위해 함수 작성
var updateView = function updateView(html) {
  if (container) {
    container.innerHTML = html;
  } else {
    console.error("에러가 났습니다");
  }
};
var newsFeed = function newsFeed() {
  var newsFeeds = store.feeds;
  var newsList = [];
  var template = "\n    <div class=\"bg-gray-600 min-h-screen\">\n      <div class=\"bg-white text-xl\">\n        <div class=\"mx-auto px-4\">\n          <div class=\"flex justify-between items-center py-6\">\n            <div class=\"flex justify-start\">\n              <h1 class=\"font-extrabold\">Hacker News</h1>\n            </div>\n            <div class=\"items-center justify-end\">\n              <a href=\"#/page/{{__prev_page__}}\" class=\"text-gray-500\">\n                Previous\n              </a>\n              <a href=\"#/page/{{__next_page__}}\" class=\"text-gray-500 ml-4\">\n                Next\n              </a>\n            </div>\n          </div> \n        </div>\n      </div>\n      <div class=\"p-4 text-2xl text-gray-700\">\n        {{__news_feed__}}        \n      </div>\n    </div>\n  ";
  if (!newsFeeds.length) {
    newsFeeds = makeFeeds(getData(NEWS_URL)); // 초기에 한번 데이터를 가져온다
  }

  for (var i = (store.currentPage - 1) * 10; i < store.currentPage * 10; i++) {
    newsList.push("\n      <div class=\"p-6 ".concat(newsFeeds[i].read ? "bg-red-500" : "bg-white", " mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100\">\n        <div class=\"flex\">\n          <div class=\"flex-auto\">\n            <a href=\"#/show/").concat(newsFeeds[i].id, "\">").concat(newsFeeds[i].title, "</a>  \n          </div>\n          <div class=\"text-center text-sm\">\n            <div class=\"w-10 text-white bg-green-300 rounded-lg px-0 py-2\">").concat(newsFeeds[i].comments_count, "</div>\n          </div>\n        </div>\n        <div class=\"flex mt-3\">\n          <div class=\"grid grid-cols-3 text-sm text-gray-500\">\n            <div><i class=\"fas fa-user mr-1\"></i>").concat(newsFeeds[i].user, "</div>\n            <div><i class=\"fas fa-heart mr-1\"></i>").concat(newsFeeds[i].points, "</div>\n            <div><i class=\"far fa-clock mr-1\"></i>").concat(newsFeeds[i].time_ago, "</div>\n          </div>  \n        </div>\n      </div>    \n    ")); //domAPI를 최소화하는 것이 좋다
  }

  template = template.replace("{{__news_feed__}}", newsList.join(""));
  // newsList이 배열이기 때문에 문자열로 합치기 위해 join 사용
  // newsList 자체는 배열이기 때문에 innerHTML에 들어갈 수 없다. 따라서 join함수를 이용해서 문자열로 바꿔준다.
  template = template.replace("{{__prev_page__}}", store.currentPage > 1 ? store.currentPage - 1 : 1); //이전 페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
  template = template.replace("{{__next_page__}}", store.currentPage < 3 ? store.currentPage + 1 : 3); //다음  페이지로 이동하기 위해서 store.currentPage를 페이지마다 변경하여 저장
  //마지막 페이지가 3페이지기에 3을 기준으로 변경
  updateView(template);
};
var newsDetail = function newsDetail() {
  var id = location.hash.substring(7); // 여기에 this.location.hash 랑 그냥 location.hash의 차이를 알아보자 (this를 자동완성해주었다.)
  var newsContent = getData(CONTENT_URL.replace("@id", id));
  var template = "\n    <div class=\"bg-gray-600 min-h-screen pb-8\">\n      <div class=\"bg-white text-xl\">\n        <div class=\"mx-auto px-4\">\n          <div class=\"flex justify-between items-center py-6\">\n            <div class=\"flex justify-start\">\n              <h1 class=\"font-extrabold\">Hacker News</h1>\n            </div>\n            <div class=\"items-center justify-end\">\n              <a href=\"#/page/".concat(store.currentPage, "\" class=\"text-gray-500\">\n                <i class=\"fa fa-times\"></i>\n              </a>\n            </div>\n          </div>\n        </div>\n      </div>\n\n      <div class=\"h-full border rounded-xl bg-white m-6 p-4 \">\n        <h2>").concat(newsContent.title, "</h2>\n        <div class=\"text-gray-400 h-20\">\n          ").concat(newsContent.content, "\n        </div>\n\n        {{__comments__}}\n\n      </div>\n    </div>\n  ");
  for (var i = 0; i < store.feeds.length; i++) {
    console.log("hello");
    if (store.feeds[i].id === Number(id)) {
      console.log("hello");
      store.feeds[i].read = true;
      break;
    }
  }
  var makeComment = function makeComment(comments, called) {
    if (called === void 0) {
      called = 0;
    }
    var commentString = [];
    //대댓글 구현하는 구조 잘 봐두기!!
    for (var i = 0; i < comments.length; i++) {
      commentString.push("\n        <div style=\"padding-left: ".concat(called * 40, "px;\" class=\"mt-4\">\n          <div class=\"text-gray-400\">\n            <i class=\"fa fa-sort-up mr-2\"></i>\n            <strong>").concat(comments[i].user, "</strong> ").concat(comments[i].time_ago, "\n          </div>\n          <p class=\"text-gray-700\">").concat(comments[i].content, "</p>\n        </div>      \n      "));
      if (comments[i].comments.length > 0) {
        // console.log(called);
        commentString.push(makeComment(comments[i].comments, called + 1)); //재귀호출
        // console.log(commentString);
      } // => 대댓글을 구현하는 구조
      //대댓글이 있으면 재귀호출을 사용해서 makeComment를 호출하고 commentString에 넣는다
    }
    // console.log(commentString);
    return commentString.join("");
  };
  updateView(template.replace("  {{__comments__}}", makeComment(newsContent.comments)));
};
var router = function router() {
  var routePath = location.hash;
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
},{}],"../../../../../../../opt/homebrew/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js":[function(require,module,exports) {
var global = arguments[3];
var OVERLAY_ID = '__parcel__error__overlay__';
var OldModule = module.bundle.Module;
function Module(moduleName) {
  OldModule.call(this, moduleName);
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {});
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn);
    }
  };
  module.bundle.hotData = null;
}
module.bundle.Module = Module;
var checkedAssets, assetsToAccept;
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== 'undefined') {
  var hostname = "" || location.hostname;
  var protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  var ws = new WebSocket(protocol + '://' + hostname + ':' + "49910" + '/');
  ws.onmessage = function (event) {
    checkedAssets = {};
    assetsToAccept = [];
    var data = JSON.parse(event.data);
    if (data.type === 'update') {
      var handled = false;
      data.assets.forEach(function (asset) {
        if (!asset.isNew) {
          var didAccept = hmrAcceptCheck(global.parcelRequire, asset.id);
          if (didAccept) {
            handled = true;
          }
        }
      });

      // Enable HMR for CSS by default.
      handled = handled || data.assets.every(function (asset) {
        return asset.type === 'css' && asset.generated.js;
      });
      if (handled) {
        console.clear();
        data.assets.forEach(function (asset) {
          hmrApply(global.parcelRequire, asset);
        });
        assetsToAccept.forEach(function (v) {
          hmrAcceptRun(v[0], v[1]);
        });
      } else if (location.reload) {
        // `location` global exists in a web worker context but lacks `.reload()` function.
        location.reload();
      }
    }
    if (data.type === 'reload') {
      ws.close();
      ws.onclose = function () {
        location.reload();
      };
    }
    if (data.type === 'error-resolved') {
      console.log('[parcel] ✨ Error resolved');
      removeErrorOverlay();
    }
    if (data.type === 'error') {
      console.error('[parcel] 🚨  ' + data.error.message + '\n' + data.error.stack);
      removeErrorOverlay();
      var overlay = createErrorOverlay(data);
      document.body.appendChild(overlay);
    }
  };
}
function removeErrorOverlay() {
  var overlay = document.getElementById(OVERLAY_ID);
  if (overlay) {
    overlay.remove();
  }
}
function createErrorOverlay(data) {
  var overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;

  // html encode message and stack trace
  var message = document.createElement('div');
  var stackTrace = document.createElement('pre');
  message.innerText = data.error.message;
  stackTrace.innerText = data.error.stack;
  overlay.innerHTML = '<div style="background: black; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; opacity: 0.85; font-family: Menlo, Consolas, monospace; z-index: 9999;">' + '<span style="background: red; padding: 2px 4px; border-radius: 2px;">ERROR</span>' + '<span style="top: 2px; margin-left: 5px; position: relative;">🚨</span>' + '<div style="font-size: 18px; font-weight: bold; margin-top: 20px;">' + message.innerHTML + '</div>' + '<pre>' + stackTrace.innerHTML + '</pre>' + '</div>';
  return overlay;
}
function getParents(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return [];
  }
  var parents = [];
  var k, d, dep;
  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d];
      if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) {
        parents.push(k);
      }
    }
  }
  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id));
  }
  return parents;
}
function hmrApply(bundle, asset) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (modules[asset.id] || !bundle.parent) {
    var fn = new Function('require', 'module', 'exports', asset.generated.js);
    asset.isNew = !modules[asset.id];
    modules[asset.id] = [fn, asset.deps];
  } else if (bundle.parent) {
    hmrApply(bundle.parent, asset);
  }
}
function hmrAcceptCheck(bundle, id) {
  var modules = bundle.modules;
  if (!modules) {
    return;
  }
  if (!modules[id] && bundle.parent) {
    return hmrAcceptCheck(bundle.parent, id);
  }
  if (checkedAssets[id]) {
    return;
  }
  checkedAssets[id] = true;
  var cached = bundle.cache[id];
  assetsToAccept.push([bundle, id]);
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    return true;
  }
  return getParents(global.parcelRequire, id).some(function (id) {
    return hmrAcceptCheck(global.parcelRequire, id);
  });
}
function hmrAcceptRun(bundle, id) {
  var cached = bundle.cache[id];
  bundle.hotData = {};
  if (cached) {
    cached.hot.data = bundle.hotData;
  }
  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData);
    });
  }
  delete bundle.cache[id];
  bundle(id);
  cached = bundle.cache[id];
  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb();
    });
    return true;
  }
}
},{}]},{},["../../../../../../../opt/homebrew/lib/node_modules/parcel-bundler/src/builtins/hmr-runtime.js","index.ts"], null)
//# sourceMappingURL=/Hacker.77de5100.js.map