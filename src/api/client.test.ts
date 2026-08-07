import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './client';

const csrfOne = { data: { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'rotated-token-one' } };
const csrfTwo = { data: { headerName: 'X-CSRF-TOKEN', parameterName: '_csrf', token: 'rotated-token-two' } };

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

afterEach(() => vi.unstubAllGlobals());

describe('ApiClient', () => {
  it('request_unsafeRequest_usesSameOriginCredentialsAndRotatedCsrfHeader', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, csrfOne))
      .mockResolvedValueOnce(jsonResponse(200, csrfTwo))
      .mockResolvedValueOnce(jsonResponse(200, { data: { id: 'order-1' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ApiClient();

    await client.request('/api/v1/auth/login', { method: 'POST', body: { loginId: 'member01', password: 'not-logged' } });
    await client.request('/api/v1/orders', { method: 'POST', body: { items: [] } });

    expect(fetchMock).toHaveBeenNthCalledWith(1, new URL('/api/v1/auth/csrf', window.location.origin), expect.objectContaining({ credentials: 'include', method: 'GET' }));
    expect(fetchMock).toHaveBeenNthCalledWith(2, new URL('/api/v1/auth/login', window.location.origin), expect.objectContaining({ credentials: 'include', method: 'POST' }));
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('X-CSRF-TOKEN')).toBe('rotated-token-one');
    expect(new Headers(fetchMock.mock.calls[2][1].headers).get('X-CSRF-TOKEN')).toBe('rotated-token-two');
  });

  it('request_successfulLogoutClearsCachedCsrfBeforeTheNextUnsafeRequest', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(200, csrfOne))
      .mockResolvedValueOnce(jsonResponse(200, csrfTwo))
      .mockResolvedValueOnce(noContentResponse())
      .mockResolvedValueOnce(jsonResponse(200, csrfOne))
      .mockResolvedValueOnce(jsonResponse(200, { data: { id: 'order-1' } }));
    vi.stubGlobal('fetch', fetchMock);
    const client = new ApiClient();

    await client.request('/api/v1/auth/login', { method: 'POST', body: { loginId: 'member01', password: 'not-logged' } });
    await client.request('/api/v1/auth/logout', { method: 'POST' });
    await client.request('/api/v1/orders', { method: 'POST', body: { items: [] } });

    expect(fetchMock).toHaveBeenNthCalledWith(4, new URL('/api/v1/auth/csrf', window.location.origin), expect.objectContaining({ credentials: 'include', method: 'GET' }));
    expect(new Headers(fetchMock.mock.calls[4][1].headers).get('X-CSRF-TOKEN')).toBe('rotated-token-one');
  });

  it.each([
    ['https://example.test/api/v1/orders'],
    ['/api/../api-admin'],
    ['/api/%2e%2e/api-admin'],
    ['/api/%2E%2E/api-admin'],
  ])('request_invalidApiUrl_rejectsBeforeFetch(%s)', async (path) => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(new ApiClient().request(path)).rejects.toThrow('same-origin');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [400, 'badRequest'], [401, 'unauthorized'], [403, 'forbidden'], [404, 'notFound'], [409, 'conflict'], [422, 'validation'], [500, 'server'],
  ] as const)('request_responseStatus_throwsTypedError(%s, %s)', async (status, kind) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(status, { message: 'safe error' })));

    await expect(new ApiClient().request('/api/v1/members/me')).rejects.toMatchObject({ kind, status });
  });

  it('request_serverErrorDoesNotExposeSensitiveUpstreamPayload', async () => {
    const upstreamPayload = {
      code: 'UPSTREAM_FAILURE',
      password: 'raw-password',
      token: 'upstream-token',
      secret: 'upstream-secret',
      cardNumber: '4111111111111111',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(500, upstreamPayload)));

    const error = await new ApiClient().request('/api/v1/members/me').catch((caught: unknown) => caught);

    expect(error).toMatchObject({ kind: 'server', status: 500, message: 'server' });
    expect(error).not.toHaveProperty('details');
    expect(error).not.toHaveProperty('password');
    expect(error).not.toHaveProperty('token');
    expect(error).not.toHaveProperty('secret');
    expect(error).not.toHaveProperty('cardNumber');
    expect(JSON.stringify(error)).not.toContain('raw-password');
    expect(JSON.stringify(error)).not.toContain('upstream-token');
    expect(JSON.stringify(error)).not.toContain('upstream-secret');
    expect(JSON.stringify(error)).not.toContain('4111111111111111');
  });

  it('request_networkFailure_throwsTypedErrorWithoutLoggingSensitiveRequestBody', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const client = new ApiClient();

    await expect(client.request('/api/v1/members/me')).rejects.toMatchObject({ kind: 'network', status: 0 });
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
