import { api, query } from './client';

export const getContentTree = () => api('/content/tree');
export const getContentItem = (path) => api(`/content${query({ path })}`);
export const getContentByWiki = (target) => api(`/content/wiki/${encodeURIComponent(target)}`);
