class BundleProductCard extends HTMLElement {
  constructor() {
    super();

    const template = this.querySelector("template[shadow-root-template]");
    if (template) {
      const shadowRoot = this.attachShadow({ mode: "open" });
      shadowRoot.appendChild(template.content.cloneNode(true));

      this.addButton = shadowRoot.querySelector("#add-bundle-to-cart");
      this.priceEl = shadowRoot.querySelector(
        ".product-bundle-item__info-price .price"
      );
      this.oldPriceEl = shadowRoot.querySelector(
        ".product-bundle-item__info-price .old-price"
      );
      this.variantIdInput = shadowRoot.querySelector(
        ".bundle-variant-id-input"
      );
    } else {
      this.addButton = this.querySelector("#add-bundle-to-cart");
      this.priceEl = this.querySelector(
        ".product-bundle-item__info-price .price"
      );
      this.oldPriceEl = this.querySelector(
        ".product-bundle-item__info-price .old-price"
      );
      this.variantIdInput = this.querySelector(".bundle-variant-id-input");
    }

    const dataId = this.dataset.bundleDataId;
    const dataScript = document.getElementById(dataId);
    let bundleData = {};

    if (dataScript) {
      try {
        bundleData = JSON.parse(dataScript.textContent);
      } catch (e) {
        console.error("Error parsing bundle data JSON", e);
      }
    } else {
      console.error("Bundle data script not found");
    }

    this.allBundleVariants = bundleData.bundleVariants || [];
    this.allBundleOptions = bundleData.bundleOptions || [];
    this.mainVariantId = bundleData.mainVariantId;

    this.currentVariant =
      this.allBundleVariants.find((v) => v.available) ||
      this.allBundleVariants[0];

    if (this.addButton) {
      this.originalButtonText = this.addButton.textContent;
    }
  }

  connectedCallback() {
    this.initSwiper();
    this.setupVariantListeners();
    this.handleVariantChange();
    this.setupAddToCart();
  }

  /* --- SWIPER --- */
  initSwiper() {
    const root = this.shadowRoot || this;
    const swiperContainer = root.querySelector(".swiper-container");
    const prevButton = root.querySelector(".swiper-button-prev");
    const nextButton = root.querySelector(".swiper-button-next");
    const paginationEl = root.querySelector(".swiper-pagination");

    if (typeof Swiper === "undefined" || !swiperContainer) {
      console.error("Swiper library or container not found.");
      return;
    }

    const swiperIdSelector = `#${swiperContainer.id}`;

    this.swiperInstance = new Swiper(swiperContainer, {
      slidesPerView: 1,
      loop: true,
      navigation: {
        nextEl: nextButton,
        prevEl: prevButton,
      },
    });
  }

  updateSwiperImage(index) {
    if (this.swiperInstance) {
      this.swiperInstance.slideToLoop(index);
    }
  }

  setupVariantListeners() {
    const root = this.shadowRoot || this;
    const selectors = root.querySelectorAll(".js-bundle-selector");

    selectors.forEach((selector) => {
      selector.addEventListener("change", this.handleVariantChange.bind(this));
    });
  }

  handleVariantChange() {
    const selectedOptions = {};
    const root = this.shadowRoot || this;

    root
      .querySelectorAll(
        ".bundle-option-dropdown, .bundle-swatch-picker input:checked"
      )
      .forEach((input) => {
        const positionEl = input.closest("[data-option-position]") || input;
        const position = positionEl.dataset.optionPosition;

        if (position) {
          selectedOptions[`option${position}`] = input.value;
        }
      });

    const newVariant = this.allBundleVariants.find((variant) => {
      return (
        variant.option1 === selectedOptions.option1 &&
        (variant.option2
          ? variant.option2 === selectedOptions.option2
          : true) &&
        (variant.option3 ? variant.option3 === selectedOptions.option3 : true)
      );
    });

    if (newVariant) {
      this.currentVariant = newVariant;

      if (newVariant.featured_media) {
        this.updateSwiperImage(newVariant.featured_media.position - 1);
      }

      this.updateVariantIdInput(newVariant.id);

      this.updateStockAndButton(newVariant);
    } else {
      this.updateVariantIdInput(null);
      this.updateStockAndButton(null);
    }
  }

  updateVariantIdInput(variantId) {
    if (this.variantIdInput) {
      this.variantIdInput.value = variantId || "";
    }
  }

  updateStockAndButton(variant) {
    if (!this.addButton) return;

    const available = variant && variant.available;

    if (available) {
      this.addButton.disabled = false;
      this.addButton.textContent = this.originalButtonText;
      this.addButton.classList.remove("disabled", "sold-out");
    } else {
      this.addButton.disabled = true;
      this.addButton.textContent = "Sold Out";
      this.addButton.classList.add("disabled", "sold-out");
    }

    if (this.priceEl && variant) {
      const price = variant.price / 100;
      const comparePrice = variant.compare_at_price / 100;

      this.priceEl.textContent = `$${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })}`;

      if (this.oldPriceEl) {
        if (comparePrice > price) {
          this.oldPriceEl.textContent = `$${comparePrice.toLocaleString(
            "en-US",
            { minimumFractionDigits: 2 }
          )}`;
          this.oldPriceEl.style.display = "inline";
        } else {
          this.oldPriceEl.textContent = "";
          this.oldPriceEl.style.display = "none";
        }
      }
    }

    this.addButton.setAttribute("aria-disabled", String(!available));
  }

  getMainVariantId() {
    const mainVariantInput = document.querySelector(
      'form[action="/cart/add"] input[name="id"]'
    );

    if (mainVariantInput) {
      return mainVariantInput.value;
    }

    return this.mainVariantId;
  }

  setupAddToCart() {
    if (this.addButton) {
      this.addButton.addEventListener("click", this.handleAddToCart.bind(this));
    }
  }

  async handleAddToCart() {
    const mainVariantId = this.getMainVariantId();
    const bundleVariantId = this.variantIdInput
      ? this.variantIdInput.value
      : null;

    if (!mainVariantId || !bundleVariantId) {
      return;
    }

    this.addButton.disabled = true;

    const items = [
      {
        id: mainVariantId,
        quantity: 1,
        properties: { _bundle_applied: "dynamic-10-off" },
      },
      {
        id: bundleVariantId,
        quantity: 1,
        properties: { _bundle_applied: "dynamic-10-off" },
      },
    ];

    try {
      const response = await fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items }),
      });

      if (response.ok) {
        window.location.href = window.routes?.cart_url || "/cart";
      } else {
        const errorData = await response.json();
        console.log(
          `Error al añadir al carrito: ${
            errorData.description || errorData.message
          }`
        );
      }
    } catch (e) {
      console.log(
        "Network failed when adding items to the cart. Please try again"
      );
    } finally {
      this.addButton.disabled = false;
    }
  }
}

customElements.define("bundle-product-card", BundleProductCard);
