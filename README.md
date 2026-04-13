# How to run

For switching this repo from hosted env settings to local dev env settings, see [HOSTED_TO_LOCAL_DEV_README.md](./HOSTED_TO_LOCAL_DEV_README.md).

2 things you need to do before running:
1. Get node v 23.5.0. On Linux/Windows, easiest way is via FNM. But, ANY WAY IS FINE, as long as you have v23.5.0
2. For python, it's even easier. Simply go here and install: https://docs.astral.sh/uv/getting-started/installation/. This forces same python version and same packages

Once you have those installed, just run:
1. fnm use in the base directory. If it asks to install, say yess
2. cd into frontend, and run npm ci. That installs all packages, and then you're good
3. For python, cd into prototype_interp, and just run uv sync

If any qs, ask Adi
