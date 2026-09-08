/**
 * 古籍通 AncientBook 原型全局数据（单一数据源）
 * 说明：使用全局变量方案，保证 file:// 协议直接打开也可加载（不受 fetch CORS 限制）。
 * 覆盖：十大馆藏、书籍章节、人物考据、社会关系、检索结果。
 *
 * 人物数据「数据驱动」：characters 由 books 的 author 字段派生（去重、剔除佚名/集体编撰、
 * 仅保留可考个人），不手写示范人物；relations 仅保留两端都在人物集中的有效引用。
 */
window.APP_DATA = (function () {
  const categories = [
    { id: "fo", name: "佛藏", desc: "佛家经典 · 般若智慧", icon: "☸" },
    { id: "ru", name: "儒藏", desc: "儒家经典 · 修齐治平", icon: "儒" },
    { id: "yi", name: "医藏", desc: "医学方书 · 济世活人", icon: "医" },
    { id: "shi", name: "史藏", desc: "史书地理 · 鉴往知来", icon: "史" },
    { id: "zi", name: "子藏", desc: "诸子百家 · 思想争鸣", icon: "子" },
    { id: "yi2", name: "易藏", desc: "易学典籍 · 穷理尽性", icon: "易" },
    { id: "art", name: "艺藏", desc: "艺术典籍 · 琴棋书画", icon: "艺" },
    { id: "shi2", name: "诗藏", desc: "诗词总集 · 吟咏性情", icon: "诗" },
    { id: "dao", name: "道藏", desc: "道家典籍 · 清静无为", icon: "道" },
    { id: "ji", name: "集藏", desc: "文集总集 · 汇录百家", icon: "集" }
  ];

  const books = [
    // 佛藏
    { id: "fo-jingang", title: "金刚般若波罗蜜经", category: "佛藏", dynasty: "后秦", author: "鸠摩罗什译", desc: "大乘佛教般若部核心经典，以空慧断烦恼。", chapters: ["法因缘由分第一", "善现启请分第二", "大乘正宗分第三", "妙行无住分第四"] },
    { id: "fo-xinjing", title: "般若波罗蜜多心经", category: "佛藏", dynasty: "唐", author: "玄奘译", desc: "字数最少、流传最广的佛教经典。", chapters: ["心经全文", "心经注疏"] },
    { id: "fo-fahua", title: "妙法莲华经", category: "佛藏", dynasty: "后秦", author: "鸠摩罗什译", desc: "开权显实、会三归一的大乘要典。", chapters: ["序品第一", "方便品第二", "譬喻品第三"] },
    { id: "fo-lengyan", title: "楞严经", category: "佛藏", dynasty: "唐", author: "般剌密帝译", desc: "阐明心性本体，破妄显真。", chapters: ["序分", "正宗分", "流通分"] },
    { id: "fo-huayan", title: "大方广佛华严经", category: "佛藏", dynasty: "唐", author: "实叉难陀译", desc: "经中之王，圆融无碍的境界。", chapters: ["世主妙严品", "如来现相品", "普贤三昧品"] },
    // 儒藏
    { id: "ru-lunyu", title: "论语", category: "儒藏", dynasty: "春秋", author: "孔子弟子及再传弟子", desc: "儒家经典，记录孔子及弟子言行。", chapters: ["学而篇第一", "为政篇第二", "八佾篇第三", "里仁篇第四"] },
    { id: "ru-mengzi", title: "孟子", category: "儒藏", dynasty: "战国", author: "孟子及其弟子", desc: "儒家经典，主张性善、仁政、民贵君轻。", chapters: ["梁惠王上", "梁惠王下", "公孙丑上"] },
    { id: "ru-daxue", title: "大学", category: "儒藏", dynasty: "先秦", author: "曾参述", desc: "四书之一，三纲领八条目。", chapters: ["经一章", "传十章"] },
    { id: "ru-zhongyong", title: "中庸", category: "儒藏", dynasty: "先秦", author: "子思", desc: "四书之一，天命之谓性。", chapters: ["第一章", "第二章", "第三十一章"] },
    { id: "ru-xiaojing", title: "孝经", category: "儒藏", dynasty: "先秦", author: "孔子", desc: "论孝道之经典。", chapters: ["开宗明义章", "天子章", "诸侯章"] },
    // 医藏
    { id: "yi-huangdi", title: "黄帝内经", category: "医藏", dynasty: "先秦", author: "佚名", desc: "中医理论奠基之作，包括素问与灵枢。", chapters: ["上古天真论", "四气调神大论", "生气通天论"] },
    { id: "yi-shanghan", title: "伤寒论", category: "医藏", dynasty: "东汉", author: "张仲景", desc: "辨证论治的经典，六经辨证体系。", chapters: ["辨太阳病脉证并治", "辨阳明病脉证并治", "辨少阳病脉证并治"] },
    { id: "yi-bencao", title: "本草纲目", category: "医藏", dynasty: "明", author: "李时珍", desc: "药物学巨著，收载药物1892种。", chapters: ["序例", "水部", "火部", "土部"] },
    { id: "yi-jingui", title: "金匮要略", category: "医藏", dynasty: "东汉", author: "张仲景", desc: "杂病辨证论治经典。", chapters: ["脏腑经络先后病脉证", "痉湿暍病脉证治"] },
    { id: "yi-wenre", title: "温病条辨", category: "医藏", dynasty: "清", author: "吴鞠通", desc: "温病学派代表著作。", chapters: ["上焦篇", "中焦篇", "下焦篇"] },
    // 史藏
    { id: "shi-shiji", title: "史记", category: "史藏", dynasty: "西汉", author: "司马迁", desc: "第一部纪传体通史，究天人之际。", chapters: ["五帝本纪", "项羽本纪", "孔子世家", "淮阴侯列传"] },
    { id: "shi-zizhi", title: "资治通鉴", category: "史藏", dynasty: "北宋", author: "司马光", desc: "编年体通史，鉴于往事有资于治道。", chapters: ["周纪一", "秦纪一", "汉纪一"] },
    { id: "shi-hanshu", title: "汉书", category: "史藏", dynasty: "东汉", author: "班固", desc: "第一部纪传体断代史。", chapters: ["高帝纪", "武帝纪", "司马迁传"] },
    { id: "shi-zhanguo", title: "战国策", category: "史藏", dynasty: "西汉", author: "刘向编", desc: "国别体史书，纵横家言论集。", chapters: ["秦策一", "齐策一", "赵策一"] },
    { id: "shi-sanguo", title: "三国志", category: "史藏", dynasty: "西晋", author: "陈寿", desc: "纪传体三国史。", chapters: ["魏书·武帝纪", "蜀书·先主传", "吴书·吴主传"] },
    // 子藏
    { id: "zi-daode", title: "道德经", category: "子藏", dynasty: "春秋", author: "老子", desc: "道家思想源头，道法自然。", chapters: ["道经", "德经"] },
    { id: "zi-zhuangzi", title: "庄子", category: "子藏", dynasty: "战国", author: "庄周", desc: "逍遥游、齐物论，汪洋恣肆。", chapters: ["逍遥游", "齐物论", "养生主", "人间世"] },
    { id: "zi-hanfei", title: "韩非子", category: "子藏", dynasty: "战国", author: "韩非", desc: "法家集大成之作。", chapters: ["五蠹", "说难", "定法"] },
    { id: "zi-mozi", title: "墨子", category: "子藏", dynasty: "战国", author: "墨翟", desc: "兼爱非攻，墨家经典。", chapters: ["尚贤上", "兼爱上", "非攻上"] },
    { id: "zi-xunzi", title: "荀子", category: "子藏", dynasty: "战国", author: "荀况", desc: "性恶论，劝学名篇。", chapters: ["劝学", "修身", "王制"] },
    // 易藏
    { id: "yi-zhouyi", title: "周易", category: "易藏", dynasty: "先秦", author: "伏羲画卦文王演易", desc: "群经之首，大道之源。", chapters: ["乾卦", "坤卦", "屯卦", "蒙卦"] },
    { id: "yi-yizhuan", title: "易传", category: "易藏", dynasty: "先秦", author: "孔子及后学", desc: "十翼释经，发挥易理。", chapters: ["系辞上传", "系辞下传", "说卦传"] },
    { id: "yi-zhouyi-cankao", title: "周易参同契", category: "易藏", dynasty: "东汉", author: "魏伯阳", desc: "丹经之祖，会通易道。", chapters: ["上篇", "中篇", "下篇"] },
    { id: "yi-jingji", title: "京氏易传", category: "易藏", dynasty: "西汉", author: "京房", desc: "西汉象数易学代表。", chapters: ["卷上", "卷中", "卷下"] },
    // 艺藏
    { id: "art-shupu", title: "书谱", category: "艺藏", dynasty: "唐", author: "孙过庭", desc: "书法理论经典，论草书笔法。", chapters: ["书谱上", "书谱下"] },
    { id: "art-huahun", title: "画论", category: "艺藏", dynasty: "清", author: "石涛", desc: "一画论，搜尽奇峰打草稿。", chapters: ["一画章", "了法章", "变化章"] },
    { id: "art-qinjing", title: "琴史", category: "艺藏", dynasty: "宋", author: "朱长文", desc: "古琴历史与琴人传记。", chapters: ["上古", "中古", "近古"] },
    { id: "art-wenshi", title: "文房四谱", category: "艺藏", dynasty: "宋", author: "苏易简", desc: "笔、墨、纸、砚谱录。", chapters: ["笔谱", "墨谱", "纸谱", "砚谱"] },
    // 诗藏
    { id: "shi2-shijing", title: "诗经", category: "诗藏", dynasty: "西周-春秋", author: "佚名", desc: "中国第一部诗歌总集，风雅颂。", chapters: ["关雎", "蒹葭", "鹿鸣", "七月"] },
    { id: "shi2-chuci", title: "楚辞", category: "诗藏", dynasty: "战国", author: "屈原等", desc: "骚体之祖，浪漫主义源头。", chapters: ["离骚", "九歌", "天问"] },
    { id: "shi2-quantang", title: "全唐诗", category: "诗藏", dynasty: "唐", author: "曹寅等编", desc: "唐诗总集，收录四万九千余首。", chapters: ["李白卷", "杜甫卷", "王维卷", "白居易卷"] },
    { id: "shi2-yuefu", title: "乐府诗集", category: "诗藏", dynasty: "宋", author: "郭茂倩编", desc: "乐府诗总集，相和、杂曲。", chapters: ["郊庙歌辞", "鼓吹曲辞", "相和歌辞"] },
    // 道藏
    { id: "dao-baopu", title: "抱朴子", category: "道藏", dynasty: "东晋", author: "葛洪", desc: "内篇论道，外篇论儒。", chapters: ["畅玄", "论仙", "金丹"] },
    { id: "dao-yunji", title: "云笈七签", category: "道藏", dynasty: "北宋", author: "张君房", desc: "道藏辑要，修仙总汇。", chapters: ["道教本始部", "经教相承部", "服食部"] },
    { id: "dao-yinfu", title: "阴符经", category: "道藏", dynasty: "唐", author: "李筌注", desc: "观天之道，执天之行。", chapters: ["神仙抱一演道章", "富国安民演法章"] },
    { id: "dao-cantong", title: "悟真篇", category: "道藏", dynasty: "北宋", author: "张伯端", desc: "内丹经典，命功要诀。", chapters: ["七言四韵", "绝句", "西江月"] },
    // 集藏
    { id: "ji-wenxuan", title: "文选", category: "集藏", dynasty: "南朝梁", author: "萧统编", desc: "现存最早的诗文总集，文选烂秀才半。", chapters: ["赋", "诗", "骚", "表"] },
    { id: "ji-guowen", title: "古文观止", category: "集藏", dynasty: "清", author: "吴楚材吴调侯编", desc: "古文精选集，收文222篇。", chapters: ["左传选", "战国策选", "史记选", "唐宋文选"] },
    { id: "ji-zhaoming", title: "昭明文选补遗", category: "集藏", dynasty: "清", author: "佚名", desc: "文选补辑，广收遗珠。", chapters: ["卷上", "卷下"] },
    { id: "ji-wenyuan", title: "文苑英华", category: "集藏", dynasty: "北宋", author: "李昉等编", desc: "诗文总集，续文选。", chapters: ["赋部", "诗部", "文部"] }
  ];

  // 作者字段 → 真实人物（去重、剔除佚名/集体编撰、仅保留可考个人）
  const AUTHOR_PERSONS = {
    "鸠摩罗什译": ["鸠摩罗什"],
    "玄奘译": ["玄奘"],
    "般剌密帝译": ["般剌密帝"],
    "实叉难陀译": ["实叉难陀"],
    "孔子弟子及再传弟子": ["孔子"],
    "孟子及其弟子": ["孟子"],
    "曾参述": ["曾参"],
    "子思": ["子思"],
    "孔子": ["孔子"],
    "佚名": [],
    "张仲景": ["张仲景"],
    "李时珍": ["李时珍"],
    "吴鞠通": ["吴鞠通"],
    "司马迁": ["司马迁"],
    "司马光": ["司马光"],
    "班固": ["班固"],
    "刘向编": ["刘向"],
    "陈寿": ["陈寿"],
    "老子": ["老子"],
    "庄周": ["庄周"],
    "韩非": ["韩非"],
    "墨翟": ["墨翟"],
    "荀况": ["荀况"],
    "伏羲画卦文王演易": [],
    "孔子及后学": ["孔子"],
    "魏伯阳": ["魏伯阳"],
    "京房": ["京房"],
    "孙过庭": ["孙过庭"],
    "石涛": ["石涛"],
    "朱长文": ["朱长文"],
    "苏易简": ["苏易简"],
    "屈原等": ["屈原"],
    "曹寅等编": ["曹寅"],
    "郭茂倩编": ["郭茂倩"],
    "葛洪": ["葛洪"],
    "张君房": ["张君房"],
    "李筌注": ["李筌"],
    "张伯端": ["张伯端"],
    "萧统编": ["萧统"],
    "吴楚材吴调侯编": ["吴楚材", "吴调侯"],
    "李昉等编": ["李昉"]
  };

  // 数据驱动派生人物：以书籍作者为唯一来源，自动关联其著作
  const personBooks = {};
  for (const b of books) {
    const persons = AUTHOR_PERSONS[b.author];
    if (!persons) continue;
    for (const name of persons) {
      (personBooks[name] ||= new Set()).add(b.title);
    }
  }
  const characters = Object.keys(personBooks)
    .sort((a, b) => a.localeCompare(b, "zh-Hans-CN"))
    .map((name, i) => ({
      id: "c" + String(i + 1).padStart(3, "0"),
      name,
      zi: "",
      alias: "",
      dynasty: "",
      native: "",
      birth: "",
      death: "",
      office: "",
      tags: [],
      desc: "",
      books: [...personBooks[name]]
    }));

  // 社会关系：仅保留两端均在人物集中的有效引用（源自真实史料考据）
  const relations = [
    { a: "孔子", b: "孟子", type: "思想传承", source: "《孟子》《史记》", detail: "孟子私淑孔子，儒家道统承续者，被尊为「亚圣」。", dynasty: "战国" },
    { a: "老子", b: "庄周", type: "思想传承", source: "《庄子》", detail: "庄子继承发展道家学说，并称「老庄」。", dynasty: "战国" },
    { a: "司马迁", b: "司马光", type: "史学传承", source: "《资治通鉴》", detail: "司马光编年体通鉴与史记纪传体通史相承，并称史学双璧。", dynasty: "北宋" },
    { a: "张仲景", b: "李时珍", type: "医学传承", source: "《本草纲目》", detail: "李时珍广征前贤，仲景辨证论治精神泽被后世医家。", dynasty: "明" },
    { a: "屈原", b: "司马迁", type: "精神共鸣", source: "《史记·屈原贾生列传》", detail: "太史公「悲其志」，将其列传以传忠贞之气。", dynasty: "西汉" },
    { a: "老子", b: "张仲景", type: "思想影响", source: "《伤寒论·序》", detail: "仲景「天布五行以运万类」之论，本于道法自然。", dynasty: "东汉" }
  ];

  const searchDemo = {
    keyword: "不亦说乎",
    results: [
      { book: "论语", chapter: "学而篇第一", path: "首页 > 儒藏 > 论语", snippet: "子曰：学而时习之，不亦说乎？有朋自远方来，不亦乐乎？人不知而不愠，不亦君子乎？", score: 98 },
      { book: "论语", chapter: "为政篇第二", path: "首页 > 儒藏 > 论语", snippet: "子曰：由，诲女知之乎！知之为知之，不知为不知，是知也。", score: 85 },
      { book: "孟子", chapter: "梁惠王上", path: "首页 > 儒藏 > 孟子", snippet: "孟子见梁惠王，王立于沼上，顾鸿雁麋鹿，曰：贤者亦乐此乎？", score: 72 }
    ]
  };

  // 生僻字释义演示数据
  const glossary = [
    { char: "愠", pinyin: "yùn", meaning: "生气、恼怒。", usage: "人不知而不愠" },
    { char: "罔", pinyin: "wǎng", meaning: "迷惑而无所得。", usage: "学而不思则罔" },
    { char: "殆", pinyin: "dài", meaning: "疲倦、危险；这里指疑惑不安。", usage: "思而不学则殆" },
    { char: "孝弟", pinyin: "xiào tì", meaning: "孝顺父母、敬爱兄长。弟同「悌」。", usage: "其为人也孝弟" },
    { char: "鲜", pinyin: "xiǎn", meaning: "少。", usage: "鲜矣仁" }
  ];

  return {
    version: "2.0",
    categories,
    books,
    characters,
    relations,
    searchDemo,
    glossary
  };
})();
