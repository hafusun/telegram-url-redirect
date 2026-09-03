const TARGET_URL = "https://akariko-bck2.sankuria.sbs/stream/master.m3u?mode=hls";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/latest") {
      const key = await env.KV.get("latest_key");

      if (!key) {
        return new Response("Latest key is not set.", { status: 503 });
      }

      const target = new URL(TARGET_URL);
      target.searchParams.set("pass", key);

      return Response.redirect(target.toString(), 302);
    }

    if (request.method === "POST" && url.pathname === "/update") {
      const apiKey = request.headers.get("X-API-Key");

      if (!env.UPDATE_API_KEY || apiKey !== env.UPDATE_API_KEY) {
        return new Response("Unauthorized.", { status: 401 });
      }

      let data;
      try {
        data = await request.json();
      } catch {
        return new Response("Invalid JSON.", { status: 400 });
      }

      if (typeof data.key !== "string" || data.key.trim() === "") {
        return new Response("key is required.", { status: 400 });
      }

      const key = data.key.trim();
      await env.KV.put("latest_key", key);

      const target = new URL(TARGET_URL);
      target.searchParams.set("key", key);

      return Response.json({
        success: true,
        url: target.toString()
      });
    }

    if (request.method === "GET" && url.pathname === "/status") {
      const key = await env.KV.get("latest_key");

      if (!key) {
        return Response.json({
          configured: false
        });
      }

      const target = new URL(TARGET_URL);
      target.searchParams.set("key", key);

      return Response.json({
        configured: true,
        url: target.toString()
      });
    }

    if (request.method === "GET" && url.pathname === "/") {
      return Response.json({
        service: "URL Redirect Service",
        latest: "/latest",
        update: "/update",
        status: "/status"
      });
    }

    return new Response("Not Found.", { status: 404 });
  }
};
