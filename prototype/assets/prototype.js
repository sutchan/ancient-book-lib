/**
 * 古籍通 AncientBook 原型交互脚本 v2.0
 * 功能：数据驱动渲染 / 繁简真实转换 / 检索闭环 / 汉堡菜单 / 三端预览 / 阅读控制 / 划词释义 / 动效
 * 数据源：data/app-data.js（全局变量，兼容 file:// 直开）
 */
(function(){
"use strict";

/* ==================== 状态 ==================== */
var DATA = window.APP_DATA || { categories: [], books: [], characters: [], relations: [], glossary: [] };
var state = {
  theme: localStorage.getItem("ab-theme") || "light",
  simplified: localStorage.getItem("ab-simple") === "1",
  device: localStorage.getItem("ab-device") || "desktop",
  fontSize: parseInt(localStorage.getItem("ab-fs") || "16", 10),
  lineHeight: parseFloat(localStorage.getItem("ab-lh") || "1.8"),
  chapterIdx: parseInt(localStorage.getItem("ab-chapter") || "0", 10),
  currentBookId: localStorage.getItem("ab-book") || "ru-lunyu",
  searchKeyword: "",
  filterCategory: "全部馆藏"
};

/* ==================== 繁简映射表（古籍常用字） ==================== */
var T2S_MAP = {
  "學":"学","習":"习","說":"说","樂":"乐","愠":"愠","君":"君","子":"子","朋":"朋","遠":"远","方":"方","來":"来","亦":"亦","乎":"乎","人":"人","知":"知","而":"而","不":"不","慍":"愠","曰":"曰","其":"其","為":"为","孝":"孝","弟":"弟","好":"好","犯":"犯","上":"上","鮮":"鲜","矣":"矣","未":"未","之":"之","有":"有","務":"务","本":"本","立":"立","道":"道","生":"生","與":"与","巧":"巧","言":"言","令":"令","色":"色","仁":"仁","見":"见","賢":"贤","回":"回","哉":"哉","一":"一","簞":"箪","食":"食","瓢":"瓢","飲":"饮","在":"在","陋":"陋","巷":"巷","不":"不","堪":"堪","憂":"忧","改":"改","其":"其","樂":"乐","由":"由","誨":"诲","女":"女","知":"知","為":"为","是":"是","也":"也","孟":"孟","王":"王","立":"立","於":"于","沼":"沼","上":"上","顧":"顾","鴻":"鸿","雁":"雁","麋":"麋","鹿":"鹿","賢":"贤","者":"者","何":"何","梁":"梁","惠":"惠","學":"学","而":"而","時":"时","習":"习","之":"之","不":"不","亦":"亦","說":"说","乎":"乎","有":"有","朋":"朋","自":"自","遠":"远","方":"方","來":"来","樂":"乐","人":"人","知":"知","不":"不","慍":"愠","無":"无","違":"违","焉":"焉","違":"违","仁":"仁","歲":"岁","寒":"寒","然":"然","後":"后","知":"知","松":"松","柏":"柏","之":"之","後":"后","彫":"凋","也":"也","國":"国","家":"家","興":"兴","亡":"亡","匹":"匹","夫":"夫","有":"有","責":"责","天":"天","下":"下","大":"大","治":"治","經":"经","云":"云","無":"无","相":"相","亦":"亦","無":"无","眾":"众","生":"生","生":"生","滅":"灭","垢":"垢","淨":"净","增":"增","減":"减","是":"是","故":"故","空":"空","中":"中","無":"无","色":"色","受":"受","想":"想","行":"行","識":"识","眼":"眼","耳":"耳","鼻":"鼻","舌":"舌","身":"身","意":"意","色":"色","聲":"声","香":"香","味":"味","觸":"触","法":"法","界":"界","乃":"乃","至":"至","意":"意","識":"识","無":"无","明":"明","亦":"亦","無":"无","無":"无","明":"明","盡":"尽","乃":"乃","至":"至","無":"无","老":"老","死":"死","亦":"亦","無":"无","老":"老","死":"死","盡":"尽","苦":"苦","集":"集","滅":"灭","道":"道","智":"智","亦":"亦","無":"无","得":"得","以":"以","無":"无","所":"所","得":"得","故":"故","菩":"菩","提":"提","薩":"萨","埵":"埵","依":"依","般":"般","若":"若","波":"波","羅":"罗","蜜":"蜜","多":"多","故":"故","心":"心","無":"无","罣":"挂","礙":"碍","無":"无","罣":"挂","礙":"碍","故":"故","無":"无","有":"有","恐":"恐","怖":"怖","遠":"远","離":"离","顛":"颠","倒":"倒","夢":"梦","想":"想","究":"究","竟":"竟","涅":"涅","槃":"槃","三":"三","世":"世","諸":"诸","佛":"佛","依":"依","般":"般","若":"若","波":"波","羅":"罗","蜜":"蜜","多":"多","故":"故","得":"得","阿":"阿","耨":"耨","多":"多","羅":"罗","三":"三","藐":"藐","三":"三","菩":"菩","提":"提","咒":"咒","能":"能","除":"除","一":"一","切":"切","苦":"苦","真":"真","實":"实","不":"不","虛":"虚","揭":"揭","諦":"谛","揭":"揭","諦":"谛","波":"波","羅":"罗","揭":"揭","諦":"谛","波":"波","羅":"罗","僧":"僧","揭":"揭","諦":"谛","菩":"菩","提":"提","薩":"萨","婆":"婆","訶":"诃","學":"学","而":"而","時":"时","習":"习","節":"节","氣":"气","鐘":"钟","聲":"声","詩":"诗","經":"经","關":"关","雎":"雎","在":"在","河":"河","之":"之","洲":"洲","窈":"窈","窕":"窕","淑":"淑","女":"女","君":"君","子":"子","好":"好","逑":"逑","參":"参","差":"差","荇":"荇","菜":"菜","左":"左","右":"右","流":"流","之":"之","寤":"寤","寐":"寐","求":"求","之":"之","悠":"悠","哉":"哉","悠":"悠","哉":"哉","輾":"辗","轉":"转","反":"反","側":"侧","蒹":"蒹","葭":"葭","蒼":"苍","蒼":"苍","白":"白","露":"露","為":"为","霜":"霜","所":"所","謂":"谓","伊":"伊","人":"人","在":"在","水":"水","一":"一","方":"方","溯":"溯","洄":"洄","從":"从","之":"之","道":"道","阻":"阻","且":"且","長":"长","溯":"溯","遊":"游","從":"从","之":"之","宛":"宛","在":"在","水":"水","中":"中","央":"央","蒹":"蒹","葭":"葭","萋":"萋","萋":"萋","白":"白","露":"露","未":"未","晞":"晞","所":"所","謂":"谓","伊":"伊","人":"人","在":"在","水":"水","之":"之","湄":"湄","溯":"溯","洄":"洄","從":"从","之":"之","道":"道","阻":"阻","且":"且","躋":"跻","溯":"溯","遊":"游","從":"从","之":"之","宛":"宛","在":"在","水":"水","中":"中","坻":"坻","蒹":"蒹","葭":"葭","采":"采","采":"采","白":"白","露":"露","未":"未","已":"已","所":"所","謂":"谓","伊":"伊","人":"人","在":"在","水":"水","之":"之","涘":"涘","溯":"溯","洄":"洄","從":"从","之":"之","道":"道","阻":"阻","且":"且","右":"右","溯":"溯","遊":"游","從":"从","之":"之","宛":"宛","在":"在","水":"水","中":"中","沚":"沚"
};

/* ==================== 工具函数 ==================== */
function $(sel, ctx){ return (ctx||document).querySelector(sel); }
function $$(sel, ctx){ return Array.prototype.slice.call((ctx||document).querySelectorAll(sel)); }
function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
function toSimplified(text){
  if(!state.simplified) return text;
  return String(text).split("").map(function(c){ return T2S_MAP[c] || c; }).join("");
}
function save(){ 
  localStorage.setItem("ab-theme", state.theme);
  localStorage.setItem("ab-simple", state.simplified ? "1" : "0");
  localStorage.setItem("ab-device", state.device);
  localStorage.setItem("ab-fs", String(state.fontSize));
  localStorage.setItem("ab-lh", String(state.lineHeight));
}
function go(hash){ location.hash = hash; }

/* ==================== 全局初始化 ==================== */
function initGlobal(){
  var body = document.body;
  body.setAttribute("data-theme", state.theme);
  body.setAttribute("data-device", state.device);

  // 主题切换
  var btnTheme = $("#btn-theme");
  if(btnTheme) btnTheme.addEventListener("click", function(){
    var list = ["light","paper","dark"];
    var idx = list.indexOf(state.theme);
    state.theme = list[(idx+1)%list.length];
    body.setAttribute("data-theme", state.theme);
    btnTheme.textContent = state.theme === "light" ? "日间" : state.theme === "paper" ? "护眼" : "深色";
    save();
  });
  if(btnTheme) btnTheme.textContent = state.theme === "light" ? "日间" : state.theme === "paper" ? "护眼" : "深色";

  // 繁简切换（真实转换）
  var btnSimp = $("#btn-toggle-simplified");
  if(btnSimp) btnSimp.addEventListener("click", function(){
    state.simplified = !state.simplified;
    btnSimp.textContent = state.simplified ? "简体" : "繁体";
    btnSimp.classList.toggle("on", !state.simplified);
    save();
    reRender();
  });
  if(btnSimp){
    btnSimp.textContent = state.simplified ? "简体" : "繁体";
    btnSimp.classList.toggle("on", !state.simplified);
  }

  // 汉堡菜单
  var ham = $("#hamburger");
  var menu = $("#mobile-menu");
  if(ham && menu) ham.addEventListener("click", function(){
    menu.classList.toggle("open");
  });

  // 设备预览切换
  $$(".device-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      state.device = btn.getAttribute("data-device");
      body.setAttribute("data-device", state.device);
      $$(".device-btn").forEach(function(b){ b.classList.toggle("active", b===btn); });
      save();
    });
    if(btn.getAttribute("data-device") === state.device) btn.classList.add("active");
  });

  // 高亮当前导航
  var current = location.hash.replace("#page-","") || "home";
  $$(".nav-menu a, .mobile-menu a").forEach(function(a){
    var href = a.getAttribute("href");
    if(href && href.indexOf(current) > -1) a.classList.add("active");
  });

  // 移动端菜单点击后收起
  $$(".mobile-menu a").forEach(function(a){
    a.addEventListener("click", function(){ if(menu) menu.classList.remove("open"); });
  });
}

