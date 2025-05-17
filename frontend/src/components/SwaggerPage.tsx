import { useEffect } from "react";

// swagger ui component that loads and displays api documentation
const SwaggerPage = () => {
  useEffect(() => {
    // create and apply a reset style to remove app styles
    const resetStyle = document.createElement("style");
    resetStyle.id = "swagger-reset-styles";
    resetStyle.textContent = `
      /* reset app-wide styles affecting swagger */
      body {
        margin: 0;
        padding: 0;
        background: white;
      }
      #swagger-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 9999;
        background: white;
        overflow: auto;
      }
      /* hide other app elements */
      #root > *:not(#swagger-container) {
        display: none !important;
      }
    `;
    document.head.appendChild(resetStyle);
    
    // create script element for swagger
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui-bundle.js";
    script.id = "swagger-script";
    
    // create stylesheet for swagger
    const stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.href = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/swagger-ui.css";
    stylesheet.id = "swagger-styles";
    document.head.appendChild(stylesheet);
    
    // initialize swagger when script loads
    script.onload = () => {
      window.SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: "#swagger-ui",
      });
    };
    document.body.appendChild(script);
    
    // cleanup function to remove script and styles on unmount
    return () => {
      const scriptElement = document.getElementById("swagger-script");
      if (scriptElement) scriptElement.remove();
      
      const styleElement = document.getElementById("swagger-styles");
      if (styleElement) styleElement.remove();
      
      const resetStyleElement = document.getElementById("swagger-reset-styles");
      if (resetStyleElement) resetStyleElement.remove();
      
      // remove any swagger-ui elements that might have been created
      const swaggerElements = document.querySelectorAll(".swagger-ui");
      swaggerElements.forEach(el => el.remove());
    };
  }, []);

  return (
    <div id="swagger-container">
      <div id="swagger-ui" />
    </div>
  );
}

export default SwaggerPage
