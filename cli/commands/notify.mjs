import http from "node:http";

export const meta = {
  name: "notify",
  description: "Publish a local server event for manual SSE testing",
};

function parseArgs(args) {
  const options = {
    channel: "",
    resource: "server_event_test",
    resourceId: "",
    action: "created",
    level: "",
    messageParts: [],
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--channel") {
      const channel = args[index + 1];
      if (!channel) {
        throw new Error("--channel requires a value");
      }
      options.channel = channel;
      index += 1;
      continue;
    }

    if (arg === "--resource") {
      const resource = args[index + 1];
      if (!resource) {
        throw new Error("--resource requires a value");
      }
      options.resource = resource;
      index += 1;
      continue;
    }

    if (arg === "--resource-id") {
      const resourceId = args[index + 1];
      if (!resourceId) {
        throw new Error("--resource-id requires a value");
      }
      options.resourceId = resourceId;
      index += 1;
      continue;
    }

    if (arg === "--action") {
      const action = args[index + 1];
      if (!action) {
        throw new Error("--action requires a value");
      }
      options.action = action;
      index += 1;
      continue;
    }

    if (arg === "--level") {
      const level = args[index + 1];
      if (!level) {
        throw new Error("--level requires a value");
      }
      options.level = level;
      index += 1;
      continue;
    }

    options.messageParts.push(arg);
  }

  if (!options.channel) {
    throw new Error("--channel is required");
  }

  return {
    action: options.action,
    channel: options.channel,
    level: options.level || undefined,
    message: options.messageParts.join(" ").trim() || undefined,
    resource: options.resource,
    resourceId: options.resourceId || undefined,
  };
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Length": Buffer.byteLength(payload),
          "Content-Type": "application/json",
        },
      },
      (res) => {
        let responseBody = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          responseBody += chunk;
        });
        res.on("end", () => {
          resolve({
            body: responseBody,
            statusCode: res.statusCode ?? 0,
          });
        });
      },
    );

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

export async function run(ctx) {
  const backendPort = ctx.readPort("BACKEND_PORT", 5402);
  const { action, channel, level, message, resource, resourceId } = parseArgs(
    ctx.rest,
  );
  const url = `http://localhost:${backendPort}/api/server-events`;

  const response = await postJson(url, {
    action,
    channel,
    level,
    message,
    resource,
    resourceId,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    ctx.output.error(`Server event failed: HTTP ${response.statusCode}`);
    if (response.body) {
      ctx.output.error(response.body);
    }
    return 1;
  }

  const messageSuffix = message ? `: ${message}` : "";
  ctx.output.info(
    `Published ${resource}.${action} to ${channel}${messageSuffix}`,
  );
  return 0;
}
