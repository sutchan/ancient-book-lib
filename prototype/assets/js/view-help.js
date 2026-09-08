/**
 * 原型帮助视图 v2.2
 * 职责：更新日志、使用教程、开源共建与合规声明
 */
(function (AB) {
  "use strict";

  function renderHelp(main) {
    main.innerHTML =
      '<section>' +
        '<div class="breadcrumb"><a href="#page-home">' + AB.toSimplified('首页') + '</a><span class="sep">/</span><span>' +
          AB.toSimplified('帮助') + '</span></div>' +
        '<h2 id="help-title" style="margin-bottom:24px;">' + AB.toSimplified('使用教程与合规声明') + '</h2>' +
        '<div class="character-card" style="margin-bottom:16px;">' +
          '<div class="char-name" style="font-size:17px;">' + AB.toSimplified('🕘 最近更新') + '</div>' +
          '<div class="info-row">· 2026-09-01 ' + AB.toSimplified('新增数据统计页：馆藏/朝代/人物/关系全景分析') + '</div>' +
          '<div class="info-row">· 2026-08-28 ' + AB.toSimplified('检索升级：支持标题/全文双模式切换与每页 10/20/50 条') + '</div>' +
          '<div class="info-row">· 2026-08-20 ' + AB.toSimplified('人物考据新增作废 ID 查询，重名合并档案统一公示') + '</div>' +
          '<div class="info-row">· 2026-08-12 ' + AB.toSimplified('阅读页新增原书影像对照（左图右文）') + '</div>' +
          '<div class="info-row">· 2026-08-01 ' + AB.toSimplified('V1.0 正式上线：十大馆藏、繁简保真、全文检索') + '</div>' +
        '</div>' +
        '<div class="character-card" style="margin-bottom:16px;">' +
          '<div class="char-name" style="font-size:17px;">' + AB.toSimplified('📖 使用教程') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('全文检索：输入关键词，支持标题/全文双模式，结果按权重排序') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('繁简切换：导航栏「繁简」按钮，正文实时转换，繁体100%保真') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('主题切换：日间/护眼/深色三套阅读主题') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('分片阅读：超大文本按章节分片加载，进度自动记忆') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('生僻字：点击正文标注的古字，弹窗查看注音释义') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('字号行距：阅读页工具栏自由调节') + '</div>' +
        '</div>' +
        '<div class="character-card" style="margin-bottom:16px;">' +
          '<div class="char-name" style="font-size:17px;">' + AB.toSimplified('🤝 开源共建') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('志愿者招募：文本校对、古字纠错、索引优化') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('反馈渠道：官方意见反馈入口（GitHub Issues）') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('项目开源：MIT协议，持续社区共建迭代') + '</div>' +
        '</div>' +
        '<div class="character-card">' +
          '<div class="char-name" style="font-size:17px;">' + AB.toSimplified('⚖️ 合规声明') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('古籍资源源自殆知阁开源仓库，仅供学术研究与文化传播') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('禁止商用、禁止二次售卖、禁止篡改后伪造成原创资料') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('人物数据源自馆藏典籍作者字段派生，缺失字段留空不虚构') + '</div>' +
          '<div class="info-row">· ' + AB.toSimplified('本项目为公益开源项目，无广告、无注册、无付费，仅匿名访问统计') + '</div>' +
        '</div>' +
      '</section>';
  }

  AB.renderHelp = renderHelp;
})(window.AB = window.AB || {});
