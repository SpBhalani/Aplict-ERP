# Chapter 10 · Deployment on your own servers

Plain servers are a good choice at our size: each client's whole system runs as Docker containers on a rented Linux server, deployed automatically from GitHub. Your cost assumption is mostly right, with one catch: on plain servers, **backups, security updates and monitoring become our job**, and this chapter shows how to do them properly.

## DevOps words, explained from zero

| Word               | Meaning                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Server / VPS       | A computer in a data centre that you rent. A VPS is a slice of a big machine; a dedicated server is a whole machine |
| Linux (Ubuntu LTS) | The operating system on the server; LTS versions get years of security updates                                      |
| SSH                | A secure way to log in to the server from your laptop's terminal, using a key instead of a password                 |
| Docker image       | A packaged, ready-to-run copy of an app with everything it needs                                                    |
| Container          | A running image, isolated from other containers on the same server                                                  |
| Docker Compose     | One file that lists all containers for a system and starts them together                                            |
| Reverse proxy      | The front door that receives all web traffic and passes it to the right container                                   |
| HTTPS certificate  | What makes the padlock appear in the browser; Caddy gets and renews them automatically                              |
| Domain and DNS     | The name (`client-a.ourapp.com`) and the phone book that points it to the server's address                          |
| CI/CD              | Automatic checking (CI) and automatic deploying (CD) every time code is pushed                                      |
| Container registry | A store for Docker images; the server downloads new versions from here                                              |
| Secrets            | Passwords and keys, kept out of the code and given to containers at start                                           |
| Backup and restore | Copies of data kept somewhere else, and the practised ability to bring them back                                    |

## What runs on one client's server

&#91;embedded content: one client server · containers, data, monitoring, backups\]

Everything above is one `docker-compose.yml`. A trimmed example:

```yaml
services:
  caddy:
    {
      image: caddy:2,
      ports: ['80:80', '443:443'],
      volumes: [./Caddyfile:/etc/caddy/Caddyfile, caddy_data:/data],
    }
  web: { image: ghcr.io/ourco/web:1.4.2 }
  api: { image: ghcr.io/ourco/api:1.4.2, env_file: .env, deploy: { replicas: 2 } }
  worker: { image: ghcr.io/ourco/api:1.4.2, command: ['node', 'dist/worker.js'], env_file: .env }
  postgres: { image: postgres:17, volumes: [pg_data:/var/lib/postgresql/data], env_file: .env }
  pgbouncer: { image: edoburu/pgbouncer, env_file: .env }
  redis: { image: redis:7, volumes: [redis_data:/data] }
  gotenberg: { image: gotenberg/gotenberg:8 }
volumes: { caddy_data: {}, pg_data: {}, redis_data: {} }
```

The image tag (`1.4.2`) is the core version pinned for this client; the client package is built into their own image.

## Setting up a server, step by step

1. **Rent a server** in a region close to the client (and in India if the client needs their data kept there).
2. **Lock it down:** log in with SSH keys only and turn off password login; turn on the firewall (`ufw`) to allow only ports 22, 80 and 443; install `fail2ban` to block repeated break-in attempts; turn on automatic security updates.
3. **Install Docker** and Docker Compose.
4. **Point the domain** at the server's IP address in DNS.
5. **Copy in the compose file, the Caddyfile and the secrets file.** Secrets never go into Git.
6. **Start everything** with `docker compose up -d`. Caddy fetches the HTTPS certificate by itself.
7. **Set up backups** (below) and **test a restore** before the client goes live.
8. **Set up monitoring and alerts** (below).

## How a deploy works

1. A developer merges code into the main branch on GitHub.
2. **GitHub Actions** runs lint, boundary checks and tests, including every client package's contract tests.
3. It builds Docker images, tags them with the version, and pushes them to the registry (GitHub Container Registry).
4. For each client being upgraded, a deploy job connects to their server over SSH and runs `docker compose pull` then `docker compose up -d`.
5. The new `api` runs pending database migrations, then a health check confirms it answers correctly.
6. If the health check fails, the job switches back to the previous image tag. Rolling back takes seconds because the old image is still there.

