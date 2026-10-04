# laden.no

This is the Laden AS website and the sites that sit with it, published so people can read the code.

The live site is [https://laden.no/](https://laden.no/).

Copyright Laden AS (Org.nr. 937 285 833). The site and Ldash are open source under the MIT License. See [LICENSE](LICENSE). The Laden name, mark and brand are trademarks of Laden AS and are not given away by that licence.

## What is here

- `site/` is the business site: English pages under `site/en/`, Norwegian pages at the top of `site/`, and the portfolio.
- `sites/llz/` is Lab'z, the public lab pages, plus `sites/llz/api/` (`server.py` and `schema.sql`).
- `sites/papirglider/` is PapirGlider, served live at [https://laden.no/levi/](https://laden.no/levi/).
- `sites/skarverakk/` is the Skarverakk demo at [https://laden.no/demo/skarverakk/](https://laden.no/demo/skarverakk/).
- `docker/laden/`, `docker/papirglider/`, `docker/skarverakk/`, and `docker/llz/` are the Docker copies. Each has its Compose file. The HTML each container serves is under `html/` (for Lab'z, under `docker/llz/web/html/`).

Open `site/en/index.html` for the English front page, or `site/index.html` for Norwegian.

## Copyright and licence

Copyright Laden AS (Org.nr. 937 285 833). The site and Ldash are open source under the MIT License. See [LICENSE](LICENSE).

The Laden name, mark and brand are trademarks of Laden AS. The open-source licence covers the code in this repository. It does not give away the name, mark or brand.

Third-party assets that are only embedded (for example SoundCloud tracks and some fonts) stay with their own owners. This repository does not claim those.

## Not in this repo

Ldash installers are not here. GitHub will not take files over 100 MB, and those downloads are larger than that. Get them from the live site.

Secrets are not here. That includes SSH keys, `.env`, the Lab'z API token, the user database, and the mail outbox. `docker/llz/.env.example` only names the setting. Put your own value in a local `.env` if you run that stack. Do not commit it.
