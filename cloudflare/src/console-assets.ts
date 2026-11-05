/** Only registered application pages may use the SPA document. */
const page = /^\/console\/(?:home|students(?:\/[^/.\\\x00-\x20]+)?|reports|members(?:\/[^/.\\\x00-\x20]+)?|rewards|account|login|session-error|403|500)?$/;

export async function consoleAssets(request: Request, path: string, assets: Pick<Fetcher, 'fetch'>): Promise<Response> {
  const url = new URL(request.url);
  url.pathname = path;
  const response = await assets.fetch(new Request(url, request));
  if (response.status !== 404 || !page.test(path)) return response;
  await response.body?.cancel();
  url.pathname = '/console/index.html';
  return assets.fetch(new Request(url, request));
}
