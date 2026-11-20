/**
 * SHOEX IMPORTADOS - Sistema da Loja Virtual
 * Gerenciamento de catálogo, filtros, carrinho, detalhes, CEP, cupons e checkout
 */

// Estado da Aplicação
const appState = {
  products: SHOEX_PRODUCTS,
  filteredProducts: [...SHOEX_PRODUCTS],
  cart: [],
  favorites: [],
  selectedProduct: null,
  selectedSize: null,
  activeCoupon: null,
  shippingCost: 0,
  shippingZip: "",
  activeFilters: {
    brand: "all",
    category: "all",
    gender: "all",
    size: "all",
    search: "",
    sortBy: "featured",
    maxPrice: 4500
  },
  checkout: {
    step: 1,
    paymentMethod: "pix",
    customer: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      cep: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: ""
    },
    card: {
      number: "",
      name: "",
      expiry: "",
      cvv: "",
      installments: 1
    }
  }
};

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
  loadStoredData();
  initFlashSaleTimer();
  renderProducts();
  updateCartBadge();
  updateFavoritesBadge();
  setupEventListeners();
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Carregar dados salvos no LocalStorage
function loadStoredData() {
  try {
    const savedCart = localStorage.getItem("shoex_cart");
    if (savedCart) {
      appState.cart = JSON.parse(savedCart);
    }
    const savedFavs = localStorage.getItem("shoex_favorites");
    if (savedFavs) {
      appState.favorites = JSON.parse(savedFavs);
    }
  } catch (e) {
    console.warn("Erro ao carregar dados locais:", e);
  }
}

// Salvar dados no LocalStorage
function saveCart() {
  try {
    localStorage.setItem("shoex_cart", JSON.stringify(appState.cart));
    updateCartBadge();
  } catch (e) {
    console.error("Erro ao salvar carrinho:", e);
  }
}

function saveFavorites() {
  try {
    localStorage.setItem("shoex_favorites", JSON.stringify(appState.favorites));
    updateFavoritesBadge();
  } catch (e) {
    console.error("Erro ao salvar favoritos:", e);
  }
}

// Cronômetro da Flash Sale
function initFlashSaleTimer() {
  const timerEl = document.getElementById("flash-timer");
  if (!timerEl) return;

  // 05 horas, 42 minutos e 18 segundos
  let totalSeconds = 5 * 3600 + 42 * 60 + 18;

  setInterval(() => {
    if (totalSeconds <= 0) {
      totalSeconds = 24 * 3600; // Reinicia ciclo de 24h
    }
    totalSeconds--;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n) => String(n).padStart(2, "0");
    timerEl.innerHTML = `
      <span class="bg-black/50 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded font-mono">${pad(hours)}</span> :
      <span class="bg-black/50 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded font-mono">${pad(minutes)}</span> :
      <span class="bg-black/50 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded font-mono">${pad(seconds)}</span>
    `;
  }, 1000);
}

// Formatação Monetária BRL
function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

