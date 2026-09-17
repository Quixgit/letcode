import { PageContainer } from "@/components/site/PageContainer";

interface LogoMarqueeItem {
  logo_media_id?: string;
  logo_url?: string;
  company_name: string;
  url?: string | null;
}

const DURATIONS: Record<"slow" | "medium" | "fast", number> = {
  slow: 60,
  medium: 40,
  fast: 25,
};

export function LogoMarquee({
  heading,
  items,
  speed = "medium",
  pauseOnHover = true,
}: {
  heading?: string;
  items: LogoMarqueeItem[];
  speed?: "slow" | "medium" | "fast";
  pauseOnHover?: boolean;
}) {
  if (items.length === 0) return null;

  const duration = DURATIONS[speed] || DURATIONS.medium;
  // Duplicated once (2 copies total) so `translateX(-50%)` scrolls exactly one full set-width —
  // the standard seamless-loop technique: since the second half is identical to the first, the
  // moment the animation resets from -50% back to 0% is visually indistinguishable from mid-scroll.
  const track = [...items, ...items];

  return (
    <section style={{ padding: "3rem 0" }}>
      {heading && (
        <PageContainer>
          <p
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "var(--site-text-muted, #8A8C93)",
              textAlign: "center",
              margin: "0 0 28px",
              letterSpacing: 0.2,
            }}
          >
            {heading}
          </p>
        </PageContainer>
      )}
      {/* The scrolling track stays full-bleed on purpose — only the heading text above follows
          the shared container, per the "background can bleed, content doesn't" rule. */}
      <div className={`site-marquee${pauseOnHover ? " site-marquee--pause-hover" : ""}`}>
        <div className="site-marquee-track" style={{ animationDuration: `${duration}s` }}>
          {track.map((item, i) => {
            const logo = item.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.logo_url} alt={item.company_name} className="site-marquee-logo" />
            ) : (
              <span className="site-marquee-wordmark">{item.company_name}</span>
            );
            return (
              <div className="site-marquee-item" key={i} title={item.company_name}>
                {item.url ? (
                  <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" style={{ display: "flex", alignItems: "center", height: "100%" }}>
                    {logo}
                  </a>
                ) : (
                  logo
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
