import type { WebPageLevel } from '../billing-core/FeatureGateService';

export type WebPreviewData = {
  slug: string;
  profile: {
    restaurant_id: string;
    company_id?: string | null;
    slug: string;
    domain: string | null;
    status: string;
    theme: string;
    web_level: WebPageLevel;
    hero: any;
    highlights: any;
    contacts: any;
    delivery_zones: any;
  };
  menu: {
    categories: Array<{ id: string; name: string; position: number }>;
    items: Array<{
      id: string;
      category_id: string;
      name: string;
      description: string | null;
      price_cents: number;
      currency: string;
      photo_url: string | null;
      tags: string[];
    }>;
  };
};

function escapeHtml(s: any): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMoney(cents: number, currency: string): string {
  const c = (currency || 'EUR').toUpperCase();
  const v = (Number(cents) || 0) / 100;
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: c }).format(v);
}

function normalizeArray(value: any): any[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [];
}

function normalizeObject(value: any): Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value;
}


function baseCss(theme: string): string {
  const isDark = String(theme).toLowerCase() === 'dark';
  const bg = isDark ? '#0b0c10' : '#f8fafc';
  const fg = isDark ? '#e6e8ef' : '#1e293b';
  const muted = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const cardBg = isDark ? '#111318' : '#ffffff';

  // Premium Palette
  const accent = '#fbbf24';
  const accentGlow = 'rgba(251, 191, 36, 0.3)';
  const glass = isDark ? 'rgba(20, 20, 25, 0.7)' : 'rgba(255, 255, 255, 0.8)';

  return `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  :root { color-scheme: ${isDark ? 'dark' : 'light'}; }
  
  body { 
    margin:0; 
    font-family: 'Outfit', sans-serif; 
    background:${bg}; 
    color:${fg}; 
    -webkit-font-smoothing: antialiased; 
    line-height: 1.5;
  }
  
  a { color: inherit; text-decoration: none; transition: color 0.2s; }
  a:hover { color: ${accent}; }
  
  .wrap { max-width: 1024px; margin: 0 auto; padding: 24px; }
  
  /* Utilities */
  .grid-main { display:grid; grid-template-columns: 1fr 360px; gap: 32px; align-items: start; }
  @media (max-width: 900px) { .grid-main { grid-template-columns: 1fr; } }

  .glass-panel {
    background: ${glass};
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid ${border};
  }

  /* Typography */
  .h1 { font-size: 36px; font-weight: 800; margin: 0; letter-spacing: -0.03em; line-height: 1.1; }
  .h2 { font-size: 22px; font-weight: 700; margin: 0 0 16px 0; letter-spacing: -0.02em; }
  .muted { color:${muted}; }
  
  /* Components */
  .badge { 
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; 
    padding: 6px 12px; border: 1px solid ${border}; border-radius: 999px; 
    color:${muted}; display: inline-block; background: ${isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'};
  }
  
  .btn { 
    background: ${isDark ? '#e2e8f0' : '#0f172a'}; 
    color: ${isDark ? '#0f172a' : '#ffffff'}; 
    border: none; padding: 12px 20px; border-radius: 12px; 
    font-weight: 600; cursor:pointer; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
    font-size: 14px; position: relative; overflow: hidden;
  }
  .btn:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -6px ${accentGlow}; }
  .btn:active { transform: translateY(0); }
  .btn:disabled { opacity: 0.6; transform: none; cursor: not-allowed; box-shadow: none; }
  
  .btn-outline {
    background: transparent; border: 1px solid ${border}; color: ${fg};
  }
  .btn-outline:hover {
    border-color: ${accent}; color: ${accent};
  }

  .pill { 
    display:inline-block; font-size:11px; font-weight: 600; padding: 6px 12px; 
    background: ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}; 
    border-radius: 8px; color:${muted}; margin-right: 6px; 
  }

  /* Cards */
  .card { 
    border: 1px solid ${border}; border-radius: 20px; padding: 24px; 
    background: ${cardBg}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  }
  
  /* Menu Basic */
  .menuItem { display:flex; justify-content:space-between; gap:16px; padding: 20px 0; border-top:1px solid ${border}; }
  .menuItem:first-child { border-top:none; }

  /* Menu Grid (Pro) */
  .menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
  .menu-card { 
    padding: 20px; border: 1px solid ${border}; border-radius: 16px; 
    display: flex; flex-direction: column; justify-content: space-between; height: 100%; 
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
    background: ${isDark ? '#161b22' : '#ffffff'};
    position: relative;
  }
  .menu-card:hover { 
    border-color: ${accent}; transform: translateY(-4px) scale(1.01); 
    box-shadow: 0 12px 30px -10px rgba(0,0,0,0.3); z-index: 10;
  }
  .menu-price { font-size: 18px; font-weight: 700; color: ${accent}; }
  .menu-add-btn {
    opacity: 0; transform: translateY(10px); transition: all 0.3s ease;
  }
  .menu-card:hover .menu-add-btn {
    opacity: 1; transform: translateY(0);
  }
  /* Always show button on touch devices or small screens if needed, strictly hover for desktop aesthetics */
  @media (pointer: coarse) { .menu-add-btn { opacity: 1; transform: none; } }

  /* Hero Pro */
  .hero-pro { 
    position: relative; 
    border-radius: 24px; 
    overflow: hidden; 
    margin: 24px 0 40px; 
    padding: 80px 40px; 
    background: radial-gradient(circle at top right, #334155, #0f172a); 
    color: white; 
    text-align: center;
    box-shadow: 0 20px 40px -20px rgba(0,0,0,0.5);
    background-image: url('https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80');
    background-size: cover;
    background-position: center;
  }
  .hero-overlay {
    position: absolute; top:0; left:0; right:0; bottom:0;
    background: linear-gradient(to top, rgba(15,23,42,0.9), rgba(15,23,42,0.4));
    z-index: 1;
  }
  .hero-content { position: relative; z-index: 2; }
  
  .hero-pro h1 { 
    font-size: 56px; margin-bottom: 16px; 
    background: linear-gradient(to bottom right, #ffffff, #94a3b8); 
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; 
    text-shadow: 0 4px 12px rgba(0,0,0,0.3);
  }
  .hero-pro .subtitle { font-size: 20px; color: #cbd5e1; max-width: 600px; margin: 0 auto 32px; font-weight: 300; }
  
  .hero-actions { display: flex; gap: 16px; justify-content: center; }
  .hero-actions .btn { background: #fbbf24; color: #0f172a; border: none; padding: 14px 32px; font-size: 16px; }
  .hero-actions .btn-sec { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); color: white; border: 1px solid rgba(255,255,255,0.2); }
  .hero-actions .btn-sec:hover { background: rgba(255,255,255,0.2); }
  
  /* Hero Basic */
  .hero-basic { padding: 32px; border:1px solid ${border}; border-radius: 16px; margin: 24px 0; background: ${isDark ? '#1a1f29' : '#f1f5f9'}; text-align:center; }

  /* Animations */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  .animate-fade-up { animation: fadeUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
  .delay-100 { animation-delay: 100ms; }
  .delay-200 { animation-delay: 200ms; }
  .delay-300 { animation-delay: 300ms; }
  `;
}

