/**
 * Entry point of a standalone client website (one Vercel deployment per client).
 *
 * The server writes the site's sanitised data into the page as
 * <script id="dv-site-data" type="application/json">. This entry reads it and
 * renders the same TenantWebsiteRenderer the DigiVerse preview uses, with no
 * DigiVerse chrome and no dependency on the DigiVerse API.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import '../index.css';
import { TenantWebsiteRenderer } from '../components/admin/TenantWebsiteRenderer';
import { publicSiteRequirements } from '../lib/publicSiteRequirements';

interface StandaloneSiteData {
  slug: string;
  organizationName: string;
  category: string;
  generatedWebsite: any;
}

function readSiteData(): StandaloneSiteData | null {
  try {
    const raw = document.getElementById('dv-site-data')?.textContent;
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.generatedWebsite ? data : null;
  } catch {
    return null;
  }
}

function Unavailable() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 20, margin: 0 }}>This website is unavailable</h1>
        <p style={{ color: '#666', marginTop: 8 }}>Please try again later.</p>
      </div>
    </main>
  );
}

const data = readSiteData();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {data ? (
      <div className="min-h-screen flex flex-col">
        <TenantWebsiteRenderer
          requirements={publicSiteRequirements(data)}
          website={data.generatedWebsite}
          inBrowserFrame={false}
        />
      </div>
    ) : (
      <Unavailable />
    )}
  </React.StrictMode>
);
