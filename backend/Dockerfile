FROM node:22-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
WORKDIR /workspace

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

# Keep the monorepo context so workspace dependencies resolve consistently.
COPY . .
RUN pnpm install --frozen-lockfile --filter @rentr/api...
RUN pnpm --filter @rentr/types build
RUN pnpm --filter @rentr/api prisma:generate
RUN pnpm --filter @rentr/api build

ENV NODE_ENV=production
ENV API_PORT=3001
EXPOSE 3001
CMD ["pnpm", "--filter", "@rentr/api", "start"]
