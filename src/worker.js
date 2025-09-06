/**
 * Simple worker for SPA routing with Cloudflare Workers Assets
 * This worker handles routing for a React Single Page Application
 */

const DEBUG = true;

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      if (DEBUG) {
        console.log(`Worker handling request: ${pathname}`);
      }

      // Try to get the static asset first
      let response = await env.ASSETS.fetch(request);
      
      if (response.status === 404) {
        // Check if this should be handled by SPA routing
        const isSPARoute = !pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|txt|xml)$/i);
        
        if (isSPARoute) {
          if (DEBUG) {
            console.log(`Serving index.html for SPA route: ${pathname}`);
          }
          
          // For SPA routes, serve index.html
          const indexRequest = new Request(`${url.origin}/index.html`, {
            method: request.method,
            headers: request.headers,
          });
          
          response = await env.ASSETS.fetch(indexRequest);
          
          if (response.ok) {
            // Return the index.html with 200 status for SPA routing
            response = new Response(response.body, {
              status: 200,
              headers: response.headers,
            });
          }
        }
      }

      // Add security headers to all responses
      const newResponse = new Response(response.body, response);
      newResponse.headers.set("X-XSS-Protection", "1; mode=block");
      newResponse.headers.set("X-Content-Type-Options", "nosniff");
      newResponse.headers.set("X-Frame-Options", "DENY");
      newResponse.headers.set("Referrer-Policy", "unsafe-url");
      
      // Set proper content type based on file extension
      const contentType = getContentType(pathname);
      if (contentType && response.ok) {
        newResponse.headers.set("Content-Type", contentType);
      }

      if (DEBUG && response.status === 404) {
        console.log(`404 for: ${pathname}`);
      }

      return newResponse;
      
    } catch (error) {
      if (DEBUG) {
        console.error(`Worker error: ${error.message}`);
        return new Response(`Worker Error: ${error.message}`, { status: 500 });
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

/**
 * Get the appropriate MIME type based on file extension
 */
function getContentType(pathname) {
  const ext = pathname.split('.').pop()?.toLowerCase();
  
  const mimeTypes = {
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  };
  
  return mimeTypes[ext] || null;
}
