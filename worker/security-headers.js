// Mapbox GL needs its CDN, tile/geocoding API, telemetry endpoint and blob: workers. Inline style
// attributes are still used by the templates, so styles keep 'unsafe-inline'; scripts do not.
export const CONTENT_SECURITY_POLICY=[
 "default-src 'self'",
 "script-src 'self' https://api.mapbox.com",
 "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
 "img-src 'self' data: blob: https://api.mapbox.com",
 "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
 "worker-src 'self' blob:",
 "child-src blob:",
 "font-src 'self' data:",
 "object-src 'none'",
 "base-uri 'self'",
 "form-action 'self'",
 "frame-ancestors 'none'"
].join('; ');
export const securityHeaders={'content-security-policy':CONTENT_SECURITY_POLICY,'x-content-type-options':'nosniff','referrer-policy':'strict-origin-when-cross-origin','x-frame-options':'DENY'};
