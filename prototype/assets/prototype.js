/**
 * 古籍通原型交互脚本 prototype.js
 * 功能：主题切换、繁简切换、hash路由模拟、模拟数据渲染
 */
const state = {
  theme: "light",
  simplified: true
};

// 主题切换
const btnTheme = document.getElementById("btn-theme");
const btnSimplified = document.getElementById("btn-toggle-simplified");
const body = document.body;

btnTheme.addEventListener("click", ()=>{
  const list = ["light","paper","dark"];
  let idx = list.indexOf(state.theme);
  idx = (idx+1) % list.length;
  state.theme = list[idx];
  body.setAttribute("data-theme", state.theme);
});

btnSimplified.addEventListener("click",()=>{
  state.simplified = !state.simplified;
  btnSimplified.innerText = state.simplified ? "繁体" : "简体";
});

// 模拟页面渲染（原型内路由）
const mainView = document.getElementById("main-view");

const categories = [
  { name:"佛藏", desc:"佛家经典" },
  { name:"儒藏", desc:"儒家经典" },
  { name:"医藏", desc:"医学方书" },
  { name:"史藏", desc:"史书地理" },
  { name:"子藏", desc:"诸子百家" },
  { name:"易藏", desc:"易学典籍" },
  { name:"艺藏", desc:"艺术典籍" },
  { name:"诗藏", desc:"诗词总集" },
  { name:"道藏", desc:"道家典籍" },
  { name:"集藏", desc:"文集总集" }
];

