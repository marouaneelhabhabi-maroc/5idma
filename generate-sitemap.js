const fs = require('fs');

const SUPABASE_URL = "https://kacutivlrarulhbrzsil.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthY3V0aXZscmFydWxoYnJ6c2lsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1MDYyNTQsImV4cCI6MjA5NjA4MjI1NH0.U39OH4ysCEpQGGkJabKRw_u22SVLv8J7elUzESdxjTY";
const SITE_URL = "https://l9a5dma.ma";

async function fetchAllProviders() {
  let all = [];
  let from = 0;
  const pageSize = 1000;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/providers?select=id,created_at&order=created_at.desc&limit=${pageSize}&offset=${from}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;
    all = all.concat(data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}

function escapeXml(str) {
  return String(str).replace(/&/g, "&amp;");
}

async function main() {
  const providers = await fetchAllProviders();
  console.log(`Found ${providers.length} providers`);

  const staticUrls = [
    { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/submit.html`, changefreq: "monthly", priority: "0.9" },
    { loc: `${SITE_URL}/privacy.html`, changefreq: "yearly", priority: "0.3" },
  ];

  const providerUrls = providers.map((p) => {
    const lastmod = p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : undefined;
    return {
      loc: `${SITE_URL}/profile.html?id=${p.id}`,
      changefreq: "weekly",
      priority: "0.7",
      lastmod,
    };
  });

  const allUrls = [...staticUrls, ...providerUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${escapeXml(u.loc)}</loc>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""}    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  fs.writeFileSync("sitemap.xml", xml);
  console.log("sitemap.xml generated ✅");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
