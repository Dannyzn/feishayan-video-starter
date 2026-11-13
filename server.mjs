import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const files = {
  '/': ['index.html', 'text/html'],
  '/scene.mjs': ['scene.mjs', 'text/javascript'],
  '/timeline.json': ['timeline.json', 'application/json'],
  '/three.module.js': ['node_modules/three/build/three.module.js', 'text/javascript'],
  '/three.core.js': ['node_modules/three/build/three.core.js', 'text/javascript'],
};
export async function startServer(port = 0) {
  const server = createServer(async (request, response) => {
    const file = files[new URL(request.url, 'http://localhost').pathname];
    if (!file) return response.writeHead(404).end();
    try {
      const data = await readFile(new URL(file[0], import.meta.url));
      response.writeHead(200, {'Content-Type': file[1] + '; charset=utf-8'}).end(data);
    } catch {
      response.writeHead(500).end('Read failed. Run npm ci first.');
    }
  });
  await new Promise((resolve,reject) => {
    server.once('error',reject);
    server.listen(port,'127.0.0.1',resolve);
  });
  return {server, url: 'http://127.0.0.1:' + server.address().port};
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const {url} = await startServer(4173);
  console.log(url);
}
