# SHOEX IMPORTADOS — Loja Virtual Profissional de Tênis Hype & Performance

Uma plataforma de e-commerce moderna e de alta fidelidade inspirada no ecossistema **Netshoes**, com foco em **tênis importados exclusivos, drops raros e modelos de alta performance** (Air Jordan, Nike Dunk, Travis Scott, Adidas Yeezy/Samba, New Balance 9060/550 e Asics Gel-Kayano).

---

## ⚡ Principais Funcionalidades

### 1. Identidade Visual & Design System Esportivo
- Paleta profissional no estilo Netshoes com tons de roxo atlético (`#521183`), preto profundo (`#0A0C10`), detalhes em neon elétrico (`#00E5FF`) e rosa hype (`#FF1356`).
- Tipografia premium: **Sora** para títulos marcantes e **Plus Jakarta Sans** para corpo de texto e dados técnicos.
- Layout 100% responsivo para Mobile, Tablet e Desktop com microinterações fluidas e badges dinâmicas.

### 2. Banners Promocionais & Flash Sale Ativa
- Destaque para lançamentos mundiais (Air Jordan 1 Lost & Found, Travis Scott Reverse Mocha).
- **Cronômetro regressivo ativo** para ofertas relâmpago com contadores de horas, minutos e segundos.
- Badges de selo de autenticidade, economia percentual e parcelamento sem juros.

### 3. Catálogo e Filtros Avançados
- **Filtro por marcas consagradas**: Nike, Air Jordan, Adidas, New Balance, Asics e Todos.
- **Filtro por categoria e uso**: Hype & Streetwear, Casual/Lifestyle, Basquete e Corrida/Performance.
- **Filtro por numeração BR**: tamanhos de 36 a 45 com indicação rápida nos cards.
- **Slider de faixa de preço dinâmico**: ajuste de R$ 600 a R$ 4.500 com atualização em tempo real.
- **Ordenação rápida**: Mais Relevantes, Menor Preço, Maior Preço, Maior Desconto e Melhor Avaliados.
- **Busca em tempo real**: busca preditiva por modelo, marca, categoria ou SKU.

### 4. Modal de Detalhes do Sneaker
- Galeria de imagens com múltiplos ângulos e miniaturas selecionáveis.
- Selo de autenticidade inspecionada internacional.
- Seletor de tamanhos padrão brasileiro (BR) com feedback tátil.
- **Simulador de Frete por CEP**: cálculo simulado com opções Sedex Expresso e Entrega Turbo Aérea.
- Ficha técnica completa com tecnologias (Nike Air, ZoomX, BOOST™, GEL™).

### 5. Carrinho Lateral Interativo (Drawer)
- Ajuste de quantidade e exclusão de itens em tempo real.
- **Barra de progresso dinâmica para Frete Grátis** (meta de R$ 399).
- **Sistema de Cupons de Desconto**:
  - `SHOEX10`: 10% de desconto em todo o site.
  - `PRIMEIRACOMPRA`: R$ 50 OFF em pedidos acima de R$ 400.
  - `DROPRARO`: 15% OFF em compras acima de R$ 1.500.
  - `NETSHOEX`: 12% OFF no estilo esportivo.
- Resumo com subtotal, desconto, frete e valor especial no PIX.
- Persistência total no `localStorage`.

### 6. Fluxo de Checkout Completo
- **Etapa 1**: Dados Pessoais, CPF e Endereço de Entrega com validação.
- **Etapa 2**: Escolha de Pagamento:
  - **PIX Instantâneo**: QR Code dinâmico, código Pix Copia e Cola, 10% de desconto adicional e confirmação imediata.
  - **Cartão de Crédito**: campos com validação, bandeiras e parcelamento de 1x até 10x sem juros.
- **Etapa 3**: Confirmação com número de pedido (ex: `#SHX-89421`), código de rastreamento gerado e histórico salvo localmente.

### 7. Rastreamento e Lista de Desejos
- Modal de Rastreio com timeline de status logístico.
- Modal de Favoritos com adição e remoção em um clique.

---

## 🛠️ Tecnologias Utilizadas

- **HTML5 Semântico**: marcação acessível e estruturada.
- **Tailwind CSS (CDN)**: design system utilitário com tokens customizados.
- **CSS3 Personalizado (`css/style.css`)**: gradientes esportivos, glassmorphism e animações.
- **JavaScript Modular (`js/products.js` e `js/app.js`)**: lógica pura sem dependências pesadas.
- **Lucide Icons**: iconografia vetorial nítida.
- **Google Fonts**: Plus Jakarta Sans e Sora.

---

## 🚀 Como Executar

Por ser uma aplicação web nativa sem necessidade de build:

1. Clone o repositório ou baixe os arquivos.
2. Abra o arquivo `index.html` diretamente em qualquer navegador moderno.
3. Ou sirva com qualquer servidor estático:
   ```bash
   npx serve .
   ```

---

© 2026 SHOEX IMPORTADOS LTDA. Todos os direitos reservados.
