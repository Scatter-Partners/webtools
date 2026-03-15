# webtools
A set of webtools to make your life easier!

https://webtools.scatter.art/

## Development

You can open HTML files in a browser directly.

Or run a small dev web server:

```bash
docker run -it --rm -p 3000:80 -v "$PWD":/usr/local/apache2/htdocs:ro httpd:2.4-alpine
# then navigate to http://localhost:3000
```