/* ==================== 渲染器 ==================== */
function reRender(){
  var main = $("#main-view");
  if(main) renderRoute(main);
}

function renderRoute(main){
  var hash = location.hash || "#page-home";
  // 阅读页路由：/read/bookId
  var readMatch = hash.match(/^#read\/([\w-]+)/);
  if(readMatch){
    renderReader(main, readMatch[1]);
    return;
  }
  switch(hash){
    case "#page-category": renderCategory(main); break;
    case "#page-search": renderSearch(main); break;
    case "#page-character": renderCharacter(main); break;
    case "#page-relation": renderRelation(main); break;
    case "#page-help": renderHelp(main); break;
    case "#page-book-list": renderBookList(main); break;
    case "#page-read": renderReader(main, state.currentBookId); break;
    default: renderHome(main);
  }
  bindFadeIn(main);
}

/* 卡片入场动效 */
function bindFadeIn(container){
  var items = $$(".fade-in", container);
  if(!("IntersectionObserver" in window)){ items.forEach(function(i){ i.classList.add("visible"); }); return; }
  var obs = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add("visible"); obs.unobserve(e.target); }
    });
  }, { threshold: 0.05 });
  items.forEach(function(i){ obs.observe(i); });
}

/* ==================== 首页 ==================== */
function renderHome(main){
  var cats = DATA.categories.map(function(c,i){
    return '<div class="card category-card fade-in" onclick="location.hash=\'#page-category\'">'+
      '<div class="cat-icon">'+esc(c.icon)+'</div>'+
      '<div class="cat-name">'+esc(c.name)+'</div>'+
      '<div class="cat-desc">'+esc(c.desc)+'</div>'+
      '</div>';
  }).join("");
  main.innerHTML =
    '<section>'+
      '<div style="text-align:center;margin:48px 0 40px;">'+
        '<h1 style="font-size:30px;margin-bottom:10px;">'+toSimplified('古籍通')+'</h1>'+
        '<p style="color:var(--color-text-secondary);margin-bottom:30px;">'+toSimplified('开源公益古籍检索阅读与考据平台')+'</p>'+
        '<div class="search-box" style="max-width:600px;margin:0 auto;">'+
          '<input class="input-text" id="home-search-input" placeholder="'+toSimplified('检索古籍书名、内容、人物')+'">'+
          '<button class="btn btn-primary search-btn" id="home-search-btn">'+toSimplified('搜索')+'</button>'+
        '</div>'+
      '</div>'+
      '<h2 class="section-title">'+toSimplified('十大馆藏')+'</h2>'+
      '<div class="category-grid">'+cats+'</div>'+
      '<h2 class="section-title">'+toSimplified('学术工具')+'</h2>'+
      '<div class="category-grid">'+
        '<div class="card category-card fade-in" onclick="location.hash=\'#page-character\'">'+
          '<div class="cat-icon">考</div><div class="cat-name">'+toSimplified('人物考据')+'</div>'+
          '<div class="cat-desc">'+toSimplified('历史人物档案与史料聚合')+'</div></div>'+
        '<div class="card category-card fade-in" onclick="location.hash=\'#page-relation\'">'+
          '<div class="cat-icon">系</div><div class="cat-name">'+toSimplified('社会关系溯源')+'</div>'+
          '<div class="cat-desc">'+toSimplified('人物多维关系与双人溯源')+'</div></div>'+
      '</div>'+
    '</section>';
  var inp = $("#home-search-input");
  var btn = $("#home-search-btn");
  function doSearch(){
    if(inp && inp.value.trim()){
      state.searchKeyword = inp.value.trim();
      location.hash = "#page-search";
    }
  }
  if(btn) btn.addEventListener("click", doSearch);
  if(inp) inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
}

