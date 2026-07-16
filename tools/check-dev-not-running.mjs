import net from "node:net";

const PORT = Number(process.env.NGA_DEV_PORT ?? 3000);

function isDevPortInUse(port) {
  return new Promise((resolve) => {
    const probe = net.createServer();

    probe.once("error", (error) => {
      resolve(error.code === "EADDRINUSE");
    });

    probe.once("listening", () => {
      probe.close(() => resolve(false));
    });

    probe.listen(port, "127.0.0.1");
  });
}

const inUse = await isDevPortInUse(PORT);

if (inUse) {
  console.error(
    `\n[prebuild] Port ${PORT} is in use — \`npm run dev\` may still be running.`,
  );
  console.error(
    "Stop the dev server before `npm run build` to avoid corrupting the shared .next cache.\n",
  );
  process.exit(1);
}