Always deploy to a **staging** copy first (a small server with test data), then to the client.

**An easier start:** **Coolify** or **Dokploy** are free, self-hosted control panels you install on your own server. They give you a web screen for deploys, HTTPS, logs and scheduled database backups, a lot like a cloud platform but on your own machine. They are a good way for a team new to DevOps to start, and everything still runs on plain Docker underneath.

## Backups: the part you cannot skip

A single server has one weakness: if it dies or gets corrupted, whatever isn't backed up elsewhere is gone.

| What                    | How                                                                                                   | How often                          |
| ----------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Database, point-in-time | pgBackRest (or WAL-G) continuously ships changes to off-site storage, so we can restore to any minute | Continuous, plus a full copy daily |
| Database, simple copy   | `pg_dump` of the whole database                                                                       | Nightly, kept for 30 days          |
| Files                   | Sync the file storage to off-site storage                                                             | Nightly                            |
| Server settings         | Compose file, Caddyfile, config in a private Git repo; secrets in a password vault                    | On every change                    |

Keep off-site storage at a **different provider** from the server. And **test a restore** onto a spare server every month: a backup never restored is a hope, not a backup.

## Monitoring: knowing before the client calls

| Tool          | What it does                                                                                       |
| ------------- | -------------------------------------------------------------------------------------------------- |
| Uptime Kuma   | Checks every few minutes that each client's app answers; alerts on WhatsApp, email or Slack if not |
| Prometheus    | Collects numbers over time: CPU, memory, disk, request times, queue lengths                        |
| Loki          | Collects all containers' logs in one searchable place                                              |
| Grafana       | Dashboards over all of the above, plus alerts (disk almost full, jobs failing)                     |
| OpenTelemetry | Our code sends traces, so we can see which query made a request slow                               |

The monitoring tools can run on one separate small server that watches all client servers.

## One server per client, or shared?

Each client always gets its **own set of containers and its own database**. Physically:

- **Small clients:** several clients' stacks can share one bigger server, each in its own Compose project. Cheaper.
- **Larger or sensitive clients:** their own server. Better isolation, and one client's busy day can't slow another.
- **Clients who need high availability:** add a second server with a PostgreSQL standby that copies the database continuously and can take over.

## Are plain servers really cheaper than AWS?

For raw computing power, usually yes, often by several times. Budget providers such as Hetzner, OVH or DigitalOcean, and Indian providers such as E2E Networks, charge far less for the same CPU and memory than AWS. AWS bills also grow in less visible ways: managed databases, data transfer out, load balancers and network gateways each add a line.

What the cloud really sells is **time and safety**: managed backups, automatic failover, patching and scaling done for you. On plain servers we do those ourselves, with the tools above.

|                            | Plain servers                                     | Cloud (AWS and similar)                  |
| -------------------------- | ------------------------------------------------- | ---------------------------------------- |
| Monthly bill at our size   | Low and predictable                               | Higher, and easier to overshoot          |
| Backups, updates, failover | Our job, scripted once and reused                 | Mostly handled for us                    |
| Skills needed              | Basic Linux, Docker and the steps in this chapter | Cloud-specific knowledge instead         |
| Moving later               | Easy: it's all Docker                             | Harder if we lean on cloud-only services |

Our recommendation: start on plain servers with the setup in this chapter, and pay for managed services only where they clearly save pain (off-site backup storage, for example). Because everything is Docker, moving a client to the cloud later is straightforward.

## Remember

- Each client: Linux server, Docker Compose, Caddy in front, api + worker + web + PostgreSQL + Redis behind.
- Push to GitHub, and Actions tests, builds, deploys and rolls back if the health check fails.
- Backups off-site at another provider, restore tested monthly; monitoring alerts you before the client notices.
