import { server } from "../server/index.js";
function ready() {
  process.send?.({ port: (server.address() as { port: number }).port });
}
if (server.listening) ready();
else server.once("listening", ready);
