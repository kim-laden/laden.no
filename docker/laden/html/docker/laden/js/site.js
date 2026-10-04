(function () {
  var ENDPOINT = "";

  // Keep the chosen language across the static mirror routes.
  var isEnglish = document.documentElement.lang === "en";
  var languageKey = "laden-language";
  var storedLanguage = null;
  try { storedLanguage = window.localStorage.getItem(languageKey); } catch (error) {}
  var BASE = "";
  var route = window.location.pathname;
  var rel = route;
  var noRoute = isEnglish ? (rel.replace(/^\/en(?=\/|$)/, "") || "/") : rel;
  var ADDRESS = "post@laden.no";
  var kinds, labels, validation;

  function syncNav() {
    var navToggle = document.getElementById("nav-toggle");
    var navLabel = document.querySelector("label.nav-toggle");
    if (!navToggle || !navLabel) return;
    navLabel.setAttribute("aria-expanded", navToggle.checked ? "true" : "false");
  }

  document.addEventListener("keydown", function (event) {
    var navToggle = document.getElementById("nav-toggle");
    if (!navToggle) return;
    if (event.key === "Escape" && navToggle.checked) {
      navToggle.checked = false;
      syncNav();
      navToggle.focus();
    }
  });
  document.addEventListener("focusin", function (event) {
    var navToggle = document.getElementById("nav-toggle");
    if (!navToggle || !navToggle.checked) return;
    var header = navToggle.closest(".site-header");
    if (header && event.target instanceof Node && !header.contains(event.target)) {
      navToggle.checked = false;
      syncNav();
    }
  });

  function applyCopy() {
    isEnglish = document.documentElement.lang === "en";
    kinds = isEnglish ? {
    inquiry: {
      subject: "Enquiry to Laden AS",
      success: "Thanks. We reply with a proposal, not a newsletter."
    },
    contact: {
      subject: "Proposal for Laden AS",
      success: "Thanks. We reply with a personal proposal, not a newsletter."
    },
    course: {
      subject: "Courses and talks for Laden AS",
      success: "Thanks. We reply with a session plan, not a newsletter."
    }
  } : {
    inquiry: {
      subject: "Forespørsel til Laden AS",
      success: "Takk. Vi svarer med et forslag, ikke et nyhetsbrev."
    },
    contact: {
      subject: "Tilbud til Laden AS",
      success: "Takk. Vi svarer med et personlig tilbud, ikke et nyhetsbrev."
    },
    course: {
      subject: "Kurs og foredrag til Laden AS",
      success: "Takk. Vi svarer med et opplegg, ikke et nyhetsbrev."
    }
  };

  var labels = isEnglish ? {
    name: "Name", email: "Email", phone: "Phone", audience: "Business or personal",
    kind: "Type", message: "Message", topic: "Topic", count: "Number of people",
    place: "Location", date: "Preferred date"
  } : {
    name: "Navn", email: "E-post", phone: "Telefon", audience: "Bedrift eller privat",
    kind: "Type", message: "Melding", topic: "Tema", count: "Antall", place: "Sted", date: "Ønsket dato"
  };

  var validation = isEnglish ? {
    email: "Enter your email address.", name: "Enter your name.", message: "Briefly tell us what this is about.",
    topic: "Tell us what the session should cover.", count: "Tell us how many people will join.",
    place: "Enter a location, or online.", generic: "Please fill in this field.", validEmail: "Enter a valid email address.",
    shortName: "Enter your name.", shortMessage: "Briefly tell us what this is about.", shortTopic: "Tell us what the session should cover.",
    shortPlace: "Enter a location, or online.", phone: "Check the phone number, or leave it blank.",
    countInvalid: "Tell us how many people will join.", sending: "Sending", failed: "We could not send the message. Write to ",
    long: "The text is too long for your email app. Shorten it, or write to "
  } : {
    email: "Skriv inn e-postadressen din.", name: "Skriv inn navnet ditt.", message: "Skriv kort hva det dreier seg om.",
    topic: "Skriv hva opplegget skal handle om.", count: "Oppgi hvor mange som skal delta.",
    place: "Skriv sted, eller digitalt.", generic: "Fyll ut dette feltet.", validEmail: "Skriv inn en gyldig e-postadresse.",
    shortName: "Skriv inn navnet ditt.", shortMessage: "Skriv kort hva det dreier seg om.", shortTopic: "Skriv hva opplegget skal handle om.",
    shortPlace: "Skriv sted, eller digitalt.", phone: "Sjekk telefonnummeret, eller la feltet stå tomt.",
    countInvalid: "Oppgi hvor mange som skal delta.", sending: "Sender", failed: "Vi fikk ikke sendt meldingen. Skriv til ",
    long: "Teksten er for lang for e-postprogrammet. Kort den ned, eller skriv til "
  };
  }

  function messageFor(input) {
    var name = input.name;
    var value = input.value.trim();
    if (input.required && value === "") {
      if (name === "email") return validation.email;
      if (name === "name") return validation.name;
      if (name === "message") return validation.message;
      if (name === "topic") return validation.topic;
      if (name === "count") return validation.count;
      if (name === "place") return validation.place;
      return validation.generic;
    }
    if (name === "email" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return validation.validEmail;
    }
    if (name === "name" && value && value.length < 2) return validation.shortName;
    if (name === "message" && value && value.length < 12) return validation.shortMessage;
    if (name === "topic" && value && value.length < 4) return validation.shortTopic;
    if (name === "place" && value && value.length < 2) return validation.shortPlace;
    if (name === "phone" && value && value.replace(/\D/g, "").length < 8) {
      return validation.phone;
    }
    if (name === "count" && value && (!/^\d+$/.test(value) || Number(value) < 1)) {
      return validation.countInvalid;
    }
    return "";
  }

  function clearField(input) {
    var error = document.getElementById(input.getAttribute("aria-describedby"));
    input.removeAttribute("aria-invalid");
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  }

  function showFieldError(input, text) {
    var error = document.getElementById(input.getAttribute("aria-describedby"));
    input.setAttribute("aria-invalid", "true");
    if (error) {
      error.hidden = false;
      error.textContent = text;
    }
  }

  function showSuccess(form, text, viaMail) {
    var box = form.parentElement.querySelector(".form-success");
    if (!box) return;
    box.querySelector(".success-lead").textContent = text;
    var note = box.querySelector(".success-note");
    if (note) note.hidden = !viaMail;
    form.hidden = true;
    box.hidden = false;
    box.focus();
  }

  function bodyLines(form) {
    var lines = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === "submit" || el.name === "hp_field") return;
      var value = el.value.trim();
      if (!value) return;
      lines.push((labels[el.name] || el.name) + ": " + value);
    });
    return lines.join("\n");
  }

  function bindPage() {
    applyCopy();
    document.querySelectorAll("[data-language]").forEach(function (link) {
      if (link.dataset.ladenBound) return;
      link.dataset.ladenBound = "1";
      link.addEventListener("click", function () {
        try { window.localStorage.setItem(languageKey, link.getAttribute("data-language")); } catch (error) {}
      });
    });
    var navToggle = document.getElementById("nav-toggle");
    if (navToggle && !navToggle.dataset.ladenBound) {
      navToggle.dataset.ladenBound = "1";
      navToggle.addEventListener("change", syncNav);
    }
    syncNav();

    document.querySelectorAll("form[data-form]").forEach(function (form) {
    if (form.dataset.ladenBound) return;
    form.dataset.ladenBound = "1";
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () { clearField(input); });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var kind = kinds[form.getAttribute("data-form")];
      if (!kind) return;

      var honeypot = form.querySelector("[name=hp_field]");
      if (honeypot && honeypot.value.trim() !== "") {
        showSuccess(form, kind.success, false);
        return;
      }

      var firstInvalid = null;
      form.querySelectorAll("input, select, textarea").forEach(function (input) {
        if (!input.name || input.name === "hp_field" || input.type === "submit") return;
        var problem = messageFor(input);
        if (problem) {
          showFieldError(input, problem);
          if (!firstInvalid) firstInvalid = input;
        } else {
          clearField(input);
        }
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      var payload = {};
      Array.prototype.forEach.call(form.elements, function (el) {
        if (!el.name || el.name === "hp_field" || el.type === "submit") return;
        payload[el.name] = el.value.trim();
      });

      var submit = form.querySelector("[type=submit]");
      var original = submit ? submit.textContent : "";
      if (submit) {
        submit.disabled = true;
        submit.setAttribute("aria-busy", "true");
        submit.textContent = validation.sending;
      }

      var finish = function (ok, viaMail) {
        if (submit) {
          submit.disabled = false;
          submit.removeAttribute("aria-busy");
          submit.textContent = original;
        }
        if (ok) showSuccess(form, kind.success, viaMail);
      };

      if (ENDPOINT) {
        fetch(ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload)
        }).then(function (response) {
          if (!response.ok) throw new Error("bad status");
          finish(true, false);
        }).catch(function () {
          finish(false, false);
          var message = form.querySelector("[name=message], [name=topic]");
          showFieldError(message || form.querySelector("input"), validation.failed + ADDRESS + ".");
          if (message) message.focus();
        });
        return;
      }

      var href = "mailto:" + ADDRESS + "?subject=" + encodeURIComponent(kind.subject) + "&body=" + encodeURIComponent(bodyLines(form));
      if (href.length > 1900) {
        finish(false, false);
        var longField = form.querySelector("textarea");
        showFieldError(longField, validation.long + ADDRESS + ".");
        if (longField) longField.focus();
        return;
      }
      var link = document.createElement("a");
      link.href = href;
      document.body.appendChild(link);
      link.click();
      link.remove();
      finish(true, true);
    });
    });
  }

  window.__ladenBindPage = bindPage;
  bindPage();
})();
