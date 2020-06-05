FROM hayd/alpine-deno:1.0.0

EXPOSE 8080

WORKDIR /app

USER deno

COPY . .
RUN deno cache server.ts

CMD ["run", "--allow-net", "server.ts"]
