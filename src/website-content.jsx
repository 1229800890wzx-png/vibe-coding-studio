import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { services as originalServices } from './content';
import { getWebsiteOfferings } from './education-api';

const WebsiteContent = createContext({ services: [], status: 'loading', retry: () => {} });
export function WebsiteContentProvider({ children }) {
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setStatus('loading');
    getWebsiteOfferings({ signal: abort.signal }).then(rows => {
      setServices(rows.map(row => {
        const original = originalServices.find(s => s.id === row.slug) || originalServices[Math.max(0, row.stage - 1)] || originalServices[0];
        const points = row.outline.split(/\r?\n/).filter(Boolean);
        return {
          ...original, id: row.slug, title: row.title, subtitle: row.description,
          points, icons: points.map((_, index) => original.icons[index] || 'Check'),
          stage: row.stage, courseId: row.courseId,
          illustrationIndex: { minecraft: 0, museum: 1, notes: 2 }[row.image] ?? row.stage - 1,
        };
      }));
      setStatus('ready');
    }).catch(error => { if (error.name !== 'AbortError') { setServices([]); setStatus('error'); } });
    return () => abort.abort();
  }, [attempt]);
  return <WebsiteContent.Provider value={{ services, status, retry: () => setAttempt(n => n + 1) }}>{children}</WebsiteContent.Provider>;
}
export const useWebsiteServices = () => useContext(WebsiteContent).services;

export function WebsiteServicesStatus() {
  const { services, status, retry } = useContext(WebsiteContent);
  if (status === 'loading' || services.length) return null;
  return <p role="status">{status === 'error' ? <>课程介绍暂时加载失败。<button type="button" className="text-button" onClick={retry}>重新加载</button></> : '课程介绍正在准备中，欢迎预约咨询。'}</p>;
}

/** Service anchors appear asynchronously; repeat navigation once their targets exist. */
export function WebsiteServiceAnchor() {
  const { services, status } = useContext(WebsiteContent);
  const location = useLocation();
  useEffect(() => {
    if (status !== 'ready' || location.pathname !== '/courses' || !location.hash) return;
    let id;
    try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    if (services.some(service => service.id === id)) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, [services, status, location.pathname, location.hash]);
  return null;
}
