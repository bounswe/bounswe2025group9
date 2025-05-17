import { useEffect } from "react";

export default function SwaggerPage() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js";
    script.onload = () => {
      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
      });
    };
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css"
      />
      <div id="swagger-ui" />
    </div>
  );
}
