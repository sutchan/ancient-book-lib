// app/help/page.tsx v1.4.3
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "帮助与说明｜古籍通 AncientBook",
  description: "古籍通使用帮助：如何检索、浏览与在线阅读古籍，繁简对照、字号主题设置、下载与书单导出、阅读历史，以及常见问题 FAQ。",
};

export default function HelpPage() {
  return (
    <section>
      <div className="breadcrumb">
        <Link href="/">首页</Link>
        <span className="sep">/</span>
        <span>帮助与说明</span>
      </div>
      <h2 style={{ marginBottom: 8 }}>帮助与说明</h2>
      <p style={{ color: "var(--color-text-secondary)", marginBottom: 20, fontSize: 15 }}>
        本页面向读者，介绍如何检索、浏览与在线阅读古籍，以及主题、繁简、下载等常用功能。如需技术架构或贡献说明，请参阅 <Link href="/data-source">数据来源</Link> 与仓库 README。
      </p>

      {/* 快速上手 */}
      <div className="card stat-panel" style={{ lineHeight: 1.9, fontSize: 15, marginBottom: 24 }}>
        <strong>三步开始阅读：</strong>
        <ol style={{ paddingLeft: 22, margin: "6px 0 0" }}>
          <li>在首页或 <Link href="/search">检索</Link> 页输入关键词（如「论语」「仁义」）查找古籍；</li>
          <li>在 <Link href="/catalog">全馆藏</Link> 中按馆藏分类浏览 15,694 部书目；</li>
          <li>点击任意书籍的「阅读」，即可在线阅读，支持繁简对照、字号调节与下载。</li>
        </ol>
      </div>

      {/* 锚点导航 */}
      <div className="card" style={{ padding: "14px 18px", marginBottom: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[
          ["#search", "检索古籍"],
          ["#catalog", "浏览全馆藏"],
          ["#read", "在线阅读"],
          ["#settings", "繁简与主题"],
          ["#history", "阅读历史与下载"],
          ["#tools", "考据与统计"],
          ["#faq", "常见问题"],
          ["#legal", "相关说明"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="tag" style={{ textDecoration: "none" }}>{label}</a>
        ))}
      </div>

      {/* 一、检索 */}
      <h3 className="section-title" id="search">一、检索古籍</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p>进入 <Link href="/search">检索</Link> 页，输入关键词后按「搜索」即可。检索提供两种模式：</p>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>全文检索</strong>：在古籍正文中查找关键词，命中片段高亮。若站点尚未生成全文索引，会自动回退为「标题检索」并给出提示。</li>
          <li><strong>标题检索</strong>：仅在书名中匹配，速度快、结果更聚焦。</li>
        </ul>
        <p>检索结果可按 <strong>馆藏</strong> 筛选，并选择每页显示 10 / 20 / 50 条。点击结果书名即可进入在线阅读。</p>
      </div>

      {/* 二、浏览全馆藏 */}
      <h3 className="section-title" id="catalog">二、浏览全馆藏</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p><Link href="/catalog">全馆藏</Link> 收录殆知阁 v20 全量 <strong>15,694 部</strong>古籍书目索引（约 5.7 MB，随本站一同加载）。你可以：</p>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>书名搜索</strong>：输入框输入书名片段（如「金刚经」「史记」），250 毫秒防抖后实时过滤。</li>
          <li><strong>馆藏筛选</strong>：点击顶部标签按十大藏库（儒藏、史藏、子藏、集藏、佛藏、道藏、医藏、易藏、艺藏、诗藏）浏览，并支持二级子类进一步收窄。</li>
          <li><strong>分页浏览</strong>：每页 50 部，便于逐页翻阅。</li>
          <li><strong>导出书单</strong>：点击「导出书单（含原文直链）」可将当前筛选结果导出为 CSV，含书名、馆藏、子类、大小与原文直链，便于离线整理（不含正文，符合零复制架构）。</li>
        </ul>
      </div>

      {/* 三、在线阅读 */}
      <h3 className="section-title" id="read">三、在线阅读</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p>点击书籍的「阅读」进入阅读页。原文按需从上游仓库（殆知阁）加载，不预取全量数据：</p>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>分片懒加载</strong>：超大古籍按章节字节区间（HTTP Range）逐段拉取，首屏仅加载当前章节，目录可快速跳转。</li>
          <li><strong>本地缓存</strong>：较小书籍整本下载后存入浏览器 IndexedDB（上限 100 MB，按最近使用自动淘汰），再次打开秒开、无需重下。</li>
          <li><strong>大文件提示</strong>：原文超过约 5 MB 时会先弹出提示，建议在 Wi‑Fi 下阅读；确认后仍可在线阅读或一键打开上游原文另存为。</li>
          <li><strong>阅读工具栏</strong>：
            <ul style={{ paddingLeft: 20, margin: "2px 0" }}>
              <li>「A− / A＋」调节<strong>字号</strong>（14–22 px）；</li>
              <li>「－ / ＋」调节<strong>行距</strong>（1.5–2.4）；</li>
              <li>勾选<strong>简体对照</strong>：在保留繁体原文的同时叠加简体显示（见下方说明）；</li>
              <li>「下载本书」：将当前书籍导出为 TXT（带 UTF‑8 BOM，Windows 记事本可直接打开），并附非商用免责声明。</li>
            </ul>
          </li>
          <li><strong>章节与分页</strong>：左侧/上方目录切换章节，正文按 8 段分页，底部可翻页。</li>
          <li><strong>阅读进度</strong>：自动保存在本机（按书籍记录章节与页码），下次打开自动恢复到上次位置。</li>
          <li><strong>划词检索</strong>：在正文中选中不超过 30 字的内容，会浮现「检索」按钮，点击即以该词发起全文检索。</li>
        </ul>
      </div>

      {/* 四、全局设置 */}
      <h3 className="section-title" id="settings">四、繁简切换与主题</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p>右上角提供两个全局开关：</p>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>繁简切换</strong>：在「简体 / 繁體」间切换，全站界面与阅读正文（简体对照）同步变化，选择会记住。</li>
          <li><strong>主题切换</strong>：在「日间 / 护眼（纸感）/ 深色」三套主题间循环，偏好自动保存。</li>
        </ul>
        <p>两者均保存在本机浏览器，不会上传，清除浏览器数据后会恢复默认。</p>
      </div>

      {/* 五、历史与下载 */}
      <h3 className="section-title" id="history">五、阅读历史与书单导出</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>最近阅读</strong>：首页「最近阅读」展示本机最近打开的 10 部书（基于浏览器本地记录），点击可继续阅读。</li>
          <li><strong>单本下载</strong>：阅读页「下载本书」导出当前书 TXT，按当前繁简设置生成对应版本。</li>
          <li><strong>书单导出</strong>：全馆藏页可将筛选结果导出为含原文直链的 CSV，方便自行批量获取。</li>
        </ul>
        <p>所有下载均附「仅供学术研究与个人学习、禁止商用」的免责声明。古籍原文版权归上游数据源所有。</p>
      </div>

      {/* 六、考据与统计 */}
      <h3 className="section-title" id="tools">六、人物考据、社会关系与数据统计</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><strong>人物库</strong>：已接入 CBDB 全量 661,350 位历代人物（姓名、拼音、生卒年、指数年、性别、朝代、籍贯），支持人名搜索、朝代筛选与姓氏浏览；详情页含生平任职（59.1 万条）与人物关系，可一键在古籍中检索该人物。</li>
          <li><strong>人物考据</strong>：精选 28 位历史名人档案（字、号、籍贯、生卒、官职、著作与史料出处），支持重名人物按朝代+籍贯+官职多维区分。</li>
          <li><strong>社会关系</strong>：已接入 CBDB 亲属关系 56.1 万条与社会关系 19 万条，支持按人物查看关系网络与双人溯源（直接/2-3 级中间关系，深度可选）。</li>
          <li><strong>数据统计</strong>：已可查看馆藏规模、十大藏库分布、人物朝代分布、关系与任职概览，以及人物籍贯分布（按朝代筛选省/道/路）与官职-朝代联动分析。</li>
        </ul>
        <p>以上标注「待接入」的模块当前为占位，功能上线后无需更换网址即可使用。</p>
      </div>

      {/* FAQ */}
      <h3 className="section-title" id="faq">常见问题 FAQ</h3>
      <div className="card stat-panel" style={{ lineHeight: 1.95, fontSize: 15 }}>
        <p><strong>Q：怎么开始阅读一本书？</strong></p>
        <p>A：在首页或检索页输入关键词找书，或在全馆藏按馆藏分类浏览；点击书籍的「阅读」按钮即可在线打开。也可从首页「最近阅读」快速继续上次未读完的书。</p>

        <p><strong>Q：全文检索和标题检索有什么区别？为什么有时自动变成标题检索？</strong></p>
        <p>A：标题检索只在书名中匹配，速度快；全文检索会扫描正文。全文检索依赖构建期预生成的全文索引，若站点尚未生成该索引，系统会自动回退为标题检索并提示。如需正文检索，可等待索引构建完成或自行运行 <code style={{ background: "var(--color-highlight)", padding: "1px 6px", borderRadius: 4 }}>npm run build:fulltext</code>。</p>

        <p><strong>Q：检索不到内容怎么办？</strong></p>
        <p>A：请尝试：① 缩短或更换关键词；② 切换到「标题检索」；③ 减少馆藏筛选条件；④ 确认输入的是古籍常用写法（可结合繁简切换试试）。部分生僻书以书名检索更准。</p>

        <p><strong>Q：为什么有的书加载慢，还会弹出「大文件提示」？</strong></p>
        <p>A：原文体积越大（超过约 5 MB）加载越久。站点会先提示你确认，建议在 Wi‑Fi 下阅读；加载后内容会缓存在本机，下次秒开。超大书采用分片懒加载，只取当前章节，不必等待全书下载。</p>

        <p><strong>Q：「简体对照」会修改原文吗？会不会丢失内容？</strong></p>
        <p>A：不会。简体对照仅按字对字将繁体映射为简体显示，原文内容完整保留，古籍用字、异体字均不改动；关闭对照即恢复繁体原貌。它只是阅读时的显示辅助，不影响下载所得的文件。</p>

        <p><strong>Q：我的阅读进度会保存吗？换设备/换浏览器还在吗？</strong></p>
        <p>A：进度按书籍保存在<strong>当前浏览器</strong>本地（章节与页码）。同一浏览器再次打开会自动恢复。但它不跨设备、不跨浏览器同步——换设备或清除了浏览器数据，进度会重置。</p>

        <p><strong>Q：怎么调整字体大小和行距？</strong></p>
        <p>A：进入阅读页后，使用顶部工具栏的「A− / A＋」调整字号、「－ / ＋」调整行距，设置即时生效。</p>

        <p><strong>Q：怎么下载或保存古籍原文？书单导出是什么？</strong></p>
        <p>A：阅读页点「下载本书」可将当前书导出为 TXT（含免责声明）；全馆藏页点「导出书单（含原文直链）」可把筛选结果导出为 CSV，里面是书名与上游原文直链，方便你自行批量获取，不含正文本身。</p>

        <p><strong>Q：划词检索怎么用？</strong></p>
        <p>A：在正文中用鼠标选中一段文字（不超过 30 字），附近会浮现「检索」按钮，点击即以该词发起全文检索，便于顺藤摸瓜。</p>

        <p><strong>Q：繁简切换和主题切换的设置会保存吗？</strong></p>
        <p>A：会。两者都保存在本机浏览器，下次访问自动沿用；清除浏览器数据后恢复默认。</p>

        <p><strong>Q：网站是免费的吗？未来会收费吗？</strong></p>
        <p>A：本站为开源公益项目，检索、阅读、下载均免费，无广告。暂无任何收费计划。</p>

        <p><strong>Q：需要用 App 还是可以手机浏览器直接看？</strong></p>
        <p>A：无需安装 App，手机浏览器直接访问即可使用，界面已做响应式适配；顶部菜单在窄屏会收起为汉堡菜单。</p>

        <p><strong>Q：看到乱码或生僻字无法正常显示怎么办？</strong></p>
        <p>A：请确认使用较新的浏览器（Chrome / Edge / Safari / Firefox 等），并确保系统装有中文字体。原文为 UTF‑8 编码、下载文件带 BOM，Windows 记事本也能正确识别。个别极生僻字若设备缺字库可能显示为方框，属系统字体限制而非数据缺失。</p>

        <p><strong>Q：人物库的 66 万人物数据是哪来的？准确吗？</strong></p>
        <p>A：来自 CBDB（中国历代人物传记资料库，哈佛大学/北京大学/中研院合作项目）官方 SQLite 数据包（2026-09-05 版，661,350 人）。数据按姓氏分片索引后存入本仓库，原始数据仍托管于 CBDB 官方仓库，未做任何虚构或篡改；「指数年」为 CBDB 推算的编年基准，并非真实出生年。</p>

        <p><strong>Q：人物考据、社会关系、数据统计为什么显示「待接入」？</strong></p>
        <p>A：该提示已基本消除——人物库（66 万 CBDB 人物）、人物考据（28 位名人）、社会关系（亲属 56.1 万条 + 社会 19 万条）、生平任职（59.1 万条）、数据统计（含籍贯分布与官职-朝代联动）均已接入真实数据。双人溯源支持直接关系与 2-3 级中间关系，默认二级，三级探索较慢但覆盖更广。</p>

        <p><strong>Q：为什么网站需要联网才能读原文？为什么不用数据库？</strong></p>
        <p>A：古籍原文（约 4.9 GB）托管在上游仓库，本站采用「零复制」架构——只存 5.7 MB 书目索引，阅读时按需拉取原文，因此必须联网。省去数据库既避免体积膨胀与付费托管，也契合纯静态、可免费托管的定位；目录级检索已在前端内存中毫秒返回。</p>

        <p><strong>Q：古籍版权归谁？可以商用吗？</strong></p>
        <p>A：古籍原文为公有领域资源，版权归原始数据源所有；整理文本遵循上游授权协议。本站资源<strong>仅供学术研究与个人学习</strong>，商用或二次售卖需自行核实版权状态并获授权。</p>

        <p><strong>Q：你们会收集我的个人信息吗？怎么关闭统计？</strong></p>
        <p>A：本站使用 Google Analytics 4 进行匿名访问统计（仅页面浏览量、来源、设备类型），已开启 IP 匿名化，不采集姓名、账号、联系方式等个人身份信息。你在浏览器隐私设置中屏蔽第三方 Cookie 即可停止统计。</p>
      </div>

      {/* 相关说明 */}
      <h3 className="section-title" id="legal">相关说明（开源协议 / 数据来源 / 免责声明 / 反馈）</h3>
      <div className="card stat-panel" style={{ lineHeight: 2, fontSize: 15 }}>
        <p>本站运营相关的详细声明已拆分为独立页面，便于查阅与引用：</p>
        <ul style={{ paddingLeft: 20, margin: "4px 0" }}>
          <li><Link href="/license">开源协议</Link>：代码 MIT 协议、古籍公有领域与上游授权、非商用定位。</li>
          <li><Link href="/data-source">数据来源</Link>：殆知阁 v20 书目原文、CBDB 全量人物库与人物考据等数据源与溯源。</li>
          <li><Link href="/disclaimer">免责声明</Link>：非商用、内容仅供参考、使用责任归属。</li>
          <li><Link href="/feedback">反馈渠道</Link>：勘误、建议与问题反馈方式。</li>
        </ul>
      </div>
    </section>
  );
}
