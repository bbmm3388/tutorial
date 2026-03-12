// ── Mark current page nav link as active ───────────────
(function () {
  var page = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (!page || page === "") page = "index.html";
  var pageLinks = document.querySelectorAll('nav a[href$=".html"]');
  pageLinks.forEach(function (a) {
    if (a.getAttribute("href") === page) a.classList.add("active");
  });
})();

// ── Section anchor highlighting (within-page) ──────────
(function () {
  const navLinks = document.querySelectorAll('nav a[href^="#"]');
  const sections = document.querySelectorAll("section.section[id]");

  if (!navLinks.length || !sections.length) return;

  const linkMap = {};
  navLinks.forEach(function (a) {
    var id = a.getAttribute("href").slice(1);
    linkMap[id] = a;
  });

  function setActive(id) {
    navLinks.forEach(function (a) {
      a.classList.remove("active");
    });
    if (linkMap[id]) linkMap[id].classList.add("active");
  }

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0,
    },
  );

  sections.forEach(function (sec) {
    observer.observe(sec);
  });
})();

// ── Complete formatting for JSON / code samples ───────
(function () {
  function escapeHtml(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function highlightRawJson(text) {
    var escaped = escapeHtml(text);

    // // comments in pseudo-JSON examples
    escaped = escaped.replace(/^(\s*)(\/\/.*)$/gm, function (_, indent, comment) {
      return indent + '<span class="c-cmt">' + comment + "</span>";
    });

    escaped = escaped.replace(
      /("(?:\\u[0-9a-fA-F]{4}|\\[^u]|[^\\"])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b)/g,
      function (match, stringToken, keySuffix, keywordToken, numberToken) {
        if (stringToken) {
          if (keySuffix) return '<span class="c-key">' + stringToken + "</span>" + keySuffix;
          return '<span class="c-str">' + stringToken + "</span>";
        }
        if (keywordToken) return '<span class="c-val">' + keywordToken + "</span>";
        if (numberToken) return '<span class="c-num">' + numberToken + "</span>";
        return match;
      },
    );

    return escaped;
  }

  function completePartialCode(html) {
    // Keep existing highlighted spans untouched; only complete plain fragments.
    var spans = [];
    var protectedHtml = html.replace(/<span class="c-[^"]+">[\s\S]*?<\/span>/g, function (m) {
      var token = "@@SPAN" + spans.length + "@@";
      spans.push(m);
      return token;
    });

    // JS object-style method labels: detailContent: async function (...) { ... }
    protectedHtml = protectedHtml.replace(
      /(^|\n)([ \t]*)([A-Za-z_$][\w$]*)(\s*:)/gm,
      function (_, lineStart, indent, name, colonPart) {
        return lineStart + indent + '<span class="c-tag">' + name + "</span>" + colonPart;
      },
    );

    protectedHtml = protectedHtml.replace(/@@SPAN(\d+)@@/g, function (_, idx) {
      return spans[Number(idx)] || "";
    });

    return protectedHtml;
  }

  document.querySelectorAll("pre code").forEach(function (code) {
    var html = code.innerHTML;
    var text = code.textContent.replace(/\r\n/g, "\n");
    var trimmed = text.trim();
    if (!trimmed) return;

    var hasHighlight = html.indexOf('class="c-') !== -1;
    var langEl = code.closest(".code-block")?.querySelector(".code-header .code-lang");
    var lang = (langEl ? langEl.textContent : "").trim().toLowerCase();

    // Raw JSON samples: no highlight spans yet.
    var looksJson =
      lang === "json" ||
      ((trimmed[0] === "{" || trimmed[0] === "[") &&
        (trimmed.indexOf(":") !== -1 || trimmed.indexOf('"') !== -1));

    if (!hasHighlight && looksJson) {
      code.innerHTML = highlightRawJson(text);
      return;
    }

    // Partially highlighted code: fill missing method-name formatting.
    if (hasHighlight) {
      code.innerHTML = completePartialCode(html);
    }
  });
})();
