import { describe, expect, test } from "bun:test";
import { createHandler } from "../src/app.js";

/**
 * @param {(request: Request) => Promise<Response>} handler
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
function request(handler, path, init) {
  return handler(new Request(`http://localhost${path}`, init));
}

describe("app", () => {
  test("GET / returns the page", async () => {
    const app = createHandler();

    const response = await request(app, "/");
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Bun + htmx");
    expect(body).toContain('hx-post="/todos"');
    expect(body).toContain('hx-target="#todo-list"');
  });

  test("POST /todos returns the updated todo list partial", async () => {
    const app = createHandler();

    const response = await request(app, "/todos", {
      method: "POST",
      body: new URLSearchParams({ text: "Learn htmx" }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("<li");
    expect(body).toContain("Learn htmx");
  });

  test("POST /todos escapes HTML", async () => {
    const app = createHandler();

    const response = await request(app, "/todos", {
      method: "POST",
      body: new URLSearchParams({ text: "<script>alert(1)</script>" }),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    });

    const body = await response.text();

    expect(body).toContain("&lt;script&gt;");
    expect(body).not.toContain("<script>");
  });
});