/* ==================== 馆藏分类页 ==================== */
function renderCategory(main){
  var cats = DATA.categories.map(function(c){
    var count = DATA.books.filter(function(b){ return b.category===c.name; }).length;
    return '<div class="card category-card fade-in" onclick="location.hash=\'#page-book-list\'">'+
      '<div class="cat-icon">'+esc(c.icon)+'</div>'+
      '<div class="cat-name">'+esc(c.name)+'</div>'+
      '<div class="cat-desc">'+esc(c.desc)+' · '+count+' 部</div>'+
      '</div>';
  }).join("");
  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('馆藏分类')+'</span></div>'+
      '<h2 style="margin-bottom:8px;">'+toSimplified('十大馆藏')+'</h2>'+
      '<p style="color:var(--color-text-secondary);margin-bottom:24px;">'+toSimplified('佛、儒、医、史、子、易、艺、诗、道、集十大正统古籍文库，共收录典籍 ') + DATA.books.length + toSimplified(' 部')+'</p>'+
      '<div class="category-grid">'+cats+'</div>'+
    '</section>';
}

/* ==================== 书籍列表页 ==================== */
function renderBookList(main){
  var books = DATA.books.map(function(b,i){
    return '<div class="book-item fade-in" onclick="state.currentBookId=\''+b.id+'\';location.hash=\'#read/\'+state.currentBookId">'+
      '<div class="book-index">'+esc(b.category.charAt(0))+'</div>'+
      '<div>'+
        '<div class="book-title">'+toSimplified(b.title)+'</div>'+
        '<div class="book-meta">'+toSimplified(b.dynasty + ' · ' + b.author + ' · ' + b.chapters.length + ' 章节')+'</div>'+
      '</div>'+
    '</div>';
  }).join("");
  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('馆藏书籍')+'</span></div>'+
      '<h2 style="margin-bottom:8px;">'+toSimplified('全库书目')+'</h2>'+
      '<p style="color:var(--color-text-secondary);margin-bottom:24px;">'+toSimplified('共收录') + ' ' + DATA.books.length + ' ' + toSimplified('部古籍，点击进入阅读')+'</p>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">'+
        '<button class="btn btn-sm btn-secondary tag-hover" onclick="location.hash=\'#page-book-list\'">'+toSimplified('全部')+'</button>'+
        DATA.categories.map(function(c){
          return '<button class="btn btn-sm btn-secondary tag-hover" onclick="location.hash=\'#page-book-list\'">'+esc(c.name)+'</button>';
        }).join("")+
      '</div>'+
      books+
    '</section>';
}