function renderTop(data: WebPreviewData, level: WebPageLevel) {
  if (level !== 'BASIC') return ''; // Pro uses Hero for title
  const title = escapeHtml(data.profile?.hero?.title || data.profile?.slug || 'Restaurante');
  return `
    <div class="top" style="margin-bottom:20px; padding-bottom:20px; border-bottom:1px solid #e2e8f0;">
       <div class="badge">${escapeHtml(level)}</div>
       <h1 class="h1" style="margin-top:10px">${title}</h1>
    </div>
  `;
}

function renderContactsCard(data: WebPreviewData) {
  const c = normalizeObject(data.profile.contacts);
  const links = normalizeObject(c.links);
  return `
    <div class="card">
      <div class="h2">Informações</div>
      <div class="muted" style="line-height:1.6">
        <div>📍 ${escapeHtml(c.address || 'Morada não definida')}</div>
        <div>📞 ${escapeHtml(c.phone || '-')}</div>
        <div>🕒 ${escapeHtml(c.hours || '09:00 - 23:00')}</div>
      </div>
      ${c.maps_url ? `<div style="margin-top:16px"><a class="btn" style="width:100%; display:block; text-align:center" href="${escapeHtml(c.maps_url)}" target="_blank" rel="noreferrer">Ver no Mapa</a></div>` : ''}
    </div>
  `;
}

function renderHighlightsCard(data: WebPreviewData) {
  const hs = normalizeArray(data.profile.highlights);
  if (!hs.length) return '';
  return `
    <div class="card" style="margin-top:16px">
      <div class="h2">Destaques</div>
      <div style="display:flex; flex-wrap:wrap; gap:8px">
        ${hs.map((h) => `<span class="pill" style="font-size:12px">✨ ${escapeHtml(h?.title || h)}</span>`).join('')}
      </div>
    </div>
  `;
}

