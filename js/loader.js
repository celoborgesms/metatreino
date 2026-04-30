(function() {
  var versao = window.METATREINO_BUILD || window.METATREINO_VERSION || "1.4.0";

  function adicionarCss(caminho) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = caminho + "?v=" + versao;
    document.head.appendChild(link);
  }

  function adicionarScript(caminho) {
    var script = document.createElement("script");
    script.src = caminho + "?v=" + versao;
    document.body.appendChild(script);
  }

  adicionarCss("css/style.css");

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() { adicionarScript("js/app.js"); });
  } else {
    adicionarScript("js/app.js");
  }
})();