/* ==================== 阅读页 ==================== */
function renderReader(main, bookId){
  var book = DATA.books.filter(function(b){ return b.id===bookId; })[0] || DATA.books[0];
  var chapters = book.chapters;
  var idx = Math.min(state.chapterIdx, chapters.length-1);
  var chapterTitle = chapters[idx];

  var bodyStyle = 'style="--reader-fs:'+state.fontSize+'px;--reader-lh:'+state.lineHeight+';"';
  var text = getChapterText(book, idx);

  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span>'+
        '<a href="#page-book-list">'+toSimplified(book.category)+'</a><span class="sep">/</span>'+
        '<a href="#page-book-list">'+toSimplified(book.title)+'</a><span class="sep">/</span>'+
        '<span>'+toSimplified(chapterTitle)+'</span></div>'+
      '<div class="reader-wrap">'+
        '<div class="reader-title">'+toSimplified(book.title)+' · '+toSimplified(chapterTitle)+'</div>'+
        '<div class="reader-sub">'+toSimplified(book.dynasty + ' · ' + book.author)+'</div>'+
        '<div class="reader-toolbar">'+
          '<div class="ctrl">'+toSimplified('字号')+
            '<button onclick="adjustFs(-2)">A-</button><button onclick="adjustFs(2)">A+</button></div>'+
          '<div class="ctrl">'+toSimplified('行距')+
            '<button onclick="adjustLh(-0.2)">疏</button><button onclick="adjustLh(0.2)">密</button></div>'+
          '<div class="ctrl">'+toSimplified('章节')+
            '<button onclick="goChapter(-1)">‹</button><button onclick="goChapter(1)">›</button></div>'+
          '<div class="ctrl">'+toSimplified('进度')+' <span id="progress-text">'+ (idx+1) +'/'+chapters.length +'</span></div>'+
        '</div>'+
        '<div class="reader-body" '+bodyStyle+' id="reader-body">'+text+'</div>'+
        '<div class="reader-nav">'+
          '<button class="btn btn-secondary" onclick="goChapter(-1)">‹ '+toSimplified('上一章')+'</button>'+
          '<button class="btn btn-primary" onclick="goChapter(1)">'+toSimplified('下一章')+' ›</button>'+
        '</div>'+
        '<div class="reader-progress">'+toSimplified('阅读进度已自动保存，下次打开将继续')+'</div>'+
      '</div>'+
    '</section>';
  bindGlossary(main);
}

