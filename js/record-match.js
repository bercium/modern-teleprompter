const ready = (fn) => {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
};

ready(() => {
  const locationSelect = document.getElementById("match-location");
  const preview = document.getElementById("location-preview");

  const renderLocationPreview = () => {
    if (!locationSelect || !preview) return;
    const option = locationSelect.selectedOptions[0];
    if (!option) {
      preview.textContent = "";
      return;
    }

    const city = option.dataset.city?.trim();
    const country = option.dataset.country?.trim();
    const place = option.dataset.place?.trim();

    if (!city || !country) {
      preview.textContent = "";
      return;
    }

    preview.textContent = place ? `${city}, ${country} — ${place}` : `${city}, ${country}`;
  };

  if (locationSelect) {
    locationSelect.addEventListener("change", renderLocationPreview);
    renderLocationPreview();
  }

  const tiebreak = document.getElementById("tiebreak");
  const tiebreakBody = document.getElementById("tiebreak-body");

  if (tiebreak instanceof HTMLDetailsElement && tiebreakBody) {
    const setBodyHeight = () => {
      if (!tiebreakBody) return;
      if (tiebreak.open) {
        tiebreakBody.style.maxHeight = `${tiebreakBody.scrollHeight}px`;
      } else {
        tiebreakBody.style.maxHeight = "0px";
      }
    };

    setBodyHeight();

    tiebreak.addEventListener("toggle", () => {
      requestAnimationFrame(() => setBodyHeight());
    });

    window.addEventListener("resize", () => {
      if (tiebreak.open) {
        requestAnimationFrame(() => setBodyHeight());
      }
    });
  }
});
