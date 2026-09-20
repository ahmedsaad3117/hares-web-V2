# Deployment cache configuration

The application now uses release-version query parameters for its shared CSS
and JavaScript. HTML and application assets should also be revalidated by the
web server so visitors receive a new release without clearing browser cache.

## Apache

Upload the repository's `.htaccess` file with the site. Apache must have
`mod_headers`, `mod_expires`, and `AllowOverride FileInfo` (or `All`) enabled.

## Nginx

Include `deploy/nginx-cache.conf.example` inside the site's `server {}` block,
then validate and reload Nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

The policy intentionally revalidates HTML, CSS, JavaScript, and translation
JSON. Browsers can still receive lightweight `304 Not Modified` responses for
unchanged files, while changed deployments become visible on a normal refresh.

If a reverse proxy or CDN such as Cloudflare is placed in front of the VPS, it
must respect the origin `Cache-Control` headers or use an equivalent bypass
rule for HTML, CSS, JavaScript, and JSON.
