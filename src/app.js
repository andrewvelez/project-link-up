// @ts-ignore - Bun supports text imports
import indexTemplate from "./templates/index.html" with { type: "text" };
// @ts-ignore
import itemsTemplate from "./templates/items.html" with { type: "text" };

/**
 * @typedef {Object} Todo
 * @property {number} id
 * @property {string} text
 *
 * @typedef {Object} AppOptions
 * @property {URL} publicDir
 */

const HTML_HEADERS = { "Content-Type": "text/html; charset=utf-8" };

/**
 * @param {AppOptions} options
 */
export function createHandler(options) {
  /** @type {Todo[]} */
  const todos = [];
  let nextId = 1;

  const publicDir = options.publicDir.href.endsWith("/") 
    ? options.publicDir 
    : new URL(options.publicDir.href + "/");

  return async function handleRequest(request) {
    const url = new URL(request.url);
    const method = request.method;

    // Route: GET /
    if (method === "GET" && url.pathname === "/") {
      const listHtml = renderTodoItems(todos);
      const pageHtml = indexTemplate.replace("<!-- SLOT: TODO_ITEMS -->", listHtml);
      return html(pageHtml);
    }

    // Route: POST /todos (HTMX)
    if (method === "POST" && url.pathname === "/todos") {
      const formData = await request.formData();
      const text = formData.get("text")?.toString().trim();

      if (text) {
        todos.push({ id: nextId++, text });
      }

      // Return only the items partial for HTMX
      return html(renderTodoItems(todos));
    }

    // Route: GET /static/*
    if (method === "GET" && url.pathname.startsWith("/static/")) {
      return serveStatic(url.pathname, publicDir);
    }

    return new Response("Not Found", { status: 404 });
  };
}

/**
 * Logic-less "templating" helper. 
 * Since we aren't using a heavy engine like Handlebars, we handle the loop in JS
 * and inject the result into the markup template.
 * @param {Todo[]} todos
 * @returns {string}
 */
function renderTodoItems(todos) {
  if (todos.length === 0) {
    return `<li class="empty-state"><em>No todos yet.</em></li>`;
  }

  return todos
    .map(todo => `<li>${escapeHtml(todo.text)}</li>`)
    .join("");
}

/**
 * Serves static assets
 * @param {string} pathname
 * @param {URL} publicDir
 */
async function serveStatic(pathname, publicDir) {
  const fileName = pathname.replace("/static/", "");
  let file = Bun.file(new URL(fileName, publicDir));

  // Fallback for htmx if not in public folder
  if (!(await file.exists()) && fileName === "htmx.min.js") {
    file = Bun.file(import.meta.resolve("htmx.org/dist/htmx.min.js"));
  }

  if (!(await file.exists())) return new Response("Not Found", { status: 404 });

  return new Response(file);
}

function html(body) {
  return new Response(body, { headers: HTML_HEADERS });
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[m]);
}