/* 章节文本（模拟真实内容 + 生僻字标注） */
function getChapterText(book, idx){
  var title = book.chapters[idx];
  var sample = {
    "论语": ['子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」','有子曰：「其為人也孝弟，而好犯上者，鮮矣；不好犯上，而好作亂者，未之有也。君子務本，本立而道生。孝弟也者，其為仁之本與！」','子曰：「巧言令色，鮮矣仁！」','曾子曰：「吾日三省吾身：為人謀而不忠乎？與朋友交而不信乎？傳不習乎？」','子曰：「道千乘之國，敬事而信，節用而愛人，使民以時。」','子曰：「弟子入則孝，出則弟，謹而信，汎愛眾，而親仁。行有餘力，則以學文。」'],
    "心经": ['觀自在菩薩，行深般若波羅蜜多時，照見五蘊皆空，度一切苦厄。','舍利子，色不異空，空不異色，色即是空，空即是色，受想行識，亦復如是。','舍利子，是諸法空相，不生不滅，不垢不淨，不增不減。','是故空中無色，無受想行識，無眼耳鼻舌身意，無色聲香味觸法。','無眼界，乃至無意識界，無無明，亦無無明盡，乃至無老死，亦無老死盡。','無苦集滅道，無智亦無得。以無所得故，菩提薩埵，依般若波羅蜜多故，心無罣礙。']
  }[book.title] || [
    '古之學者必有師。師者，所以傳道、受業、解惑也。人非生而知之者，孰能無惑？惑而不從師，其為惑也，終不解矣。',
    '生乎吾前，其聞道也固先乎吾，吾從而師之；生乎吾後，其聞道也亦先乎吾，吾從而師之。',
    '吾師道也，夫庸知其年之先後生於吾乎？是故無貴無賤，無長無少，道之所存，師之所存也。'
  ];
  var ps = sample.map(function(p){
    // 标注生僻字（可点击释义）
    var out = esc(p);
    DATA.glossary.forEach(function(g){
      if(out.indexOf(g.char) > -1){
        out = out.split(g.char).join('<span class="guji-char" data-char="'+esc(g.char)+'" title="'+esc(g.meaning)+'">'+g.char+'</span>');
      }
    });
    return '<p>'+out+'</p>';
  }).join("");
  return ps;
}

/* 划词/生僻字释义 */
function bindGlossary(main){
  $$(".guji-char", main).forEach(function(el){
    el.addEventListener("click", function(e){
      e.stopPropagation();
      var g = DATA.glossary.filter(function(x){ return x.char===el.getAttribute("data-char"); })[0];
      if(!g) return;
      var pop = $("#glossary-pop");
      if(!pop){
        pop = document.createElement("div");
        pop.id = "glossary-pop";
        pop.className = "glossary-pop";
        document.body.appendChild(pop);
      }
      pop.innerHTML = '<div class="gp-char">'+esc(g.char)+'</div>'+
        '<div class="gp-pinyin">'+toSimplified(g.pinyin)+'</div>'+
        '<div>'+toSimplified(g.meaning)+'</div>'+
        '<div class="gp-usage">'+toSimplified('例句：')+esc(g.usage)+'</div>';
      var r = el.getBoundingClientRect();
      pop.style.display = "block";
      var left = r.left + window.scrollX;
      var top = r.bottom + window.scrollY + 8;
      if(left + 300 > window.innerWidth) left = window.innerWidth - 310;
      pop.style.left = left + "px";
      pop.style.top = top + "px";
    });
  });
  document.addEventListener("click", function(e){
    var pop = $("#glossary-pop");
    if(pop && !e.target.closest(".guji-char") && !e.target.closest("#glossary-pop")){
      pop.style.display = "none";
    }
  });
}

