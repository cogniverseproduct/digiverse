import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { isSportsTemplateIdLite } from './templates/sports/ids';
import { isCulturalTemplateIdLite } from './templates/cultural/ids';
import { isNgoTemplateIdLite } from './templates/ngo/ids';
import { isEventTemplateIdLite } from './templates/event/ids';

// Standalone, chrome-free template previews used by the Template Libraries (/?template-preview=<id>).
// Sports, Cultural, Social & NGO, Event and Portfolio template ids never overlap, so one route serves all five libraries.
const PortfolioPreview = lazy(() => import('./templates/portfolio/PreviewPage'));
const SportsPreview = lazy(() => import('./templates/sports/PreviewPage'));
const CulturalPreview = lazy(() => import('./templates/cultural/PreviewPage'));
const NgoPreview = lazy(() => import('./templates/ngo/PreviewPage'));
const EventPreview = lazy(() => import('./templates/event/PreviewPage'));
const previewId = new URLSearchParams(window.location.search).get('template-preview');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {previewId ? (
      <Suspense fallback={<div style={{ minHeight: '100vh' }} aria-busy="true" />}>
        {isSportsTemplateIdLite(previewId) ? <SportsPreview templateId={previewId} />
          : isCulturalTemplateIdLite(previewId) ? <CulturalPreview templateId={previewId} />
          : isNgoTemplateIdLite(previewId) ? <NgoPreview templateId={previewId} />
          : isEventTemplateIdLite(previewId) ? <EventPreview templateId={previewId} />
          : <PortfolioPreview templateId={previewId} />}
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>
);
