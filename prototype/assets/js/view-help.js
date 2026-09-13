/**
 * 原型帮助视图 v2.3
 * 职责：对齐正式站 app/help（三步开始 + 锚点导航 + 六节 + 常见问题 FAQ + 相关说明）
 * 原型为演示，FAQ 取正式站核心条目；结构/术语与正式站一致
 */
(function (AB) {
  "use strict";

  function renderHelp(main) {
    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('帮助') + '</span></div>' +
        '<h2 id="help-title" style="margin-bottom:20px;">' + AB.toSimplified('帮助与说明') + '</h2>' +
        '<p style="color:var(--color-text-secondary);margin-bottom:20px;font-size:15px;">' +
          AB.toSimplified('本页面向读者，介绍如何检索、浏览与在线阅读古籍，以及主题、繁简、下载等常用功能。') + '</p>' +

        /* 三步开始阅读 */
        '<div class="card stat-panel" style="line-height:1.9;font-size:15px;margin-bottom:24px;">' +
          '<strong>' + AB.toSimplified('三步开始阅读：') + '</strong>' +
          '<ol style="padding-left:22px;margin:6px 0 0;">' +
            '<li>' + AB.toSimplified('在首页或') + ' <a href="#page-search">' + AB.toSimplified('检索') + '</a> ' + AB.toSimplified('页输入关键词（如「论语」「仁义」）查找古籍；') + '</li>' +
            '<li>' + AB.toSimplified('在') + ' <a href="#page-book-list">' + AB.toSimplified('全馆藏') + '</a> ' + AB.toSimplified('中按馆藏分类浏览 15,694 部书目；') + '</li>' +
            '<li>' + AB.toSimplified('点击任意书籍的「阅读」，即可在线阅读，支持繁简对照、字号调节与下载。') + '</li>' +
          '</ol>' +
        '</div>' +

        /* 锚点导航 */
        '<div class="card" style="padding:14px 18px;margin-bottom:24px;display:flex;flex-wrap:wrap;gap:8px;">' +
          [['#help-search', '检索古籍'], ['#help-catalog', '浏览全馆藏'], ['#help-read', '在线阅读'],
           ['#help-settings', '繁简与主题'], ['#help-history', '书签与导出'], ['#help-tools', '人物库与统计'],
           ['#help-faq', '常见问题'], ['#help-legal', '相关说明']].map(function (a) {
            return '<a href="' + a[0] + '" class="tag" style="text-decoration:none;">' + AB.toSimplified(a[1]) + '</a>';
          }).join("") +
        '</div>' +

        /* 一、检索 */
        '<h3 class="section-title" id="help-search">' + AB.toSimplified('一、检索古籍') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<p>' + AB.toSimplified('进入') + ' <a href="#page-search">' + AB.toSimplified('检索') + '</a> ' + AB.toSimplified('页，输入关键词后按「搜索」即可。检索提供两种模式：') + '</p>' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><strong>' + AB.toSimplified('全文检索') + '</strong>' + AB.toSimplified('：在古籍正文中查找关键词，命中片段高亮。若站点尚未生成全文索引，会自动回退为「标题检索」并给出提示。') + '</li>' +
            '<li><strong>' + AB.toSimplified('标题检索') + '</strong>' + AB.toSimplified('：仅在书名中匹配，速度快、结果更聚焦。') + '</li>' +
          '</ul>' +
          '<p>' + AB.toSimplified('检索结果可按馆藏筛选，并选择每页显示 10 / 20 / 50 条。点击结果书名即可进入在线阅读。') + '</p>' +
        '</div>' +

        /* 二、浏览全馆藏 */
        '<h3 class="section-title" id="help-catalog">' + AB.toSimplified('二、浏览全馆藏') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<p><a href="#page-book-list">' + AB.toSimplified('全馆藏') + '</a>' + AB.toSimplified('收录殆知阁 v20 全量 15,694 部古籍书目索引。你可以：') + '</p>' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li>' + AB.toSimplified('书名搜索：输入书名片段实时过滤；') + '</li>' +
            '<li>' + AB.toSimplified('馆藏筛选：点击顶部标签按十大藏库（儒藏、史藏、子藏、集藏、佛藏、道藏、医藏、易藏、艺藏、诗藏）浏览；') + '</li>' +
            '<li>' + AB.toSimplified('分页浏览与导出书单（含原文直链 CSV）。') + '</li>' +
          '</ul>' +
        '</div>' +

        /* 三、在线阅读 */
        '<h3 class="section-title" id="help-read">' + AB.toSimplified('三、在线阅读') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<p>' + AB.toSimplified('点击书籍的「阅读」进入阅读页。原文按需从上游数据源（殆知阁）加载，不预取全量数据：') + '</p>' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><strong>' + AB.toSimplified('分片懒加载') + '</strong>' + AB.toSimplified('：超大古籍按章节分段逐段拉取，首屏仅加载当前章节。') + '</li>' +
            '<li><strong>' + AB.toSimplified('阅读工具栏') + '</strong>' + AB.toSimplified('：A−/A＋ 调节字号（14–22px）、－/＋ 调节行距（1.5–2.4）、勾选简体对照、下载本书。') + '</li>' +
            '<li><strong>' + AB.toSimplified('阅读进度') + '</strong>' + AB.toSimplified('：自动保存在本机，下次打开自动恢复。') + '</li>' +
            '<li><strong>' + AB.toSimplified('划词检索') + '</strong>' + AB.toSimplified('：选中正文不超过 30 字，浮现「检索」按钮发起全文检索。') + '</li>' +
            '<li><strong>' + AB.toSimplified('收藏与阅读位置书签') + '</strong>' + AB.toSimplified('：阅读页「☆ 收藏」加入书签（导航「书签」页集中管理）；「保存当前位置」记下章节页码，书签面板一键跳回。') + '</li>' +
          '</ul>' +
        '</div>' +

        /* 四、全局设置 */
        '<h3 class="section-title" id="help-settings">' + AB.toSimplified('四、繁简切换与主题') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><strong>' + AB.toSimplified('繁简切换') + '</strong>' + AB.toSimplified('：在「简体 / 繁體」间切换，全站界面与阅读正文同步变化，选择会记住。') + '</li>' +
            '<li><strong>' + AB.toSimplified('主题切换') + '</strong>' + AB.toSimplified('：在「日间 / 护眼（纸感）/ 深色」三套主题间循环，偏好自动保存。') + '</li>' +
          '</ul>' +
          '<p>' + AB.toSimplified('两者均保存在本机浏览器，不会上传，清除浏览器数据后恢复默认。') + '</p>' +
        '</div>' +

        /* 五、书签与导出 */
        '<h3 class="section-title" id="help-history">' + AB.toSimplified('五、阅读历史、书签与导出') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><strong>' + AB.toSimplified('书籍收藏') + '</strong>' + AB.toSimplified('：书名旁的「☆」加入书签；顶部导航「书签」页集中管理（打开 / 移除 / 清空），角标显示收藏数。') + '</li>' +
            '<li><strong>' + AB.toSimplified('阅读位置书签') + '</strong>' + AB.toSimplified('：阅读页点「保存当前位置」记下当前章节与页码，书签面板可一键跳回。') + '</li>' +
            '<li><strong>' + AB.toSimplified('跨设备迁移') + '</strong>' + AB.toSimplified('：书签页支持「导出 / 导入 JSON」，手动迁移到其他浏览器或设备。') + '</li>' +
          '</ul>' +
        '</div>' +

        /* 六、人物库与统计 */
        '<h3 class="section-title" id="help-tools">' + AB.toSimplified('六、人物库、社会关系与数据统计') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;margin-bottom:20px;">' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><strong>' + AB.toSimplified('人物库') + '</strong>' + AB.toSimplified('：已接入 CBDB 全量 661,350 位历代人物，支持人名与别名搜索、朝代筛选与姓氏浏览。') + '</li>' +
            '<li><strong>' + AB.toSimplified('社会关系') + '</strong>' + AB.toSimplified('：已接入 CBDB 亲属关系 56.1 万条与社会关系 19 万条，支持双人溯源。') + '</li>' +
            '<li><strong>' + AB.toSimplified('数据统计') + '</strong>' + AB.toSimplified('：馆藏规模、十大藏库分布、人物朝代分布、关系与任职概览等量化分析。') + '</li>' +
          '</ul>' +
        '</div>' +

        /* FAQ */
        '<h3 class="section-title" id="help-faq">' + AB.toSimplified('常见问题 FAQ') + '</h3>' +
        '<div class="card stat-panel" style="line-height:1.95;font-size:15px;margin-bottom:20px;">' +
          faqItem('怎么开始阅读一本书？', '在首页或检索页输入关键词找书，或在全馆藏按馆藏分类浏览；点击书籍的「阅读」按钮即可在线打开。') +
          faqItem('全文检索和标题检索有什么区别？', '标题检索只在书名中匹配，速度快；全文检索会扫描正文。若全文索引尚未就绪，系统自动回退为标题检索并提示。') +
          faqItem('检索不到内容怎么办？', '请尝试：① 缩短或更换关键词；② 切换「标题检索」；③ 减少馆藏筛选；④ 结合繁简切换试试。') +
          faqItem('为什么有的书加载慢、会弹大文件提示？', '原文越大（>5MB）加载越久；站点先提示确认，建议 Wi-Fi 下阅读。加载后缓存在本机，下次秒开。超大书分片懒加载，只取当前章节。') +
          faqItem('简体对照会修改原文吗？', '不会。仅按字映射显示，原文完整保留，关闭即恢复繁体原貌，不影响下载文件。') +
          faqItem('阅读进度会保存吗？跨设备还在吗？', '进度按书籍保存在当前浏览器本地，自动恢复；不跨设备、不跨账号同步，清数据则重置。') +
          faqItem('怎么下载或保存原文？书单导出是什么？', '阅读页「下载本书」导出 TXT（含免责声明）；全馆藏页「导出书单」导出含原文直链的 CSV，不含正文。') +
          faqItem('网站免费吗？未来收费吗？', '本站为开源公益项目，检索、阅读、下载均免费，无广告，暂无收费计划。') +
          faqItem('人物库的 66 万数据哪来的？准确吗？', '来自 CBDB（哈佛大学/北京大学/中研院合作）官方数据包（661,350 人），未做任何虚构或篡改。') +
          faqItem('书签会同步到其他设备吗？', '书签、阅读进度与主题偏好仅存当前浏览器本地；如需迁移，可在「书签」页导出/导入 JSON。') +
          faqItem('古籍版权归谁？可以商用吗？', '古籍原文为公有领域，版权归上游数据源；本站资源仅供学术研究与个人学习，商用需自行核实授权。') +
        '</div>' +

        /* 相关说明 */
        '<h3 class="section-title" id="help-legal">' + AB.toSimplified('相关说明（开源协议 / 数据来源 / 免责声明 / 反馈）') + '</h3>' +
        '<div class="card stat-panel" style="line-height:2;font-size:15px;">' +
          '<p>' + AB.toSimplified('本站运营相关的详细声明已拆分为独立页面：') + '</p>' +
          '<ul style="padding-left:20px;margin:4px 0;">' +
            '<li><a href="./license.html">' + AB.toSimplified('开源协议') + '</a>' + AB.toSimplified('：授权方式、非商用定位与数据使用条款。') + '</li>' +
            '<li><a href="./data-source.html">' + AB.toSimplified('数据来源') + '</a>' + AB.toSimplified('：殆知阁 v20 书目原文、CBDB 全量人物库等数据源与溯源。') + '</li>' +
            '<li><a href="./disclaimer.html">' + AB.toSimplified('免责声明') + '</a>' + AB.toSimplified('：非商用、内容仅供参考、使用责任归属。') + '</li>' +
            '<li><a href="./feedback.html">' + AB.toSimplified('反馈渠道') + '</a>' + AB.toSimplified('：勘误、建议与问题反馈方式。') + '</li>' +
          '</ul>' +
        '</div>' +
      '</section>';
    AB.bindFadeIn(main);
  }

  function faqItem(q, a) {
    return '<p><strong>Q：' + AB.toSimplified(q) + '</strong></p><p>' + AB.toSimplified(a) + '</p>';
  }

  AB.renderHelp = renderHelp;
})(window.AB = window.AB || {});