/* 阅读控制 */
window.adjustFs = function(delta){
  state.fontSize = Math.min(22, Math.max(14, state.fontSize + delta));
  var b = $("#reader-body");
  if(b) b.style.setProperty("--reader-fs", state.fontSize + "px");
  save();
};
window.adjustLh = function(delta){
  state.lineHeight = Math.min(2.2, Math.max(1.5, +(state.lineHeight + delta).toFixed(1)));
  var b = $("#reader-body");
  if(b) b.style.setProperty("--reader-lh", state.lineHeight);
  save();
};
window.goChapter = function(delta){
  var book = DATA.books.filter(function(b){ return b.id===state.currentBookId; })[0] || DATA.books[0];
  var len = book.chapters.length;
  state.chapterIdx = Math.min(len-1, Math.max(0, state.chapterIdx + delta));
  localStorage.setItem("ab-chapter", String(state.chapterIdx));
  var container = $("#main-view") || $("#page-body");
  if(container) renderReader(container, state.currentBookId);
};

/* ==================== 检索页 ==================== */
function renderSearch(main){
  var kw = state.searchKeyword || "不亦说乎";
  // 检索过滤（标题/章节/正文模拟）
  var results = [];
  DATA.books.forEach(function(b){
    if(b.title.indexOf(kw) > -1 || b.chapters.some(function(c){ return c.indexOf(kw)>-1; })){
      results.push({
        book: b.title, chapter: b.chapters[0], path: "首页 > "+b.category+" > "+b.title,
        snippet: "「"+b.chapters[0]+"」："+ (getChapterText(b,0).replace(/<[^>]+>/g,"").substring(0,60)) + "…",
        score: 96
      });
    }
  });
  // 人物匹配
  DATA.characters.forEach(function(p){
    if(p.name.indexOf(kw) > -1 || (p.zi&&p.zi.indexOf(kw)>-1)){
      results.push({ book:p.name, chapter:"人物档案", path:"考据 > "+p.dynasty, snippet: p.desc, score: 90 });
    }
  });
  if(!results.length){
    results = DATA.searchDemo.results.map(function(r){
      return { book:r.book, chapter:r.chapter, path:r.path, snippet:r.snippet, score:r.score };
    });
  }
  var listHtml = results.slice(0,12).map(function(r){
    var hlSnippet = esc(r.snippet);
    hlSnippet = hlSnippet.split(kw).join("<mark>"+esc(kw)+"</mark>");
    return '<div class="search-result-item fade-in">'+
      '<div class="result-title"><a href="#page-book-list">'+toSimplified(r.book)+' · '+toSimplified(r.chapter)+'</a></div>'+
      '<div class="path-info"><span>'+toSimplified(r.path)+'</span><span class="score-badge">'+r.score+'</span></div>'+
      '<div class="snippet">'+toSimplified(hlSnippet)+'</div>'+
    '</div>';
  }).join("");

  var cats = DATA.categories.map(function(c){
    return '<option value="'+esc(c.name)+'">'+esc(c.name)+'</option>';
  }).join("");

  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('检索')+'</span></div>'+
      '<div class="search-box" style="max-width:700px;margin-bottom:24px;">'+
        '<input class="input-text" id="search-input" value="'+esc(kw)+'" placeholder="'+toSimplified('输入关键词，如：论语、仁义、孔子')+'">'+
        '<button class="btn btn-primary search-btn" id="search-btn">'+toSimplified('搜索')+'</button>'+
      '</div>'+
      '<div class="filter-panel">'+
        '<select id="filter-cat"><option value="全部馆藏">'+toSimplified('全部馆藏')+'</option>'+cats+'</select>'+
        '<select id="filter-dynasty"><option value="全部朝代">'+toSimplified('全部朝代')+'</option><option>春秋</option><option>战国</option><option>西汉</option><option>唐</option><option>宋</option><option>明</option></select>'+
      '</div>'+
      '<div class="search-stat">'+toSimplified('关键词「')+esc(kw)+toSimplified('」共命中 ')+ results.length + toSimplified(' 条结果')+'</div>'+
      (listHtml || '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">'+toSimplified('未找到相关内容')+'</div><div>'+toSimplified('请尝试更换关键词或减少筛选条件')+'</div></div>')+
    '</section>';

  var inp = $("#search-input");
  var btn = $("#search-btn");
  function doSearch(){
    if(inp && inp.value.trim()){
      state.searchKeyword = inp.value.trim();
      renderSearch($("#main-view"));
    }
  }
  if(btn) btn.addEventListener("click", doSearch);
  if(inp) inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
  $("#filter-cat").addEventListener("change", function(){ state.filterCategory=this.value; renderSearch($("#main-view")); });
  bindFadeIn(main);
}

