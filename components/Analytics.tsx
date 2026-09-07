/**
 * Google Analytics 4 埋点组件（Server Component，SSG 时直接写入初始 HTML）
 * 衡量 ID: G-H76XG9L6FZ
 * 说明：仅采集匿名聚合访问统计（页面浏览/来源/设备），启用 IP 匿名化，
 * 不采集个人身份信息，与项目「零隐私收集」定位保持一致。
 */
import Script from "next/script";

const GA_ID = "G-H76XG9L6FZ";

export default function Analytics() {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}', {
            anonymize_ip: true,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}