function renderMenu(data: WebPreviewData, level: WebPageLevel) {
  const categories = [...(data.menu.categories || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const itemsByCat = new Map<string, Array<WebPreviewData['menu']['items'][number]>>();
  for (const item of data.menu.items || []) {
    const arr = itemsByCat.get(item.category_id) || [];
    arr.push(item);
    itemsByCat.set(item.category_id, arr);
  }

  const isPro = level === 'PRO' || level === 'EXPERIENCE';
  const parts: string[] = [];

  let delay = 100;

  for (const cat of categories) {
    const items = itemsByCat.get(cat.id) || [];
    parts.push(`<div style="margin-bottom:48px" class="animate-fade-up" style="animation-delay:${delay}ms">
      <div class="h2" style="border-bottom: 2px solid #fbbf24; display:inline-block; padding-bottom:4px; margin-bottom:24px">${escapeHtml(cat.name)}</div>`);
    delay += 50;

    if (isPro) {
      // Grid Layout for Pro
      if (items.length) {
        parts.push(`<div class="menu-grid">`);
        parts.push(items.map((it: any) => `
          <div class="menu-card">
            <div>
              <div style="font-weight:700; font-size:17px; margin-bottom:6px; line-height:1.3">${escapeHtml(it.name)}</div>
              ${it.description ? `<div class="muted" style="font-size:14px; line-height:1.5; margin-bottom:12px; min-height:40px">${escapeHtml(it.description)}</div>` : ''}
              <div style="margin-bottom:16px">${(it.tags || []).slice(0, 3).map((t: string) => `<span class="pill" style="font-size:10px">${escapeHtml(t)}</span>`).join('')}</div>
            </div>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:16px; border-top:1px dashed rgba(128,128,128,0.1)">
              <div class="menu-price">${escapeHtml(fmtMoney(it.price_cents, it.currency))}</div>
              <button class="btn menu-add-btn" onclick="addToCart('${escapeHtml(it.id)}', '${escapeHtml(it.name)}', ${it.price_cents})" style="padding:8px 16px; font-size:13px">Adicionar +</button>
            </div>
          </div>
        `).join(''));
        parts.push(`</div>`);
      } else {
        parts.push(`<div class="muted">(sem itens visualizáveis)</div>`);
      }
    } else {
      // List Layout for Basic
      if (items.length) {
        parts.push(`<div class="card">`);
        parts.push(items.map((it: any) => `
          <div class="menuItem">
            <div>
              <div style="font-weight:650">${escapeHtml(it.name)}</div>
              ${it.description ? `<div class="muted" style="margin-top:4px">${escapeHtml(it.description)}</div>` : ''}
              ${(it.tags || []).slice(0, 4).map((t: string) => `<span class="pill">${escapeHtml(t)}</span>`).join('')}
            </div>
            <div style="text-align:right">
              <div style="font-weight:650">${escapeHtml(fmtMoney(it.price_cents, it.currency))}</div>
              <div style="margin-top:8px"><button class="btn btn-outline" onclick="addToCart('${escapeHtml(it.id)}', '${escapeHtml(it.name)}', ${it.price_cents})">Add</button></div>
            </div>
          </div>
        `).join(''));
        parts.push(`</div>`);
      } else {
        parts.push(`<div class="muted">(sem itens)</div>`);
      }
    }
    parts.push(`</div>`);
  }

  return parts.join('');
}

function renderHeroBasic(data: WebPreviewData) {
  const title = escapeHtml(data.profile?.hero?.title || data.profile?.slug || 'Restaurante');
  return `
    <div class="hero-basic animate-fade-up">
      <div class="h1" style="font-size:28px">${title}</div>
      <div class="muted" style="margin-top:8px">
        ${escapeHtml(data.profile?.hero?.subtitle || 'Bem-vindo ao nosso menu digital.')}
      </div>
    </div>
  `;
}

function renderHeroPro(data: WebPreviewData) {
  const title = escapeHtml(data.profile?.hero?.title || data.profile?.slug || 'Restaurante');
  const subtitle = escapeHtml(data.profile?.hero?.subtitle || 'Experiência Gastronómica de Excelência');

  return `
    <div class="hero-pro animate-fade-up">
       <div class="hero-overlay"></div>
       <div class="hero-content">
          <h1>${title}</h1>
          <div class="subtitle">${subtitle}</div>
          <div class="hero-actions">
              <button class="btn">Ver Menu</button>
              <button class="btn btn-sec">Reservar Mesa</button>
          </div>
       </div>
    </div>
  `;
}

function renderHeroExperience(data: WebPreviewData) {
  // Mock Gamification Data
  const player = {
    level: 'Explorador',
    points: 150,
    nextRewardAt: 200,
    nextRewardName: 'Sobremesa Grátis',
    missions: [
      { id: 1, title: 'Check-in no Local', reward: '+10 pts', done: false },
      { id: 2, title: 'Pedir Prato do Dia', reward: '+30 pts', done: false },
      { id: 3, title: 'Avaliar Experiência', reward: '+15 pts', done: true }
    ]
  };

  const progress = Math.min(100, (player.points / player.nextRewardAt) * 100);

  return renderHeroPro(data) + `
    <div class="animate-fade-up delay-100" style="margin: -20px 0 40px; position:relative; z-index:10;">
      <div class="glass-panel" style="border-radius:20px; padding:24px; max-width:800px; margin:0 auto; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1)">
         
         <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:16px">
            <div style="display:flex; align-items:center; gap:12px">
               <div style="width:48px; height:48px; background:linear-gradient(135deg, #fbbf24, #d97706); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; color:white; font-size:20px">🧑‍🚀</div>
               <div>
                  <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:0.05em">Nível Atual</div>
                  <div style="font-size:18px; font-weight:800; color:#fbbf24">${player.level}</div>
               </div>
            </div>
            <div style="text-align:right">
               <div style="font-size:12px; font-weight:700; text-transform:uppercase; color:#94a3b8; letter-spacing:0.05em">Próxima Recompensa</div>
               <div style="font-size:16px; font-weight:700">${player.nextRewardName} <span style="font-size:14px; font-weight:400; color:#94a3b8">(${player.points}/${player.nextRewardAt} pts)</span></div>
            </div>
         </div>

         <div style="height:8px; background:rgba(0,0,0,0.1); border-radius:999px; overflow:hidden; margin-bottom:24px">
            <div style="width:${progress}%; height:100%; background:linear-gradient(90deg, #fbbf24, #f59e0b); border-radius:999px; transition:width 1s cubic-bezier(0.4, 0, 0.2, 1)"></div>
         </div>

         <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:12px">
            ${player.missions.map(m => `
              <div style="background:${m.done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)'}; border:1px solid ${m.done ? 'rgba(34,197,94,0.2)' : 'rgba(128,128,128,0.1)'}; padding:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center">
                 <div style="display:flex; align-items:center; gap:8px">
                    <div style="width:16px; height:16px; border-radius:50%; border:2px solid ${m.done ? '#22c55e' : '#94a3b8'}; display:flex; align-items:center; justify-content:center">
                      ${m.done ? '<div style="width:8px; height:8px; background:#22c55e; border-radius:50%"></div>' : ''}
                    </div>
                    <div style="font-size:13px; font-weight:600; ${m.done ? 'text-decoration:line-through; color:#94a3b8' : ''}">${m.title}</div>
                 </div>
                 <div class="badge" style="background:${m.done ? '#22c55e' : 'transparent'}; color:${m.done ? 'white' : '#fbbf24'}; border-color:${m.done ? '#22c55e' : '#fbbf24'}">${m.reward}</div>
              </div>
            `).join('')}
         </div>

      </div>
    </div>
  `;
}

export function renderWebPreviewHtml(level: WebPageLevel, data: WebPreviewData): string {
  const theme = String(data.profile.theme || 'minimal');

  const hero =
    level === 'BASIC'
      ? renderHeroBasic(data)
      : level === 'PRO'
        ? renderHeroPro(data)
        : renderHeroExperience(data);

  const rightCards =
    level === 'BASIC'
      ? `${renderContactsCard(data)}`
      : `${renderContactsCard(data)}${renderHighlightsCard(data)}`;

  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(data.profile.hero?.title || data.slug)}</title>
  <style>${baseCss(theme)}</style>
</head>
<body>
  <div class="wrap">
    ${renderTop(data, level)}
    ${hero}
    <div class="grid-main">
      <div>
        ${renderMenu(data, level)}
      </div>
      <div> <!-- Sidebar -->
        <div style="position:sticky; top: 24px">
          <div class="card" style="margin-bottom:16px; border-color:#fbbf24; background: ${String(theme).toLowerCase() === 'dark' ? 'rgba(251,191,36,0.05)' : '#fff'}">
            <div class="h2">O seu Pedido</div>
            <div id="cart-container" class="muted" style="font-size:14px; margin-bottom:16px">(carrinho vazio)</div>
            <div id="cart-total" style="font-weight:800; font-size:18px; text-align:right; margin-bottom:16px; display:none">Total: 0,00 €</div>
            <button class="btn" style="width:100%; font-size:16px; padding:14px" onclick="checkout()">Finalizar Pedido</button>
          </div>
          ${rightCards}
        </div>
      </div>
    </div>
    
    <div class="muted" style="margin-top:40px; padding-top:20px; border-top:1px solid rgba(148,163,184,.2); text-align:center; font-size:12px">
      Powered by <strong>ChefIApp Empire</strong> • <a href="http://localhost:4320/">Home</a> • <a href="/internal/preview/web-pages?slug=${encodeURIComponent(data.slug)}">Dev Tools</a>
    </div>
  </div>
    ${renderScript(data.slug)}
</body>
</html>`;
}

function renderScript(slug: string) {
  return `
  <script src="https://js.stripe.com/v3/"></script>
  <script>
    const SLUG = "${escapeHtml(slug)}";
    let cart = [];
    let stripe = null;
    let elements = null;
    let paymentIntentId = null;

    async function trackEvent(type, payload = {}) {
      try {
        await fetch(\`/public/\${SLUG}/events\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type, payload })
        });
      } catch (e) {
        console.error('Tracking failed', e);
      }
    }

    // Track Page View
    trackEvent('PAGE_VIEW');

    // Use test key for now, or dynamic if we inject it
    // Ideally this comes from the backend config for the platform
    // For demo/dev: use a public test key or rely on mock if key is invalid
    try {
      stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx'); 
    } catch(e) {
      console.warn('Stripe not init', e);
    }

    function formatPrice(cents) {
      return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(cents / 100);
    }

    function addToCart(id, name, price, type) {
      const existing = cart.find(i => i.id === id);
      if (existing) {
        existing.qty++;
      } else {
        cart.push({ id, name, price, qty: 1, type });
      }
      trackEvent('ADD_TO_CART', { item_id: id, item_name: name, price: price, type: type });
      renderCart();
    }

    function renderCart() {
      const container = document.getElementById('cart-container');
      const totalEl = document.getElementById('cart-total');
      
      if (cart.length === 0) {
        container.innerHTML = '(carrinho vazio)';
        totalEl.style.display = 'none';
        return;
      }

      let total = 0;
      let html = '<div style="display:flex; flex-direction:column; gap:8px">';
      
      cart.forEach(item => {
        const itemTotal = item.qty * item.price;
        total += itemTotal;
        html += \`
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:14px">
            <div>\${item.qty}x \${item.name}</div>
            <div>\${fmtMoney(itemTotal)}</div>
          </div>
        \`;
      });
      html += '</div>';
      
      container.innerHTML = html;
      totalEl.innerHTML = 'Total: ' + fmtMoney(total);
      totalEl.style.display = 'block';
    }

    async function checkout() {
      if (cart.length === 0) {
        alert('O carrinho está vazio.');
        return;
      }

      const btn = document.querySelector('button[onclick="checkout()"]');
      const originalText = btn.innerText;
      btn.innerText = 'Criando pedido...';
      btn.disabled = true;

      try {
        const payload = {
          items: cart.map(i => ({ menu_item_id: i.id, qty: i.qty })),
          pickup_type: 'TAKEAWAY'
        };

        const res = await fetch('/public/' + SLUG + '/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Erro ao criar pedido');
        }

        console.log('Order created:', data);
        
        if (data.payment_intent && data.payment_intent.client_secret) {
             const cs = data.payment_intent.client_secret;
             // Check if mock
             if (cs.startsWith('secret_mock')) {
                 alert('Pedido criado (MOCK GATEWAY)!\\nID: ' + data.order_id);
                 cart = [];
                 renderCart();
             } else {
                 // Real Stripe Flow
                 showPaymentModal(cs);
             }
        } else {
             alert('Pedido criado! Status: ' + data.payment_status);
        }

      } catch (e) {
        console.error(e);
        alert('Erro: ' + e.message);
      } finally {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }

    function showPaymentModal(clientSecret) {
        // Overlay
        const overlay = document.createElement('div');
        overlay.style = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999';
        overlay.id = 'payment-overlay';

        // Modal content
        const modal = document.createElement('div');
        modal.style = 'background:white;padding:24px;border-radius:12px;width:90%;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,0.15)';
        modal.innerHTML = \`
           <div style="margin-bottom:16px;font-weight:bold;font-size:18px">Pagamento Seguro</div>
           <div id="payment-element"></div>
           <div id="payment-message" style="color:red;margin-top:8px;display:none"></div>
           <button id="submit-payment" style="margin-top:16px;width:100%;padding:12px;background:#000;color:#fff;border:none;border-radius:6px;font-weight:bold;cursor:pointer">
             Pagar Agora
           </button>
           <button onclick="document.getElementById('payment-overlay').remove()" style="margin-top:8px;width:100%;padding:8px;background:none;border:none;color:#555;cursor:pointer">Cancelar</button>
        \`;

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Init Stripe Elements
        const appearance = { theme: 'stripe' };
        elements = stripe.elements({ appearance, clientSecret });
        const paymentElement = elements.create('payment');
        paymentElement.mount('#payment-element');

        document.getElementById('submit-payment').addEventListener('click', async () => {
             const { error } = await stripe.confirmPayment({
                 elements,
                 confirmParams: {
                   return_url: window.location.href, // Simplified for preview
                 },
             });

             if (error) {
                 const msg = document.getElementById('payment-message');
                 msg.innerText = error.message;
                 msg.style.display = 'block';
             }
        });
    }
  </script>
  `;
}

export function renderWebPreviewIndexHtml(slug: string): string {
  const s = escapeHtml(slug);
  const enc = encodeURIComponent(slug);
  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ChefIApp Dev • ${s}</title>
  <style>${baseCss('dark')}</style>
  <style>
    body { background: #0f172a; display:flex; align-items:center; justify-content:center; min-height:100vh; }
    .nav-card {
      text-decoration: none;
      padding: 24px;
      border: 1px solid rgba(255,255,255,0.1);
      background: rgba(255,255,255,0.03);
      border-radius: 16px;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .nav-card:hover {
      background: rgba(255,255,255,0.08);
      transform: translateY(-4px);
      border-color: #fbbf24;
    }
    .level-badge {
      font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
      color: #94a3b8;
    }
    .nav-card:hover .level-badge { color: #fbbf24; }
  </style>
</head>
<body>
  <div class="glass-panel animate-fade-up" style="width:100%; max-width:800px; border-radius:32px; padding:48px; box-shadow:0 40px 80px -20px rgba(0,0,0,0.5)">
    <div style="text-align:center; margin-bottom:48px">
      <div class="badge" style="margin-bottom:16px; border-color:#fbbf24; color:#fbbf24">Internal Tools</div>
      <h1 class="h1" style="font-size:48px; background: linear-gradient(to bottom right, #fff, #94a3b8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ChefIApp Empire</h1>
      <div class="subtitle" style="color:#cbd5e1; margin-top:12px; font-size:18px">Simulador de Experiência Digital • ${s}</div>
    </div>

    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:20px; margin-bottom:40px">
      <a href="/internal/preview/web-page/BASIC?slug=${enc}" class="nav-card">
        <div class="level-badge">Nível 1</div>
        <div style="font-size:24px; font-weight:700; color:white">Basic</div>
        <div class="muted" style="font-size:14px">Funcionalidade essencial. Lista simples, sem distrações.</div>
      </a>
      
      <a href="/internal/preview/web-page/PRO?slug=${enc}" class="nav-card" style="border-color:rgba(251,191,36,0.3); background:rgba(251,191,36,0.05)">
        <div class="level-badge" style="color:#fbbf24">Nível 2</div>
        <div style="font-size:24px; font-weight:700; color:white">Pro</div>
        <div class="muted" style="font-size:14px">Design premium. Grid layout, tipografia refinada e glassmorphism.</div>
      </a>

      <a href="/internal/preview/web-page/EXPERIENCE?slug=${enc}" class="nav-card" style="border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.05)">
        <div class="level-badge" style="color:#10b981">Nível 3</div>
        <div style="font-size:24px; font-weight:700; color:white">Experience</div>
        <div class="muted" style="font-size:14px">Gamificação total. Pontos, missões e recompensas visuais.</div>
      </a>
    </div>

    <div style="text-align:center; display:flex; gap:16px; justify-content:center; border-top:1px solid rgba(255,255,255,0.1); padding-top:32px">
        <a href="/public/${enc}" class="btn btn-outline" style="border-radius:99px; padding:12px 24px">Ver Link Público (Produção)</a>
        <a href="/" class="btn btn-outline" style="border-radius:99px; padding:12px 24px">Voltar à Home</a>
    </div>
  </div>
</body>
</html>`;
}

export function renderHomePage(): string {
  return `<!doctype html>
<html lang="pt-PT">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ChefIApp Empire • Verdade Operacional</title>
  <style>${baseCss('dark')}</style>
  <style>
    body { background: #020617; overflow-x: hidden; color: #e2e8f0; }
    
    /* Hero Background */
    .hero-bg {
      position: absolute; top:0; left:0; width:100%; height:100vh; z-index:-1;
      background: radial-gradient(circle at 50% 0%, #1e293b 0%, #020617 70%);
    }
    .orb {
        position: absolute; width: 600px; height: 600px; background: radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(0,0,0,0) 70%);
        border-radius: 50%; filter: blur(80px); top: -200px; left: 50%; transform: translateX(-50%); animation: pulse 10s infinite alternate;
    }
    @keyframes pulse { 0% { opacity: 0.5; transform: translateX(-50%) scale(0.8); } 100% { opacity: 1; transform: translateX(-50%) scale(1.2); } }

    /* Sections */
    section { padding: 100px 24px; max-width: 1000px; margin: 0 auto; }
    .text-center { text-align: center; }
    .glass-card {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 40px;
        backdrop-filter: blur(10px);
    }
    
    /* Typography Overrides */
    h1 { font-size: 64px; line-height: 1.1; letter-spacing: -0.03em; margin-bottom: 24px; }
    h2 { font-size: 40px; line-height: 1.2; letter-spacing: -0.02em; margin-bottom: 32px; color:white; }
    .lead { font-size: 20px; line-height: 1.6; color: #94a3b8; max-width: 700px; margin: 0 auto; }
    .highlight { color: #fbbf24; }
    
    /* Lists */
    ul.check-list { list-style: none; padding: 0; text-align: left; }
    ul.check-list li { margin-bottom: 16px; font-size: 18px; padding-left: 32px; position: relative; }
    ul.check-list li:before { content: '•'; color: #fbbf24; position: absolute; left: 0; font-weight: bold; }

    /* Grid */
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
    .grid-4 { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; }

    @media(max-width: 768px) {
        h1 { font-size: 42px; }
        .grid-2 { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="hero-bg"><div class="orb"></div></div>

  <!-- 1. HERO -->
  <section style="min-height:90vh; display:flex; flex-direction:column; justify-content:center; align-items:center;" class="text-center animate-fade-up">
     <div class="badge" style="margin-bottom:24px; border-color:#fbbf24; color:#fbbf24; background:rgba(251,191,36,0.1)">Verdade Operacional</div>
     <h1>Seu restaurante não pode<br/><span class="highlight">falhar em silêncio.</span></h1>
     <p class="lead" style="margin-bottom:32px">
       Você sabe que o problema não é a comida. <br/>
       É o que acontece entre o pedido e a entrega.
     </p>
     <a href="http://localhost:5174/login?next=/onboarding" class="btn" style="border-radius:99px; padding:16px 32px; font-size:16px">Ativar no meu restaurante</a>
     <a href="#como-funciona" class="btn btn-outline" style="border-radius:99px; padding:16px 32px; margin-left:16px; font-size:16px; border-color:rgba(255,255,255,0.2); color:#94a3b8">Ver como o controle funciona</a>
  </section>

  <!-- 2. O PROBLEMA -->
  <section id="problema">
    <div class="glass-card">
      <div class="grid-2">
         <div>
            <h2 style="font-size:32px; margin-bottom:16px">O Espelho Brutal</h2>
            <p style="font-size:18px; color:#cbd5e1; margin-bottom:24px">Se você tem um restaurante, provavelmente:</p>
            <ul class="check-list" style="color:#ef4444">
               <li style="color:#cbd5e1"><span style="color:#ef4444">✕</span> Pedidos se perdem</li>
               <li style="color:#cbd5e1"><span style="color:#ef4444">✕</span> Tarefas não são cumpridas</li>
               <li style="color:#cbd5e1"><span style="color:#ef4444">✕</span> Erros não têm registro</li>
               <li style="color:#cbd5e1"><span style="color:#ef4444">✕</span> Decisões são tomadas no "feeling"</li>
            </ul>
            <p style="font-size:16px; color:#94a3b8; margin-top:24px; font-style:italic">Se você reconhece dois desses pontos, o problema já está claro.</p>
         </div>
         <div style="border-left:1px solid rgba(255,255,255,0.1); padding-left:40px; display:flex; align-items:center; justify-content:center">
             <div style="font-size:24px; font-weight:600; text-align:center; line-height:1.4">
                "Isso não é falta de esforço.<br/>
                <span class="highlight">É falta de sistema.</span>"
             </div>
         </div>
      </div>
    </div>
  </section>

  <!-- 3. A PROMESSA REAL -->
  <section class="text-center">
     <h2>ChefIApp não é um painel.<br/>É um <span class="highlight">sistema operacional.</span></h2>
     <div class="grid-4" style="margin-top:48px; text-align:left">
        <div class="nav-card">
           <div class="highlight" style="font-size:24px; margin-bottom:8px">01</div>
           <div style="font-weight:600; margin-bottom:8px">Registro Total</div>
           <div class="muted">Tudo o que acontece fica registrado. Nada some.</div>
        </div>
        <div class="nav-card">
           <div class="highlight" style="font-size:24px; margin-bottom:8px">02</div>
           <div style="font-weight:600; margin-bottom:8px">Rastreio</div>
           <div class="muted">Cada ação tem tempo, responsável e status.</div>
        </div>
        <div class="nav-card">
           <div class="highlight" style="font-size:24px; margin-bottom:8px">03</div>
           <div style="font-weight:600; margin-bottom:8px">Ordem</div>
           <div class="muted">A cozinha trabalha com prioridade real.</div>
        </div>
        <div class="nav-card">
           <div class="highlight" style="font-size:24px; margin-bottom:8px">04</div>
           <div style="font-weight:600; margin-bottom:8px">Verdade Operacional</div>
           <div class="muted">O dono vê o que está acontecendo — não o que gostaria.</div>
        </div>
     </div>
  </section>

  <!-- 4. COMO FUNCIONA -->
  <section id="como-funciona">
     <h2 class="text-center">Como Funciona</h2>
     <div style="display:grid; gap:32px; margin-top:40px">
        <div class="glass-card" style="display:flex; align-items:center; gap:24px">
           <div style="font-size:40px">📱</div>
           <div>
              <h3 style="font-size:20px; font-weight:700; color:white; margin:0 0 8px 0">TPV Vivo</h3>
              <p class="muted">Pedidos entram, avançam, fecham. Nada desaparece. Nada "fica no ar".</p>
           </div>
        </div>
        <div class="glass-card" style="display:flex; align-items:center; gap:24px">
           <div style="font-size:40px">🧑‍🍳</div>
           <div>
              <h3 style="font-size:20px; font-weight:700; color:white; margin:0 0 8px 0">Cozinha Conectada (KDS)</h3>
              <p class="muted">A cozinha vê o que importa, na ordem certa. Sem grito. Sem papel. Sem caos.</p>
           </div>
        </div>
        <div class="glass-card" style="display:flex; align-items:center; gap:24px">
           <div style="font-size:40px">👥</div>
           <div>
              <h3 style="font-size:20px; font-weight:700; color:white; margin:0 0 8px 0">Equipe com Responsabilidade</h3>
              <p class="muted">Tarefas claras. Estados claros. O sistema sabe quem respondeu — e quem não.</p>
           </div>
        </div>
         <div class="glass-card" style="display:flex; align-items:center; gap:24px">
           <div style="font-size:40px">🧠</div>
           <div>
              <h3 style="font-size:20px; font-weight:700; color:white; margin:0 0 8px 0">Gestão em Tempo Real</h3>
              <p class="muted">Não é relatório do passado. É consciência do presente.</p>
           </div>
        </div>
     </div>
     <div class="text-center muted" style="margin-top:40px; font-size:18px">Tudo conectado em tempo real. Nada desaparece.</div>
  </section>

  <!-- 5. DIFERENCIAL -->
  <section class="text-center" style="position:relative">
     <div style="background: radial-gradient(circle, rgba(251,191,36,0.1) 0%, rgba(0,0,0,0) 60%); position:absolute; inset:0; z-index:-1"></div>
     <h2 style="font-size:48px">Se algo falha, o ChefIApp avisa.<br/>Se algo some, <span class="highlight">o ChefIApp reage.</span></h2>
     <p class="lead" style="margin-top:24px">
       A maioria dos sistemas apenas registra.<br/>
       O ChefIApp observa padrões operacionais e alerta antes do prejuízo.
     </p>
     <div class="badge" style="margin-top:32px; border-color:#fbbf24; color:#fbbf24">Inteligência Operacional</div>
  </section>

  <!-- 6. PARA QUEM É -->
  <section>
    <div class="grid-2">
       <div>
          <h3 style="color:white; font-size:24px; margin-bottom:16px">Para quem é:</h3>
          <ul class="check-list">
             <li>Restaurantes que querem crescer sem perder controle</li>
             <li>Donos que querem dados reais</li>
             <li>Equipes que precisam de clareza, não cobrança cega</li>
          </ul>
       </div>
       <div style="opacity:0.6">
          <h3 style="color:white; font-size:24px; margin-bottom:16px">Não é para:</h3>
          <ul class="check-list">
             <li style="text-decoration:line-through; color:#64748b">Quem quer só um painel bonito</li>
             <li style="text-decoration:line-through; color:#64748b">Quem não quer mudar a operação</li>
             <li style="text-decoration:line-through; color:#64748b">Quem prefere apagar incêndio</li>
          </ul>
       </div>
    </div>
  </section>

  <!-- 7. PROVA -->
  <section class="text-center">
     <h2 style="font-size:32px; margin-bottom:32px">Usado em restaurantes reais</h2>
     <div class="glass-card" style="max-width:600px; margin:0 auto">
        <h3 style="font-size:24px; color:#fbbf24; margin-bottom:16px">Sofia Gastrobar (Ibiza)</h3>
        <div style="font-size:20px; font-weight:600; color:white; font-style:italic; margin-bottom:24px">
           "Antes tínhamos correria. Agora temos clareza."
        </div>
        <a href="/public/sofia-gastrobar" target="_blank" class="btn btn-outline" style="border-radius:99px; font-size:14px; padding:12px 24px">Ver restaurante em funcionamento</a>
     </div>
  </section>

  <!-- 8. CTA -->
  <section class="text-center" style="padding-bottom:120px">
     <h2 style="font-size:56px; margin-bottom:16px">Comece simples.<br/><span class="highlight">Controle tudo.</span></h2>
     <p class="lead" style="margin-bottom:48px">Ative o ChefIApp no seu restaurante.</p>
     
     <div style="display:flex; flex-direction:column; align-items:center; gap:16px">
        <a href="http://localhost:5174/login?next=/onboarding" class="btn" style="padding:20px 60px; font-size:20px; border-radius:12px; font-weight:700">Ativar ChefIApp no meu restaurante</a>
        <div style="font-size:14px; color:#64748b">
           Plano único. Sem surpresas. 29€/mês.<br/>
           <span style="font-size:12px; opacity:0.7">Ativação leva menos de 10 minutos.</span>
        </div>
     </div>
  </section>

  <div style="text-align:center; padding:24px; color:#475569; font-size:12px; border-top:1px solid rgba(255,255,255,0.05)">
     &copy; 2025 GoldMonkey Empire • ChefIApp POS Core v1.0
  </div>

</body>
</html>
  `;
}
