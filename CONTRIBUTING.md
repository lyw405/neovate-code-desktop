# CONTRIBUTING

## Development

1. Install dependencies

```bash
$ npm install
```

2. Run the `dev server` script in the [neovate-code](https://github.com/neovateai/neovate-code) repo separately in another terminal since it's not integrated into the desktop app yet.

```bash
# Disable permission and AskUserQuestion with --quiet since we don't support them yet
$ pnpm run dev server --quiet
[WebServer] Server running at http://127.0.0.1:1024
[WebServer] WebSocket endpoint: ws://127.0.0.1:1024/ws
```

And make sure the server is running on port 1024.

3. Run the desktop app in this repo.

```bash
$ npm run dev
```

Then you should see the desktop app running in your browser.

![](https://pic.sorrycc.com/proxy/1765346778934-394421333.png)