// Renderização dos Produtos na Vitrine
function renderProducts() {
  const container = document.getElementById("products-grid");
  const countEl = document.getElementById("results-count");
  if (!container) return;

  applyFilters();

  if (countEl) {
    countEl.textContent = `${appState.filteredProducts.length} modelo(s) encontrado(s)`;
  }

  if (appState.filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-[#14181F] rounded-2xl border border-gray-800 p-8">
        <div class="w-16 h-16 mx-auto mb-4 bg-purple-900/30 text-purple-400 rounded-full flex items-center justify-center">
          <i data-lucide="package-search" class="w-8 h-8"></i>
        </div>
        <h3 class="text-xl font-bold text-white mb-2">Nenhum tênis encontrado com esses filtros</h3>
        <p class="text-gray-400 mb-6 max-w-md mx-auto">Tente ajustar a marca, numeração ou limpar os termos pesquisados.</p>
        <button onclick="resetAllFilters()" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition">
          Limpar Filtros
        </button>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  container.innerHTML = appState.filteredProducts.map(p => {
    const isFav = appState.favorites.includes(p.id);
    const pixPrice = p.price * 0.90; // 10% no PIX
    const installmentPrice = p.price / 10;

    return `
      <div class="product-card bg-[#14181F] border border-[#222936] rounded-2xl overflow-hidden flex flex-col justify-between group">
        <!-- Topo da Imagem e Badges -->
        <div class="relative bg-gradient-to-b from-[#1c222c] to-[#14181F] p-5 aspect-square flex items-center justify-center overflow-hidden cursor-pointer" onclick="openProductModal('${p.id}')">
          <span class="absolute top-3 left-3 text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md shadow-lg ${
            p.badge.includes('RARO') || p.badge.includes('EXCLUSIVA')
              ? 'badge-drop'
              : 'bg-purple-900/90 text-purple-200 border border-purple-500/40'
          }">
            ${p.badge}
          </span>

          <button 
            onclick="event.stopPropagation(); toggleFavorite('${p.id}')"
            class="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/80 backdrop-blur-md flex items-center justify-center transition ${isFav ? 'text-red-500' : 'text-gray-400 hover:text-white'}"
            title="${isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"
          >
            <i data-lucide="heart" class="w-5 h-5 ${isFav ? 'fill-red-500' : ''}"></i>
          </button>

          <img 
            src="${p.images[0]}" 
            alt="${p.name}" 
            loading="lazy" 
            class="product-img object-contain w-full h-full drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)]"
          />

          <!-- Quick View Hover Bar -->
          <div class="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
            <button class="w-full py-2 bg-purple-600/95 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-lg flex items-center justify-center gap-1.5 backdrop-blur-sm">
              <i data-lucide="eye" class="w-3.5 h-3.5"></i> Espiar Detalhes
            </button>
          </div>
        </div>

        <!-- Conteúdo do Card -->
        <div class="p-5 flex flex-col flex-1 justify-between">
          <div>
            <div class="flex items-center justify-between text-xs text-purple-400 font-semibold mb-1">
              <span class="uppercase tracking-wider">${p.brand}</span>
              <span class="flex items-center gap-1 text-amber-400">
                <i data-lucide="star" class="w-3.5 h-3.5 fill-amber-400"></i> ${p.rating} (${p.reviewsCount})
              </span>
            </div>

            <h3 onclick="openProductModal('${p.id}')" class="font-bold text-white text-sm line-clamp-2 hover:text-purple-400 cursor-pointer transition mb-3 leading-snug">
              ${p.name}
            </h3>

            <!-- Grade de tamanhos disponíveis rápida -->
            <div class="flex items-center gap-1 flex-wrap mb-4">
              <span class="text-[11px] text-gray-400 mr-1">Tam:</span>
              ${p.sizes.slice(0, 5).map(s => `
                <span class="text-[11px] bg-[#1c232f] text-gray-300 px-1.5 py-0.5 rounded border border-gray-700/60 font-mono">${s}</span>
              `).join('')}
              ${p.sizes.length > 5 ? `<span class="text-[10px] text-gray-400">+${p.sizes.length - 5}</span>` : ''}
            </div>
          </div>

          <!-- Preços estilo Netshoes -->
          <div class="pt-3 border-t border-gray-800/80">
            <div class="flex items-baseline gap-2 mb-1">
              <span class="text-xs text-gray-400 line-through">${formatBRL(p.originalPrice)}</span>
              <span class="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                -${p.discount}%
              </span>
            </div>

            <div class="text-xl font-extrabold text-white mb-0.5">
              ${formatBRL(p.price)}
            </div>

            <div class="text-xs text-emerald-400 font-semibold mb-1">
              ${formatBRL(pixPrice)} <span class="text-[10px] text-gray-400 font-normal">no PIX (10% OFF)</span>
            </div>

            <div class="text-[11px] text-gray-400 mb-4">
              ou <span class="text-white font-medium">10x de ${formatBRL(installmentPrice)}</span> sem juros
            </div>

            <button 
              onclick="openProductModal('${p.id}')" 
              class="w-full py-2.5 bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              <i data-lucide="shopping-bag" class="w-4 h-4"></i> Comprar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Lógica de Filtros
function applyFilters() {
  const { brand, category, gender, size, search, sortBy, maxPrice } = appState.activeFilters;

  appState.filteredProducts = appState.products.filter(p => {
    // Filtro de Marca
    if (brand !== "all" && p.brand.toLowerCase() !== brand.toLowerCase()) {
      return false;
    }
    // Filtro de Categoria
    if (category !== "all" && !p.category.toLowerCase().includes(category.toLowerCase())) {
      return false;
    }
    // Filtro de Gênero
    if (gender !== "all" && p.gender.toLowerCase() !== gender.toLowerCase() && p.gender !== "Unissex") {
      return false;
    }
    // Filtro de Tamanho
    if (size !== "all" && !p.sizes.includes(Number(size))) {
      return false;
    }
    // Filtro de Preço Máximo
    if (p.price > maxPrice) {
      return false;
    }
    // Filtro de Busca
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand.toLowerCase().includes(q);
      const matchCategory = p.category.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchCategory && !matchSku) {
        return false;
      }
    }
    return true;
  });

  // Ordenação
  if (sortBy === "price-asc") {
    appState.filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-desc") {
    appState.filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === "discount") {
    appState.filteredProducts.sort((a, b) => b.discount - a.discount);
  } else if (sortBy === "rating") {
    appState.filteredProducts.sort((a, b) => b.rating - a.rating);
  }
}

// Filtro rápido por marca clicando nos botões
function filterByBrand(brandName) {
  appState.activeFilters.brand = brandName;
  updateBrandButtons();
  renderProducts();

  // Rolar suavemente até a vitrine
  const showcase = document.getElementById("vitrine");
  if (showcase) {
    showcase.scrollIntoView({ behavior: "smooth" });
  }
}

function updateBrandButtons() {
  const buttons = document.querySelectorAll(".brand-filter-btn");
  buttons.forEach(btn => {
    const brand = btn.getAttribute("data-brand");
    if (brand === appState.activeFilters.brand) {
      btn.classList.add("bg-purple-600", "text-white", "border-purple-400");
      btn.classList.remove("bg-[#181E27]", "text-gray-300", "border-gray-800");
    } else {
      btn.classList.remove("bg-purple-600", "text-white", "border-purple-400");
      btn.classList.add("bg-[#181E27]", "text-gray-300", "border-gray-800");
    }
  });
}

function resetAllFilters() {
  appState.activeFilters = {
    brand: "all",
    category: "all",
    gender: "all",
    size: "all",
    search: "",
    sortBy: "featured",
    maxPrice: 4500
  };

  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";

  const priceSlider = document.getElementById("price-range");
  if (priceSlider) priceSlider.value = 4500;
  const priceDisplay = document.getElementById("price-display");
  if (priceDisplay) priceDisplay.textContent = formatBRL(4500);

  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) sortSelect.value = "featured";

  updateBrandButtons();
  renderProducts();
  showToast("Filtros redefinidos");
}

// Alternar Favoritos
function toggleFavorite(productId) {
  const index = appState.favorites.indexOf(productId);
  if (index > -1) {
    appState.favorites.splice(index, 1);
    showToast("Removido dos favoritos");
  } else {
    appState.favorites.push(productId);
    showToast("Adicionado aos favoritos! ❤️");
  }
  saveFavorites();
  renderProducts();
}

function updateFavoritesBadge() {
  const badge = document.getElementById("fav-badge");
  if (badge) {
    const count = appState.favorites.length;
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }
}

// Modal de Favoritos
function openFavoritesModal() {
  const modal = document.getElementById("favorites-modal");
  const list = document.getElementById("favorites-list");
  if (!modal || !list) return;

  const favProducts = appState.products.filter(p => appState.favorites.includes(p.id));

  if (favProducts.length === 0) {
    list.innerHTML = `
      <div class="text-center py-12 text-gray-400">
        <i data-lucide="heart-off" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
        <p class="font-bold text-lg text-white mb-1">Sua lista de desejos está vazia</p>
        <p class="text-sm">Clique no ícone de coração nos tênis para salvá-los aqui.</p>
      </div>
    `;
  } else {
    list.innerHTML = favProducts.map(p => `
      <div class="flex items-center gap-4 bg-[#14181F] p-3 rounded-xl border border-gray-800">
        <img src="${p.images[0]}" alt="${p.name}" class="w-16 h-16 object-contain bg-[#1D232D] rounded-lg p-1" />
        <div class="flex-1 min-w-0">
          <p class="text-xs text-purple-400 font-bold uppercase">${p.brand}</p>
          <h4 class="text-sm font-bold text-white truncate">${p.name}</h4>
          <p class="text-sm font-extrabold text-emerald-400">${formatBRL(p.price)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="openProductModal('${p.id}'); closeFavoritesModal();" class="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition">
            Ver
          </button>
          <button onclick="toggleFavorite('${p.id}'); openFavoritesModal();" class="p-1.5 text-gray-400 hover:text-red-400 transition" title="Remover">
            <i data-lucide="trash-2" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `).join("");
  }

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeFavoritesModal() {
  const modal = document.getElementById("favorites-modal");
  if (modal) modal.classList.add("hidden");
}

// Modal de Detalhes do Produto
function openProductModal(productId) {
  const product = appState.products.find(p => p.id === productId);
  if (!product) return;

  appState.selectedProduct = product;
  appState.selectedSize = product.sizes[0] || null;

  const modal = document.getElementById("product-modal");
  const content = document.getElementById("product-modal-content");
  if (!modal || !content) return;

  const pixPrice = product.price * 0.90;
  const installmentPrice = product.price / 10;

  content.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- Coluna da Galeria de Fotos -->
      <div>
        <div class="relative bg-gradient-to-b from-[#1C222C] to-[#14181F] rounded-2xl p-6 aspect-square flex items-center justify-center border border-gray-800">
          <span class="absolute top-4 left-4 badge-drop text-xs uppercase px-3 py-1 rounded-md">
            ${product.badge}
          </span>
          <span class="absolute top-4 right-4 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-md font-bold flex items-center gap-1">
            <i data-lucide="shield-check" class="w-3.5 h-3.5"></i> 100% Autêntico
          </span>
          <img id="main-product-img" src="${product.images[0]}" alt="${product.name}" class="w-full h-full object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.7)]" />
        </div>

        <!-- Miniaturas -->
        <div class="flex gap-3 mt-4 overflow-x-auto pb-1">
          ${product.images.map((img, idx) => `
            <button 
              onclick="document.getElementById('main-product-img').src = '${img}'; highlightThumb(this);"
              class="w-20 h-20 rounded-xl bg-[#1C222C] border-2 ${idx === 0 ? 'border-purple-500' : 'border-gray-800'} p-1.5 flex-shrink-0 transition hover:border-purple-400 thumb-btn"
            >
              <img src="${img}" alt="Thumb ${idx + 1}" class="w-full h-full object-contain" />
            </button>
          `).join('')}
        </div>

        <!-- Garantia Shoex Netshoes -->
        <div class="mt-6 bg-[#161B22] border border-gray-800 rounded-xl p-4 space-y-2 text-xs text-gray-300">
          <div class="flex items-center gap-2 text-emerald-400 font-bold">
            <i data-lucide="check-circle" class="w-4 h-4"></i> Certificado de Autenticidade Internacional Incluso
          </div>
          <p class="text-gray-400">Produto inspecionado por especialistas antes do envio com lacre anti-violação numerado.</p>
        </div>
      </div>

      <!-- Coluna de Especificações & Compra -->
      <div class="flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between text-xs text-purple-400 font-bold uppercase tracking-wider mb-1">
            <span>${product.brand} • ${product.category}</span>
            <span class="text-gray-400 font-mono">SKU: ${product.sku}</span>
          </div>

          <h2 class="text-2xl font-extrabold text-white mb-2 leading-tight">${product.name}</h2>

          <div class="flex items-center gap-3 mb-4 text-xs">
            <div class="flex items-center text-amber-400 font-bold">
              <i data-lucide="star" class="w-4 h-4 fill-amber-400 mr-1"></i> ${product.rating}
            </div>
            <span class="text-gray-500">•</span>
            <span class="text-gray-300">${product.reviewsCount} avaliações verificadas</span>
            <span class="text-gray-500">•</span>
            <span class="text-cyan-400 font-medium">${product.origin}</span>
          </div>

          <!-- Preços -->
          <div class="bg-[#181E27] p-4 rounded-xl border border-gray-800 mb-6">
            <div class="flex items-baseline gap-2 mb-1">
              <span class="text-sm text-gray-400 line-through">${formatBRL(product.originalPrice)}</span>
              <span class="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">Economia de ${product.discount}%</span>
            </div>
            <div class="text-3xl font-extrabold text-white mb-1">
              ${formatBRL(product.price)}
            </div>
            <div class="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
              <i data-lucide="zap" class="w-4 h-4 fill-emerald-400"></i> ${formatBRL(pixPrice)} à vista no PIX com 10% OFF
            </div>
            <div class="text-xs text-gray-400">
              Ou até <span class="text-white font-semibold">10x de ${formatBRL(installmentPrice)} sem juros</span> no cartão
            </div>
          </div>

          <!-- Seletor de Tamanho BR -->
          <div class="mb-6">
            <div class="flex items-center justify-between mb-2">
              <label class="text-xs font-bold uppercase text-gray-300 tracking-wider">
                Selecione o Tamanho (BR):
              </label>
              <button onclick="showToast('Guia de Tamanhos: Recomendamos pedir seu número habitual BR.')" class="text-xs text-purple-400 hover:text-purple-300 underline">
                Tabela de Medidas
              </button>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-7 gap-2">
              ${product.sizes.map(size => `
                <button 
                  onclick="selectProductSize(${size}, this)"
                  class="size-btn py-2.5 rounded-lg border border-gray-700 bg-[#161B24] text-white font-bold text-sm hover:border-purple-400 transition ${size === appState.selectedSize ? 'active' : ''}"
                >
                  ${size}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Simulador de Frete com CEP -->
          <div class="bg-[#14181F] p-4 rounded-xl border border-gray-800 mb-6">
            <label class="block text-xs font-bold uppercase text-gray-400 mb-2">
              Calcular Frete e Prazo de Entrega:
            </label>
            <div class="flex gap-2">
              <input 
                type="text" 
                id="modal-cep-input" 
                placeholder="00000-000" 
                maxlength="9" 
                class="flex-1 bg-[#1C222C] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              <button 
                onclick="simulateShipping()" 
                class="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg transition"
              >
                Calcular
              </button>
            </div>
            <div id="modal-shipping-result" class="mt-3 text-xs space-y-1.5 hidden">
              <!-- Preenchido via JS -->
            </div>
          </div>

          <!-- Descrição e Tecnologia -->
          <div class="space-y-3 mb-6 text-xs text-gray-300">
            <p class="leading-relaxed text-gray-300">${product.description}</p>
            <div class="border-t border-gray-800 pt-3">
              <h4 class="font-bold text-white mb-2 uppercase tracking-wider text-[11px]">Destaques Tecnológicos:</h4>
              <ul class="list-disc list-inside space-y-1 text-gray-400">
                ${product.tech.map(t => `<li>${t}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- Botões de Ação Final -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-gray-800">
          <button 
            onclick="addToCart(appState.selectedProduct, appState.selectedSize); closeProductModal(); openCartDrawer();"
            class="w-full py-3.5 bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2"
          >
            <i data-lucide="shopping-bag" class="w-4 h-4"></i> Comprar Agora
          </button>
          <button 
            onclick="addToCart(appState.selectedProduct, appState.selectedSize); closeProductModal();"
            class="w-full py-3.5 bg-[#1C222C] hover:bg-[#252D3A] text-white border border-gray-700 font-bold text-sm uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2"
          >
            <i data-lucide="plus-circle" class="w-4 h-4"></i> Adicionar à Sacola
          </button>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  if (window.lucide) window.lucide.createIcons();
}

function closeProductModal() {
  const modal = document.getElementById("product-modal");
  if (modal) modal.classList.add("hidden");
}

function highlightThumb(btn) {
  document.querySelectorAll(".thumb-btn").forEach(b => {
    b.classList.remove("border-purple-500");
    b.classList.add("border-gray-800");
  });
  btn.classList.add("border-purple-500");
  btn.classList.remove("border-gray-800");
}

function selectProductSize(size, btn) {
  appState.selectedSize = size;
  document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

// Simulador de Frete
function simulateShipping() {
  const input = document.getElementById("modal-cep-input");
  const result = document.getElementById("modal-shipping-result");
  if (!input || !result) return;

  const rawCep = input.value.replace(/\D/g, "");
  if (rawCep.length < 8) {
    showToast("Informe um CEP válido com 8 dígitos");
    return;
  }

  result.classList.remove("hidden");
  result.innerHTML = `
    <div class="flex items-center justify-between p-2 rounded bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
      <span class="flex items-center gap-1.5"><i data-lucide="truck" class="w-3.5 h-3.5"></i> Sedex Expresso Shoex</span>
      <span class="font-bold">Grátis (3 a 5 dias úteis)</span>
    </div>
    <div class="flex items-center justify-between p-2 rounded bg-purple-950/30 border border-purple-800/30 text-purple-300">
      <span class="flex items-center gap-1.5"><i data-lucide="zap" class="w-3.5 h-3.5"></i> Entrega Turbo Aérea</span>
      <span class="font-bold">R$ 29,90 (1 a 2 dias úteis)</span>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();
}

// Carrinho de Compras
function addToCart(product, size) {
  if (!product) return;
  const chosenSize = size || product.sizes[0];

  const existingItem = appState.cart.find(item => item.id === product.id && item.size === chosenSize);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    appState.cart.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images[0],
      size: chosenSize,
      sku: product.sku,
      quantity: 1
    });
  }

  saveCart();
  showToast(`Adicionado: ${product.name} (Tam: ${chosenSize})`);
}

function updateCartBadge() {
  const count = appState.cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById("cart-badge");
  const headerTotal = document.getElementById("header-cart-total");

  if (badge) {
    badge.textContent = count;
    badge.classList.toggle("hidden", count === 0);
  }

  if (headerTotal) {
    const total = calculateCartSubtotal();
    headerTotal.textContent = formatBRL(total);
  }
}

function calculateCartSubtotal() {
  return appState.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
}

function openCartDrawer() {
  renderCartDrawer();
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.remove("hidden");
}

function closeCartDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (drawer) drawer.classList.add("hidden");
}

function renderCartDrawer() {
  const container = document.getElementById("cart-items-container");
  const subtotalEl = document.getElementById("cart-subtotal");
  const discountEl = document.getElementById("cart-discount");
  const totalEl = document.getElementById("cart-total");
  const pixTotalEl = document.getElementById("cart-pix-total");
  const freeShippingBar = document.getElementById("free-shipping-progress");
  const freeShippingText = document.getElementById("free-shipping-text");

  if (!container) return;

  if (appState.cart.length === 0) {
    container.innerHTML = `
      <div class="py-16 text-center text-gray-400">
        <div class="w-16 h-16 mx-auto mb-4 bg-purple-900/20 text-purple-400 rounded-full flex items-center justify-center">
          <i data-lucide="shopping-bag" class="w-8 h-8"></i>
        </div>
        <p class="text-white font-bold text-lg mb-1">Sua sacola está vazia</p>
        <p class="text-xs text-gray-400 mb-6">Confira os drops raros e lançamentos importados disponíveis.</p>
        <button onclick="closeCartDrawer()" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs uppercase transition">
          Ver Tênis em Destaque
        </button>
      </div>
    `;

    if (subtotalEl) subtotalEl.textContent = formatBRL(0);
    if (discountEl) discountEl.textContent = "- " + formatBRL(0);
    if (totalEl) totalEl.textContent = formatBRL(0);
    if (pixTotalEl) pixTotalEl.textContent = formatBRL(0);
    if (freeShippingBar) freeShippingBar.style.width = "0%";
    if (freeShippingText) freeShippingText.textContent = "Frete grátis em compras a partir de R$ 399";
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  const subtotal = calculateCartSubtotal();
  let discountAmount = 0;

  if (appState.activeCoupon) {
    if (appState.activeCoupon.discountPercent) {
      discountAmount = (subtotal * appState.activeCoupon.discountPercent) / 100;
    } else if (appState.activeCoupon.discountFixed) {
      discountAmount = Math.min(appState.activeCoupon.discountFixed, subtotal);
    }
  }

  const finalTotal = Math.max(0, subtotal - discountAmount + appState.shippingCost);
  const pixFinalTotal = finalTotal * 0.90; // 10% adicional no PIX

  // Barra de Frete Grátis (Meta R$ 399)
  const freeThreshold = 399;
  if (freeShippingBar && freeShippingText) {
    const percent = Math.min(100, (subtotal / freeThreshold) * 100);
    freeShippingBar.style.width = `${percent}%`;

    if (subtotal >= freeThreshold) {
      freeShippingText.innerHTML = `<span class="text-emerald-400 font-bold flex items-center justify-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> Parabéns! Você garantiu FRETE GRÁTIS</span>`;
    } else {
      const remaining = freeThreshold - subtotal;
      freeShippingText.innerHTML = `Faltam <span class="text-white font-bold">${formatBRL(remaining)}</span> para <strong>Frete Grátis</strong>!`;
    }
  }

  if (subtotalEl) subtotalEl.textContent = formatBRL(subtotal);
  if (discountEl) discountEl.textContent = "- " + formatBRL(discountAmount);
  if (totalEl) totalEl.textContent = formatBRL(finalTotal);
  if (pixTotalEl) pixTotalEl.textContent = formatBRL(pixFinalTotal);

  container.innerHTML = appState.cart.map((item, index) => `
    <div class="flex gap-4 p-3 bg-[#14181F] rounded-xl border border-gray-800/80 items-center">
      <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-contain bg-[#1D232D] rounded-lg p-1" />
      <div class="flex-1 min-w-0">
        <p class="text-[11px] text-purple-400 font-bold uppercase">${item.brand}</p>
        <h4 class="text-xs font-bold text-white truncate">${item.name}</h4>
        <div class="flex items-center gap-2 mt-1">
          <span class="text-[11px] bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded font-mono">Tam: ${item.size}</span>
          <span class="text-xs font-extrabold text-white">${formatBRL(item.price)}</span>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <div class="flex items-center bg-[#1D232D] rounded-lg border border-gray-700">
          <button onclick="changeCartQty(${index}, -1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white">-</button>
          <span class="w-6 text-center text-xs font-bold text-white">${item.quantity}</span>
          <button onclick="changeCartQty(${index}, 1)" class="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white">+</button>
        </div>
        <button onclick="removeCartItem(${index})" class="text-[11px] text-red-400 hover:text-red-300 flex items-center gap-1 transition">
          <i data-lucide="trash" class="w-3 h-3"></i> Excluir
        </button>
      </div>
    </div>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

function changeCartQty(index, delta) {
  if (!appState.cart[index]) return;
  appState.cart[index].quantity += delta;
  if (appState.cart[index].quantity <= 0) {
    appState.cart.splice(index, 1);
  }
  saveCart();
  renderCartDrawer();
}

function removeCartItem(index) {
  if (!appState.cart[index]) return;
  appState.cart.splice(index, 1);
  saveCart();
  renderCartDrawer();
  showToast("Item removido da sacola");
}

// Aplicação de Cupom
function applyCouponCode() {
  const input = document.getElementById("coupon-input");
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    showToast("Digite o código do cupom");
    return;
  }

  const coupon = SHOEX_COUPONS[code];
  if (!coupon) {
    showToast("Cupom inválido ou expirado. Tente: SHOEX10");
    return;
  }

  const subtotal = calculateCartSubtotal();
  if (coupon.minPurchase && subtotal < coupon.minPurchase) {
    showToast(`Esse cupom exige valor mínimo de ${formatBRL(coupon.minPurchase)}`);
    return;
  }

  appState.activeCoupon = coupon;
  showToast(`Cupom ${code} aplicado com sucesso! 🎉`);
  renderCartDrawer();
}

// FLUXO DE CHECKOUT
function openCheckoutModal() {
  if (appState.cart.length === 0) {
    showToast("Sua sacola está vazia!");
    return;
  }
  closeCartDrawer();
  const modal = document.getElementById("checkout-modal");
  if (modal) {
    modal.classList.remove("hidden");
    appState.checkout.step = 1;
    renderCheckoutStep();
  }
}

function closeCheckoutModal() {
  const modal = document.getElementById("checkout-modal");
  if (modal) modal.classList.add("hidden");
}

function renderCheckoutStep() {
  const container = document.getElementById("checkout-step-container");
  if (!container) return;

  const subtotal = calculateCartSubtotal();
  let discountAmount = 0;
  if (appState.activeCoupon) {
    discountAmount = appState.activeCoupon.discountPercent 
      ? (subtotal * appState.activeCoupon.discountPercent) / 100 
      : (appState.activeCoupon.discountFixed || 0);
  }
  const finalTotal = Math.max(0, subtotal - discountAmount + appState.shippingCost);
  const pixFinalTotal = finalTotal * 0.90;

  if (appState.checkout.step === 1) {
    container.innerHTML = `
      <div>
        <h3 class="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">1</span>
          Dados Pessoais e Entrega
        </h3>
        <p class="text-xs text-gray-400 mb-6">Seus dados estão protegidos com criptografia SSL 256 bits.</p>

        <form id="checkout-form-step1" onsubmit="handleCheckoutStep1(event)" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">Nome Completo *</label>
              <input type="text" required id="c-name" value="${appState.checkout.customer.name}" placeholder="Ex: Felipe Silva" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">E-mail para confirmação e rastreio *</label>
              <input type="email" required id="c-email" value="${appState.checkout.customer.email}" placeholder="seu@email.com" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">WhatsApp / Telefone *</label>
              <input type="tel" required id="c-phone" value="${appState.checkout.customer.phone}" placeholder="(11) 99999-9999" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-300 mb-1">CPF (para nota fiscal) *</label>
              <input type="text" required id="c-cpf" value="${appState.checkout.customer.cpf}" placeholder="000.000.000-00" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
            </div>
          </div>

          <div class="border-t border-gray-800 pt-3">
            <h4 class="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">Endereço de Entrega</h4>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">CEP *</label>
                <input type="text" required id="c-cep" value="${appState.checkout.customer.cep}" placeholder="00000-000" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs font-semibold text-gray-300 mb-1">Rua / Avenida *</label>
                <input type="text" required id="c-street" value="${appState.checkout.customer.street || 'Av. Paulista'}" placeholder="Nome da rua" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Número *</label>
                <input type="text" required id="c-number" value="${appState.checkout.customer.number || '1000'}" placeholder="123" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Bairro *</label>
                <input type="text" required id="c-neighborhood" value="${appState.checkout.customer.neighborhood || 'Bela Vista'}" placeholder="Bairro" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-300 mb-1">Cidade / UF *</label>
                <input type="text" required id="c-city" value="${appState.checkout.customer.city || 'São Paulo - SP'}" placeholder="São Paulo - SP" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
              </div>
            </div>
          </div>

          <div class="pt-4 flex items-center justify-between border-t border-gray-800">
            <div>
              <p class="text-xs text-gray-400">Total da Sacola:</p>
              <p class="text-lg font-extrabold text-white">${formatBRL(finalTotal)}</p>
            </div>
            <button type="submit" class="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2">
              Ir para Pagamento <i data-lucide="arrow-right" class="w-4 h-4"></i>
            </button>
          </div>
        </form>
      </div>
    `;
  } else if (appState.checkout.step === 2) {
    container.innerHTML = `
      <div>
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">2</span>
            Escolha a Forma de Pagamento
          </h3>
          <button onclick="appState.checkout.step = 1; renderCheckoutStep();" class="text-xs text-purple-400 hover:underline">
            ← Voltar para endereço
          </button>
        </div>

        <!-- Seletor de Método -->
        <div class="grid grid-cols-2 gap-3 mb-6">
          <button 
            type="button" 
            onclick="setPaymentMethod('pix')" 
            class="p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              appState.checkout.paymentMethod === 'pix' 
                ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                : 'bg-[#181E27] border-gray-800 text-gray-400 hover:border-gray-700'
            }"
          >
            <div class="flex items-center gap-2">
              <i data-lucide="qr-code" class="w-5 h-5 text-emerald-400"></i>
              <span class="font-bold text-sm">PIX Instantâneo</span>
            </div>
            <span class="text-[11px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">10% DE DESCONTO</span>
          </button>

          <button 
            type="button" 
            onclick="setPaymentMethod('card')" 
            class="p-4 rounded-xl border flex flex-col items-center justify-center gap-2 transition ${
              appState.checkout.paymentMethod === 'card' 
                ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                : 'bg-[#181E27] border-gray-800 text-gray-400 hover:border-gray-700'
            }"
          >
            <div class="flex items-center gap-2">
              <i data-lucide="credit-card" class="w-5 h-5 text-purple-400"></i>
              <span class="font-bold text-sm">Cartão de Crédito</span>
            </div>
            <span class="text-[11px] text-gray-400 font-medium">Até 10x Sem Juros</span>
          </button>
        </div>

        <!-- Conteúdo do Pagamento -->
        <div id="payment-method-content">
          ${renderPaymentDetails(finalTotal, pixFinalTotal)}
        </div>
      </div>
    `;
  } else if (appState.checkout.step === 3) {
    // Pedido Concluído
    const orderNumber = "SHX-" + Math.floor(100000 + Math.random() * 900000);
    const trackingCode = "BR" + Math.floor(100000000 + Math.random() * 900000000) + "SX";

    // Salvar histórico de pedidos
    try {
      const orders = JSON.parse(localStorage.getItem("shoex_orders") || "[]");
      orders.unshift({
        orderNumber,
        trackingCode,
        date: new Date().toLocaleDateString("pt-BR"),
        items: [...appState.cart],
        total: appState.checkout.paymentMethod === 'pix' ? pixFinalTotal : finalTotal,
        method: appState.checkout.paymentMethod === 'pix' ? 'PIX' : 'Cartão de Crédito',
        customer: appState.checkout.customer
      });
      localStorage.setItem("shoex_orders", JSON.stringify(orders));

      // Limpar carrinho
      appState.cart = [];
      saveCart();
    } catch (e) {
      console.error(e);
    }

    container.innerHTML = `
      <div class="text-center py-6">
        <div class="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/40">
          <i data-lucide="check-circle-2" class="w-10 h-10"></i>
        </div>
        <h3 class="text-2xl font-extrabold text-white mb-1">Pedido Confirmado com Sucesso!</h3>
        <p class="text-gray-400 text-sm mb-6">Obrigado por comprar na SHOEX Importados. Enviamos todos os detalhes para seu e-mail.</p>

        <div class="bg-[#181E27] p-4 rounded-xl border border-gray-800 max-w-md mx-auto text-left space-y-2 mb-6">
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Número do Pedido:</span>
            <span class="font-mono font-bold text-purple-400">${orderNumber}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Código de Rastreio:</span>
            <span class="font-mono font-bold text-emerald-400">${trackingCode}</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-gray-400">Prazo de Envio:</span>
            <span class="text-white font-medium">Postagem em até 24h úteis</span>
          </div>
          <div class="flex justify-between text-xs pt-2 border-t border-gray-700">
            <span class="text-gray-300 font-bold">Total Pago:</span>
            <span class="text-white font-extrabold">${formatBRL(appState.checkout.paymentMethod === 'pix' ? pixFinalTotal : finalTotal)}</span>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button onclick="closeCheckoutModal()" class="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase rounded-xl transition">
            Continuar Comprando
          </button>
          <button onclick="trackOrderSimulated('${trackingCode}')" class="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-xs uppercase rounded-xl transition flex items-center justify-center gap-2">
            <i data-lucide="truck" class="w-4 h-4"></i> Rastrear Encomenda
          </button>
        </div>
      </div>
    `;
  }

  if (window.lucide) window.lucide.createIcons();
}

function setPaymentMethod(method) {
  appState.checkout.paymentMethod = method;
  renderCheckoutStep();
}

function renderPaymentDetails(finalTotal, pixFinalTotal) {
  if (appState.checkout.paymentMethod === 'pix') {
    const pixCopyCode = "00020126580014br.gov.bcb.pix0136shoex-importados-pagamentos-autenticos-netshoex520400005303986540" + pixFinalTotal.toFixed(2) + "5802BR5925SHOEX IMPORTADOS STORE6009SAO PAULO62070503***6304E8A2";

    return `
      <div class="bg-[#14181F] p-5 rounded-2xl border border-gray-800 text-center space-y-4">
        <div class="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs p-2.5 rounded-xl font-bold flex items-center justify-center gap-2">
          <i data-lucide="sparkles" class="w-4 h-4"></i> Economize 10% no pagamento via PIX Instantâneo
        </div>

        <div class="text-2xl font-black text-white">
          ${formatBRL(pixFinalTotal)}
        </div>

        <!-- QR Code Estilizado SVG -->
        <div class="w-48 h-48 mx-auto bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-purple-600">
          <svg class="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
            <rect x="0" y="0" width="30" height="30" />
            <rect x="5" y="5" width="20" height="20" fill="white" />
            <rect x="10" y="10" width="10" height="10" />
            <rect x="70" y="0" width="30" height="30" />
            <rect x="75" y="5" width="20" height="20" fill="white" />
            <rect x="80" y="10" width="10" height="10" />
            <rect x="0" y="70" width="30" height="30" />
            <rect x="5" y="75" width="20" height="20" fill="white" />
            <rect x="10" y="80" width="10" height="10" />
            <rect x="40" y="10" width="10" height="20" />
            <rect x="55" y="5" width="8" height="8" />
            <rect x="40" y="40" width="20" height="20" />
            <rect x="70" y="45" width="10" height="15" />
            <rect x="45" y="70" width="15" height="15" />
            <rect x="75" y="75" width="15" height="15" />
          </svg>
        </div>

        <p class="text-xs text-gray-400">Abra o app do seu banco e escaneie o código QR acima ou copie o código Pix abaixo:</p>

        <div class="flex gap-2">
          <input type="text" readonly value="${pixCopyCode}" id="pix-copy-input" class="flex-1 bg-[#1A202A] border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono truncate" />
          <button onclick="copyPixCode()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 flex-shrink-0">
            <i data-lucide="copy" class="w-3.5 h-3.5"></i> Copiar Código
          </button>
        </div>

        <div class="pt-3">
          <button onclick="completeOrder()" class="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition">
            Já realizei o pagamento no PIX
          </button>
        </div>
      </div>
    `;
  } else {
    // Formulário de Cartão de Crédito
    const installmentPrice = finalTotal / 10;

    return `
      <form onsubmit="handleCardPayment(event)" class="bg-[#14181F] p-5 rounded-2xl border border-gray-800 space-y-4">
        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1">Número do Cartão de Crédito *</label>
          <div class="relative">
            <input type="text" required maxlength="19" placeholder="0000 0000 0000 0000" class="w-full bg-[#181E27] border border-gray-700 rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-purple-500 focus:outline-none" />
            <div class="absolute right-3 top-2.5 text-gray-400">
              <i data-lucide="credit-card" class="w-5 h-5"></i>
            </div>
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1">Nome Impresso no Cartão *</label>
          <input type="text" required placeholder="Como está no cartão" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none uppercase" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">Validade (MM/AA) *</label>
            <input type="text" required maxlength="5" placeholder="12/28" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-300 mb-1">CVV / Cód. Segurança *</label>
            <input type="password" required maxlength="4" placeholder="123" class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-gray-300 mb-1">Opção de Parcelamento *</label>
          <select class="w-full bg-[#181E27] border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 focus:outline-none">
            <option value="1">1x de ${formatBRL(finalTotal)} sem juros</option>
            <option value="2">2x de ${formatBRL(finalTotal / 2)} sem juros</option>
            <option value="3">3x de ${formatBRL(finalTotal / 3)} sem juros</option>
            <option value="6">6x de ${formatBRL(finalTotal / 6)} sem juros</option>
            <option value="10" selected>10x de ${formatBRL(finalTotal / 10)} sem juros (Recomendado)</option>
          </select>
        </div>

        <div class="pt-3 border-t border-gray-800">
          <div class="flex justify-between items-center mb-3">
            <span class="text-xs text-gray-400">Total a Pagar:</span>
            <span class="text-lg font-extrabold text-white">${formatBRL(finalTotal)}</span>
          </div>

          <button type="submit" class="w-full py-3.5 bg-gradient-to-r from-purple-800 to-purple-600 hover:from-purple-700 hover:to-purple-500 text-white font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center gap-2">
            <i data-lucide="lock" class="w-4 h-4"></i> Pagar com Cartão Seguro
          </button>
        </div>
      </form>
    `;
  }
}

function handleCheckoutStep1(event) {
  event.preventDefault();
  appState.checkout.customer = {
    name: document.getElementById("c-name").value,
    email: document.getElementById("c-email").value,
    phone: document.getElementById("c-phone").value,
    cpf: document.getElementById("c-cpf").value,
    cep: document.getElementById("c-cep").value,
    street: document.getElementById("c-street").value,
    number: document.getElementById("c-number").value,
    neighborhood: document.getElementById("c-neighborhood").value,
    city: document.getElementById("c-city").value
  };

  appState.checkout.step = 2;
  renderCheckoutStep();
}

function copyPixCode() {
  const input = document.getElementById("pix-copy-input");
  if (input) {
    input.select();
    navigator.clipboard.writeText(input.value).then(() => {
      showToast("Chave Pix Copia e Cola copiada! ✅");
    }).catch(() => {
      showToast("Código selecionado, copie com Ctrl+C");
    });
  }
}

function handleCardPayment(e) {
  e.preventDefault();
  showToast("Processando transação com a operadora...");
  setTimeout(() => {
    completeOrder();
  }, 1200);
}

function completeOrder() {
  appState.checkout.step = 3;
  renderCheckoutStep();
  showToast("Pedido finalizado com sucesso!");
}

function trackOrderSimulated(code) {
  closeCheckoutModal();
  openTrackModal(code);
}

// Modal de Rastreio
function openTrackModal(prefillCode) {
  const modal = document.getElementById("track-modal");
  const input = document.getElementById("track-code-input");
  const result = document.getElementById("track-result");

  if (!modal) return;
  modal.classList.remove("hidden");

  if (prefillCode && input) {
    input.value = prefillCode;
    searchTracking();
  } else if (result) {
    result.classList.add("hidden");
  }
}

function closeTrackModal() {
  const modal = document.getElementById("track-modal");
  if (modal) modal.classList.add("hidden");
}

function searchTracking() {
  const input = document.getElementById("track-code-input");
  const result = document.getElementById("track-result");
  if (!input || !result) return;

  const code = input.value.trim().toUpperCase();
  if (!code) {
    showToast("Digite o código de rastreamento");
    return;
  }

  result.classList.remove("hidden");
  result.innerHTML = `
    <div class="bg-[#14181F] p-4 rounded-xl border border-gray-800 space-y-4">
      <div class="flex items-center justify-between border-b border-gray-800 pb-2">
        <span class="text-xs text-gray-400">Código: <strong class="text-white font-mono">${code}</strong></span>
        <span class="text-xs bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">Em Trânsito Expresso</span>
      </div>

      <div class="space-y-3 relative pl-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-purple-600/50">
        <div class="relative">
          <div class="w-4 h-4 rounded-full bg-emerald-500 absolute -left-6 top-0 border-2 border-black"></div>
          <p class="text-xs font-bold text-white">Objeto Despachado do Centro Internacional de Triagem</p>
          <p class="text-[11px] text-gray-400">Hub Logístico Aéreo - São Paulo, SP</p>
        </div>
        <div class="relative">
          <div class="w-4 h-4 rounded-full bg-purple-600 absolute -left-6 top-0 border-2 border-black"></div>
          <p class="text-xs font-bold text-gray-300">Inspeção de Autenticidade Concluída e Aprovada</p>
          <p class="text-[11px] text-gray-400">Shoex Quality Verification Lab</p>
        </div>
        <div class="relative">
          <div class="w-4 h-4 rounded-full bg-gray-600 absolute -left-6 top-0 border-2 border-black"></div>
          <p class="text-xs font-bold text-gray-400">Pedido Recebido e Faturado</p>
          <p class="text-[11px] text-gray-500">Nota Fiscal Eletrônica Emitida</p>
        </div>
      </div>
    </div>
  `;
}

// Toast de Notificações
function showToast(message) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "bg-[#1E2532] text-white text-xs font-semibold px-4 py-3 rounded-xl border border-purple-500/40 shadow-2xl flex items-center gap-2 transform transition-all duration-300 translate-y-4 opacity-0";
  toast.innerHTML = `<i data-lucide="bell" class="w-4 h-4 text-purple-400"></i> <span>${message}</span>`;

  container.appendChild(toast);
  if (window.lucide) window.lucide.createIcons();

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-x-4");
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Setup de Listeners Globais
function setupEventListeners() {
  // Busca em tempo real
  const searchInput = document.getElementById("search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      appState.activeFilters.search = e.target.value;
      renderProducts();
    });
  }

  // Ordenação
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      appState.activeFilters.sortBy = e.target.value;
      renderProducts();
    });
  }

  // Filtro de Categoria
  const catSelect = document.getElementById("category-select");
  if (catSelect) {
    catSelect.addEventListener("change", (e) => {
      appState.activeFilters.category = e.target.value;
      renderProducts();
    });
  }

  // Filtro de Tamanho
  const sizeSelect = document.getElementById("size-select");
  if (sizeSelect) {
    sizeSelect.addEventListener("change", (e) => {
      appState.activeFilters.size = e.target.value;
      renderProducts();
    });
  }

  // Filtro de Preço Range
  const priceSlider = document.getElementById("price-range");
  const priceDisplay = document.getElementById("price-display");
  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener("input", (e) => {
      const val = Number(e.target.value);
      appState.activeFilters.maxPrice = val;
      priceDisplay.textContent = formatBRL(val);
      renderProducts();
    });
  }
}
