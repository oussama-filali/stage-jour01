import http from 'node:http';

const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Bonjour depuis node-demo (trigger CI)');
});

server.listen(port, () => {
  console.log(`node-demo écoute sur http://localhost:${port}`);
});
