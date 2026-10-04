/* Paints the Hostinger Reach template on the page so contact CSS can
   match laden.no. embed.js only themes via an iframe and ignores page CSS. */
(function () {
  var node = document.querySelector("[data-reach-form]");
  if (!node) return;
  var id = node.getAttribute("data-reach-form");
  if (!id) return;
  node.removeAttribute("data-reach-form");
  node.classList.add("laden-reach");

  var API = "https://reach.hostinger.com";
  var DEDUPE = 1800000;

  function seen() {
    try {
      var t = localStorage.getItem("reach_imp_" + id);
      return !!(t && Date.now() - Number(t) < DEDUPE);
    } catch (e) {
      return false;
    }
  }
  function mark() {
    try { localStorage.setItem("reach_imp_" + id, String(Date.now())); } catch (e) {}
  }
  function impression(event) {
    fetch(API + "/api/v1/forms/" + encodeURIComponent(id) + "/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: event }),
      credentials: "omit",
      keepalive: true
    }).catch(function () {});
  }
  function trackView() {
    if (seen()) return;
    mark();
    impression("view");
  }
  function watchView() {
    if (!("IntersectionObserver" in window)) {
      trackView();
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      if (entries[0] && entries[0].isIntersecting) {
        trackView();
        obs.disconnect();
      }
    }, { threshold: 0.5 });
    obs.observe(node);
  }
  function hidden(el) {
    var n = el;
    while (n && n !== node) {
      if (n.hidden) return true;
      if (n.style && n.style.display === "none") return true;
      n = n.parentElement;
    }
    return false;
  }
  function sanitize(html) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("script,iframe,object,embed,link,meta,base").forEach(function (el) {
      el.remove();
    });
    doc.body.querySelectorAll("*").forEach(function (el) {
      Array.prototype.slice.call(el.attributes).forEach(function (attr) {
        var name = attr.name.toLowerCase();
        var val = attr.value || "";
        if (name.indexOf("on") === 0) el.removeAttribute(attr.name);
        if ((name === "href" || name === "src" || name === "action") && /^\s*javascript:/i.test(val)) {
          el.removeAttribute(attr.name);
        }
      });
      if (el.hasAttribute("data-reach-form")) {
        el.removeAttribute("data-reach-form");
        el.classList.add("laden-reach-card");
      }
    });
    return doc.body.innerHTML;
  }
  function clearErrors() {
    node.querySelectorAll(".reach-field-error").forEach(function (el) { el.remove(); });
  }
  function showError(text) {
    clearErrors();
    var btn = node.querySelector("[data-reach-submit]");
    var note = document.createElement("div");
    note.className = "reach-field-error";
    note.setAttribute("role", "alert");
    note.textContent = text;
    if (btn && btn.parentNode) btn.parentNode.insertBefore(note, btn.nextSibling);
  }
  function payload() {
    var email = node.querySelector('[data-reach-field="email"]');
    var data = { email: email ? email.value.trim() : "" };
    ["name", "surname", "phone"].forEach(function (key) {
      var el = node.querySelector('[data-reach-field="' + key + '"]');
      if (el && !hidden(el) && el.value.trim()) data[key] = el.value.trim();
    });
    return data;
  }
  function bind() {
    var btn = node.querySelector("[data-reach-submit]");
    var email = node.querySelector('[data-reach-field="email"]');
    if (!btn || !email) return;
    btn.addEventListener("click", function (event) {
      event.preventDefault();
      clearErrors();
      if (!email.value.trim() || (email.reportValidity && !email.reportValidity())) {
        email.focus();
        return;
      }
      btn.disabled = true;
      fetch(API + "/api/v1/forms/" + encodeURIComponent(id) + "/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
        credentials: "omit"
      }).then(function (res) {
        if (res.ok) return null;
        return res.json().catch(function () { return {}; }).then(function (body) {
          var err = new Error("submit");
          err.status = res.status;
          err.body = body;
          throw err;
        });
      }).then(function () {
        impression("submit");
        var card = node.querySelector(".laden-reach-card");
        var thanks = node.querySelector("[data-reach-thank-you]");
        if (card) card.style.display = "none";
        if (thanks) thanks.style.display = "block";
      }).catch(function () {
        btn.disabled = false;
        showError("Could not send. Use post@laden.no.");
      });
    });
  }

  fetch(API + "/api/v1/forms/" + encodeURIComponent(id), { credentials: "omit" })
    .then(function (res) {
      if (!res.ok) throw new Error("form");
      return res.json();
    })
    .then(function (json) {
      var data = json.data || json;
      if (!data.templateUrl || data.status !== "active") throw new Error("form");
      return fetch(data.templateUrl, { credentials: "omit" }).then(function (res) {
        if (!res.ok) throw new Error("template");
        return res.text();
      });
    })
    .then(function (html) {
      node.innerHTML = sanitize(html);
      bind();
      watchView();
    })
    .catch(function () {
      node.innerHTML = "";
    });
})();
