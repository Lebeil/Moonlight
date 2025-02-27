/// <reference path="../pb_data/types.d.ts" />

// Configuration CORS globale
routerAdd("OPTIONS", "/*", (c) => {
    c.response.header.set("Access-Control-Allow-Origin", "*");
    c.response.header.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.response.header.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    c.response.header.set("Access-Control-Max-Age", "86400");
    return c.json({});
});

// Ajouter les en-têtes CORS à toutes les réponses
onResponse((c) => {
    c.response.header.set("Access-Control-Allow-Origin", "*");
    c.response.header.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    c.response.header.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
    return c;
}); 