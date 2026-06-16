# Project Notes

- For network operations, use the proxy by default. Set both `HTTP_PROXY` and `HTTPS_PROXY` to `http://localhost:7897` before commands such as `gh`, `git`, `npm`, and `curl`. If that proxy is unavailable, retry with `http://localhost:7890`.
- Unless explicitly requested, do not modify WeChat Mini Program code under `wechat-miniprogram`; that client is considered frozen and not planned for updates.
