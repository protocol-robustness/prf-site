# Cleanroom notebook publication source

This Clerk export was generated from `notebooks/not_admitted.clj` in
[`protocol-robustness/prf-clean-room`](https://github.com/protocol-robustness/prf-clean-room/tree/7a14bceff1373aa0f0a6160733b57e19c84ca73c/notebooks).

Source revision: `7a14bceff1373aa0f0a6160733b57e19c84ca73c`

Rebuild from that repository revision with:

```sh
PRF_BUILD_PATHS=notebooks/not_admitted.clj \
PRF_BUILD_OUT_PATH=/tmp/prf-cleanroom-site-build \
PRF_BUILD_PACKAGE=directory \
clojure -T:build-clerk
```

The export consists of `index.html` and `index.edn`. Clerk loads the notebook
record from the adjacent `index.edn`; its viewer assets are served by the
upstream Clerk CDN.
