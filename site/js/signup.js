/* Laden sign-up: posts to our own /newsletter/ endpoint, shows the result inline. */
(function () {
  "use strict";
  var forms = document.querySelectorAll("form[data-laden-signup], form.newsletter-form");
  Array.prototype.forEach.call(forms, function (form) {
    var hl = (document.documentElement.lang || "").toLowerCase(), pre = form.querySelector('input[name="lang"]');
    var lang = pre ? pre.value : (/^(nb|no|nn)/.test(hl) ? "nb" : "en");
    var status = form.querySelector(".signup-status");
    if (!status) { status = document.createElement("p"); status.className = "signup-status newsletter-status"; status.setAttribute("role", "status"); status.setAttribute("aria-live", "polite"); form.appendChild(status); }
    if (!form.querySelector('input[name="lang"]')) { var l = document.createElement("input"); l.type = "hidden"; l.name = "lang"; l.value = lang; form.appendChild(l); }
    form.addEventListener("submit", function (ev) {
      if (!window.fetch || !window.URLSearchParams) return;
      ev.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var data = new URLSearchParams(new FormData(form));
      if (btn) btn.disabled = true;
      status.removeAttribute("data-state"); status.textContent = lang === "nb" ? "Sender …" : "Sending …";
      fetch("/newsletter/", { method: "POST", body: data, headers: { "Accept": "application/json" }, credentials: "same-origin" })
        .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
        .then(function (j) {
          status.setAttribute("data-state", j.ok ? "ok" : "error");
          status.textContent = j.message || (lang === "nb" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again.");
          if (j.ok) form.reset();
        })
        .catch(function () { status.setAttribute("data-state", "error"); status.textContent = lang === "nb" ? "Noe gikk galt. Prøv igjen." : "Something went wrong. Please try again."; })
        .then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