/* ==================== 人物考据页 ==================== */
function renderCharacter(main){
  var kw = state.searchKeyword || "";
  var list = DATA.characters.filter(function(p){
    return !kw || p.name.indexOf(kw)>-1 || (p.zi&&p.zi.indexOf(kw)>-1) || (p.alias&&p.alias.indexOf(kw)>-1);
  });
  var cards = list.slice(0,8).map(function(p){
    return '<div class="character-card fade-in" style="margin-bottom:16px;">'+
      '<div class="char-name">'+toSimplified(p.name)+'<span class="char-zi">'+toSimplified((p.zi?"字"+p.zi:"")+(p.alias?" · "+p.alias:""))+'</span></div>'+
      '<div class="info-row"><label>朝代</label>'+toSimplified(p.dynasty)+'</div>'+
      '<div class="info-row"><label>籍贯</label>'+toSimplified(p.native)+'</div>'+
      '<div class="info-row"><label>生卒</label>'+toSimplified(p.birth+' — '+p.death)+'</div>'+
      '<div class="info-row"><label>官职</label>'+toSimplified(p.office)+'</div>'+
      '<div class="info-row">'+(p.tags||[]).map(function(t){ return '<span class="tag tag-hover">'+toSimplified(t)+'</span>'; }).join("")+'</div>'+
      '<div class="info-row" style="color:var(--color-text-secondary);font-size:14px;">'+toSimplified(p.desc)+'</div>'+
      '<div class="info-row"><label>文献</label>'+toSimplified(p.books.join("、"))+'</div>'+
    '</div>';
  }).join("");
  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('人物考据')+'</span></div>'+
      '<h2 style="margin-bottom:8px;">'+toSimplified('历史人物考据')+'</h2>'+
      '<p style="color:var(--color-text-secondary);margin-bottom:24px;">'+toSimplified('数据源：哈佛CBDB、中研院史语所、北大公开学术数据集')+'</p>'+
      '<div class="search-box" style="max-width:560px;margin-bottom:24px;">'+
        '<input class="input-text" id="char-input" placeholder="'+toSimplified('检索人物姓名/字号')+'" value="'+esc(kw)+'">'+
        '<button class="btn btn-primary search-btn" id="char-btn">'+toSimplified('检索')+'</button>'+
      '</div>'+
      cards+
    '</section>';
  var inp = $("#char-input"), btn = $("#char-btn");
  function doSearch(){
    state.searchKeyword = inp.value.trim();
    renderCharacter($("#main-view"));
  }
  if(btn) btn.addEventListener("click", doSearch);
  if(inp) inp.addEventListener("keydown", function(e){ if(e.key==="Enter") doSearch(); });
  bindFadeIn(main);
}

/* ==================== 社会关系页 ==================== */
function renderRelation(main){
  var list = DATA.relations.slice(0,10).map(function(r){
    return '<div class="relation-item fade-in">'+
      '<div><span class="rel-a">'+toSimplified(r.a)+'</span><span class="rel-type">'+toSimplified(r.type)+'</span><span class="rel-a" style="margin-left:10px;">'+toSimplified(r.b)+'</span></div>'+
      '<div class="info-row" style="margin-top:8px;color:var(--color-text);">'+toSimplified(r.detail)+'</div>'+
      '<div class="rel-source">📖 '+toSimplified('史料出处：')+esc(r.source)+'</div>'+
    '</div>';
  }).join("");
  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('社会关系溯源')+'</span></div>'+
      '<h2 style="margin-bottom:8px;">'+toSimplified('社会关系溯源')+'</h2>'+
      '<p style="color:var(--color-text-secondary);margin-bottom:24px;">'+toSimplified('师生 · 同僚 · 交游 · 亲族 · 思想传承，支持双人关系查询')+'</p>'+
      '<div class="relation-form">'+
        '<input class="input-text" id="rel-a" placeholder="'+toSimplified('人物A（如：孔子）')+'">'+
        '<input class="input-text" id="rel-b" placeholder="'+toSimplified('人物B（如：颜回）')+'">'+
        '<button class="btn btn-primary" id="rel-btn">'+toSimplified('查询关系')+'</button>'+
      '</div>'+
      '<div class="relation-type">'+
        DATA.relations.map(function(r){ return r.type; }).filter(function(v,i,a){return a.indexOf(v)===i;}).slice(0,6).map(function(t){
          return '<span class="tag tag-hover" style="cursor:pointer;">'+toSimplified(t)+'</span>';
        }).join("")+
      '</div>'+
      list+
    '</section>';
  $("#rel-btn").addEventListener("click", function(){
    var a = $("#rel-a").value.trim(), b = $("#rel-b").value.trim();
    if(!a && !b) return;
    var found = DATA.relations.filter(function(r){
      return (!a || r.a===a || r.b===a) && (!b || r.a===b || r.b===b);
    });
    if(found.length){
      var r = found[0];
      alert(toSimplified(r.a+" 与 "+r.b+" 的关系：")+r.type+"\n"+toSimplified("史料出处：")+r.source);
    }else{
      alert(toSimplified("暂未检索到相关关系记录"));
    }
  });
  bindFadeIn(main);
}