function renderPage(hash){
  if(!hash || hash === "#page-home" || hash === "#"){
    mainView.innerHTML = `
      <section>
        <div style="text-align:center;margin:60px 0;">
          <h1 style="margin-bottom:16px;">古籍通</h1>
          <p style="color:var(--color-text-secondary);margin-bottom:32px;">开源公益古籍阅读与考据平台</p>
          <div class="search-box" style="max-width:600px;margin:0 auto;">
            <input class="input-text" placeholder="检索古籍书名、内容、人物">
            <button class="btn btn-primary">搜索</button>
          </div>
        </div>
        <h2 style="margin-bottom:16px;">馆藏分类</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${categories.map(c=>`
            <div class="card"><div class="card-body">
              <h4>${c.name}</h4>
              <p class="desc-note" style="color:var(--color-text-secondary);font-size:14px;margin-top:6px;">${c.desc}</p>
            </div></div>`).join("")}
        </div>
        <h2 style="margin:40px 0 16px;">学术工具</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          <div class="card"><div class="card-body"><h4>人物考据</h4><p style="color:var(--color-text-secondary);font-size:14px;margin-top:6px;">历史人物档案与史料聚合</p></div></div>
          <div class="card"><div class="card-body"><h4>社会关系溯源</h4><p style="color:var(--color-text-secondary);font-size:14px;margin-top:6px;">人物关系与双人溯源</p></div></div>
        </div>
      </section>
    `;
  }else if(hash === "#page-category"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><span>馆藏分类</span></div>
        <h2 style="margin-bottom:8px;">十大馆藏</h2>
        <p style="color:var(--color-text-secondary);margin-bottom:24px;">佛、儒、医、史、子、易、艺、诗、道、集十大正统古籍文库</p>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${categories.map(c=>`
            <div class="card"><div class="card-body">
              <h4>${c.name}</h4>
              <p style="color:var(--color-text-secondary);font-size:14px;margin-top:6px;">${c.desc}</p>
            </div></div>`).join("")}
        </div>
      </section>
    `;
  }else if(hash === "#page-search"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><span>检索</span></div>
        <div class="search-box" style="max-width:700px;margin-bottom:32px;">
          <input class="input-text" placeholder="输入关键词，如：论语、仁义、孔子">
          <button class="btn btn-primary">搜索</button>
        </div>
        <div class="search-result-item">
          <h4><a href="#page-read">论语·学而篇</a></h4>
          <div class="path-info">首页 &gt; 儒藏 &gt; 论语</div>
          <div class="snippet">子曰：学而时习之，<mark>不亦说乎</mark>？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？</div>
        </div>
        <div class="search-result-item">
          <h4><a href="#page-read">论语·为政篇</a></h4>
          <div class="path-info">首页 &gt; 儒藏 &gt; 论语</div>
          <div class="snippet">子曰：<mark>为政</mark>以德，譬如北辰，居其所而众星共之。</div>
        </div>
      </section>
    `;
  }else if(hash === "#page-read"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><a href="#page-category">儒藏</a><span>/</span><span>论语·学而篇</span></div>
        <div style="text-align:center;margin-bottom:32px;">
          <h2>论语·学而篇第一</h2>
          <p style="color:var(--color-text-secondary);margin-top:8px;">春秋 · 孔子弟子及再传弟子</p>
        </div>
        <div style="max-width:720px;margin:0 auto;line-height:1.8;font-size:16px;">
          <p style="margin-bottom:1rem;">子曰：「学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？」</p>
          <p style="margin-bottom:1rem;">有子曰：「其为人也孝弟，而好犯上者，鲜矣；不好犯上，而好作乱者，未之有也。君子务本，本立而道生。孝弟也者，其为仁之本与！」</p>
          <p style="margin-bottom:1rem;">子曰：「巧言令色，鲜矣仁！」</p>
        </div>
        <div style="display:flex;justify-content:space-between;max-width:720px;margin:32px auto;">
          <button class="btn btn-secondary">上一章</button>
          <button class="btn btn-primary">下一章</button>
        </div>
      </section>
    `;
  }else if(hash === "#page-character"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><span>人物考据</span></div>
        <div class="character-card" style="max-width:720px;">
          <h3>孔子｜孔丘</h3>
          <div class="info-row"><label>朝代：</label>春秋</div>
          <div class="info-row"><label>籍贯：</label>鲁国陬邑</div>
          <div class="info-row"><label>生卒：</label>公元前551年—公元前479年</div>
          <div class="info-row"><label>主要官职：</label>鲁国大司寇、摄相事</div>
        </div>
        <h3 style="margin:32px 0 16px;">关联古籍文献</h3>
        <div class="book-item"><a href="#page-read">论语</a><div class="meta">儒藏 · 春秋时期</div></div>
        <div class="book-item"><a href="#page-read">春秋</a><div class="meta">史藏 · 春秋时期</div></div>
      </section>
    `;
  }else if(hash === "#page-relation"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><span>社会关系</span></div>
        <h2 style="margin-bottom:16px;">双人关系查询</h2>
        <div class="search-box" style="max-width:700px;margin-bottom:32px;">
          <input class="input-text" placeholder="人物A（如：孔子）">
          <input class="input-text" placeholder="人物B（如：颜回）">
          <button class="btn btn-primary">查询</button>
        </div>
        <div class="character-card" style="max-width:720px;">
          <h3>孔子 — 颜回</h3>
          <div class="info-row"><label>关系：</label>师生（师徒）</div>
          <div class="info-row"><label>史料出处：</label>《论语·先进》《史记·仲尼弟子列传》</div>
          <div class="info-row"><label>关系说明：</label>颜回为孔子最得意门生，孔子赞其「贤哉回也」。</div>
        </div>
      </section>
    `;
  }else if(hash === "#page-help"){
    mainView.innerHTML = `
      <section>
        <div class="breadcrumb"><a href="#page-home">首页</a><span>/</span><span>帮助</span></div>
        <h2 style="margin-bottom:24px;">使用教程与合规声明</h2>
        <div class="character-card" style="margin-bottom:16px;">
          <h3>使用教程</h3>
          <div class="info-row">· 检索：输入关键词，支持标题/全文双模式</div>
          <div class="info-row">· 双语切换：导航栏「繁简」按钮一键切换</div>
          <div class="info-row">· 主题切换：日间/护眼/深色三套主题</div>
          <div class="info-row">· 分片阅读：超大文本按章节分片加载</div>
        </div>
        <div class="character-card">
          <h3>合规声明</h3>
          <div class="info-row">· 古籍资源源自开源仓库，仅供学术研究与文化传播</div>
          <div class="info-row">· 禁止商用、禁止二次售卖、禁止篡改后伪造成原创资料</div>
          <div class="info-row">· 人物数据源自哈佛CBDB公开学术数据集</div>
          <div class="info-row">· 本项目为公益开源项目，无广告、无注册、无付费</div>
        </div>
      </section>
    `;
  }else{
    mainView.innerHTML = `<div class="empty-state">原型页面 ${hash}，完整页面在 prototype/pages/*.html</div>`;
  }
}

window.addEventListener("hashchange",()=>renderPage(location.hash));
renderPage(location.hash);
