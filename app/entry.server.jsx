import { PassThrough } from "stream";
import { renderToPipeableStream } from "react-dom/server";
import { RemixServer } from "@remix-run/react";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { isbot } from "isbot";
import { addDocumentResponseHeaders } from "./shopify.server";
import http from "http";

const server = http.createServer();
import { Server } from "socket.io";

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

const ABORT_DELAY = 5000;

export default async function handleRequest(
  request,
  responseStatusCode,
  responseHeaders,
  remixContext
) {
  addDocumentResponseHeaders(request, responseHeaders);
  const userAgent = request.headers.get("user-agent");
  const callbackName = isbot(userAgent ?? "") ? "onAllReady" : "onShellReady";

  return new Promise((resolve, reject) => {
    const { pipe, abort } = renderToPipeableStream(
      <RemixServer
        context={remixContext}
        url={request.url}
        abortDelay={ABORT_DELAY}
      />,
      {
        [callbackName]: () => {
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          console.error(error);
        },
      }
    );

    setTimeout(abort, ABORT_DELAY);
  });
}


export let socketConnected;
io.on('connection', (socket) => {
  console.log('**************Socket Connectrd***********', socket.id);
  // console.log("socket ==========================================================", socket);

  socket.on("checkExtension", (data) => {
    console.log("Client-data ===============", data);
  })
  socketConnected = socket;

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });

});

server.listen(3002, () => {
  console.log("Server start listning on port 3002");
})

// export { socketConnected };