/* ==================== 帮助页 ==================== */
function renderHelp(main){
  main.innerHTML =
    '<section>'+
      '<div class="breadcrumb"><a href="#page-home">'+toSimplified('首页')+'</a><span class="sep">/</span><span>'+toSimplified('帮助')+'</span></div>'+
      '<h2 style="margin-bottom:24px;">'+toSimplified('使用教程与合规声明')+'</h2>'+
      '<div class="character-card" style="margin-bottom:16px;">'+
        '<div class="char-name" style="font-size:17px;">'+toSimplified('📖 使用教程')+'</div>'+
        '<div class="info-row">· '+toSimplified('全文检索：输入关键词，支持标题/全文双模式，结果按权重排序')+'</div>'+
        '<div class="info-row">· '+toSimplified('繁简切换：导航栏「繁简」按钮，正文实时转换，繁体100%保真')+'</div>'+
        '<div class="info-row">· '+toSimplified('主题切换：日间/护眼/深色三套阅读主题')+'</div>'+
        '<div class="info-row">· '+toSimplified('分片阅读：超大文本按章节分片加载，进度自动记忆')+'</div>'+
        '<div class="info-row">· '+toSimplified('生僻字：点击正文标注的古字，弹窗查看注音释义')+'</div>'+
        '<div class="info-row">· '+toSimplified('字号行距：阅读页工具栏自由调节')+'</div>'+
      '</div>'+
      '<div class="character-card" style="margin-bottom:16px;">'+
        '<div class="char-name" style="font-size:17px;">'+toSimplified('🤝 开源共建')+'</div>'+
        '<div class="info-row">· '+toSimplified('志愿者招募：文本校对、古字纠错、索引优化')+'</div>'+
        '<div class="info-row">· '+toSimplified('反馈渠道：官方意见反馈入口（GitHub Issues）')+'</div>'+
        '<div class="info-row">· '+toSimplified('项目开源：MIT协议，持续社区共建迭代')+'</div>'+
      '</div>'+
      '<div class="character-card">'+
        '<div class="char-name" style="font-size:17px;">'+toSimplified('⚖️ 合规声明')+'</div>'+
        '<div class="info-row">· '+toSimplified('古籍资源源自殆知阁开源仓库，仅供学术研究与文化传播')+'</div>'+
        '<div class="info-row">· '+toSimplified('禁止商用、禁止二次售卖、禁止篡改后伪造成原创资料')+'</div>'+
        '<div class="info-row">· '+toSimplified('人物数据源自哈佛CBDB、中研院、北大公开学术数据集')+'</div>'+
        '<div class="info-row">· '+toSimplified('本项目为公益开源项目，无广告、无注册、无付费、无隐私收集')+'</div>'+
      '</div>'+
    '</section>';
}

/* ==================== 独立页面模式 ==================== */
var PAGE_RENDERERS = {
  "home": renderHome,
  "category": renderCategory,
  "book-list": renderBookList,
  "read": renderReader,
  "search": renderSearch,
  "character": renderCharacter,
  "relation": renderRelation,
  "help": renderHelp
};
function initStandalone(){
  // pages/*.html 独立页面：body 带 data-page 属性，读取对应区块渲染到 #page-body
  var page = document.body.getAttribute("data-page");
  if(!page) return;
  var container = $("#page-body");
  if(!container) return;
  var fn = PAGE_RENDERERS[page];
  if(fn){
    if(page === "read"){
      renderReader(container, state.currentBookId);
    }else{
      fn(container);
    }
    bindFadeIn(container);
  }
}

/* ==================== 启动 ==================== */
function boot(){
  initGlobal();
  var main = $("#main-view");
  if(main){
    window.addEventListener("hashchange", function(){
      renderRoute(main);
      // 高亮导航
      var current = location.hash.replace("#page-","").replace(/\/.*/,"") || "home";
      $$(".nav-menu a, .mobile-menu a").forEach(function(a){
        var href = a.getAttribute("href");
        a.classList.toggle("active", href && href.indexOf(current) > -1);
      });
      var menu = $("#mobile-menu");
      if(menu) menu.classList.remove("open");
    });
    renderRoute(main);
  }
  initStandalone();
}

document.addEventListener("DOMContentLoaded", boot);
if(document.readyState === "complete" || document.readyState === "interactive") boot();
})();
