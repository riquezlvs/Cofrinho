/**
 * Mapeamento abrangente de marcas e identificadores para obtenção de logos oficiais.
 * Permite resolver domínios de empresas nacionais (brasileiras) e globais
 * a partir do título da transação com Google Favicon V2 API em alta resolução.
 */

export interface BrandInfo {
  domain: string;
  name: string;
  color?: string;
}

export const KNOWN_BRANDS: Record<string, BrandInfo> = {
  // === Hardware, Tech & Eletrônicos ===
  "dell": { domain: "dell.com", name: "Dell", color: "#007DB8" },
  "notebook dell": { domain: "dell.com", name: "Dell", color: "#007DB8" },
  "computador dell": { domain: "dell.com", name: "Dell", color: "#007DB8" },
  "google": { domain: "google.com", name: "Google", color: "#4285F4" },
  "google one": { domain: "google.com", name: "Google One", color: "#4285F4" },
  "google play": { domain: "play.google.com", name: "Google Play", color: "#01875F" },
  "google drive": { domain: "google.com", name: "Google Drive", color: "#4285F4" },
  "google workspace": { domain: "workspace.google.com", name: "Google Workspace", color: "#4285F4" },
  "apple": { domain: "apple.com", name: "Apple", color: "#000000" },
  "app store": { domain: "apple.com", name: "App Store", color: "#0070c9" },
  "apple tv": { domain: "apple.com", name: "Apple TV", color: "#000000" },
  "apple music": { domain: "apple.com", name: "Apple Music", color: "#FA2D48" },
  "icloud": { domain: "icloud.com", name: "iCloud", color: "#3699FF" },
  "microsoft": { domain: "microsoft.com", name: "Microsoft", color: "#00A4EF" },
  "xbox": { domain: "xbox.com", name: "Xbox", color: "#107C10" },
  "office 365": { domain: "microsoft.com", name: "Office 365", color: "#D83B01" },
  "playstation": { domain: "playstation.com", name: "PlayStation", color: "#003791" },
  "psn": { domain: "playstation.com", name: "PlayStation Network", color: "#003791" },
  "sony": { domain: "sony.com", name: "Sony", color: "#000000" },
  "nintendo": { domain: "nintendo.com", name: "Nintendo", color: "#E60012" },
  "samsung": { domain: "samsung.com.br", name: "Samsung", color: "#1428A0" },
  "lenovo": { domain: "lenovo.com", name: "Lenovo", color: "#E2231A" },
  "hp": { domain: "hp.com", name: "HP", color: "#0096D6" },
  "asus": { domain: "asus.com", name: "Asus", color: "#002F6C" },
  "lg": { domain: "lg.com.br", name: "LG", color: "#A50034" },
  "logitech": { domain: "logitech.com", name: "Logitech", color: "#00B8FC" },
  "intelbras": { domain: "intelbras.com.br", name: "Intelbras", color: "#007A33" },
  "kabum": { domain: "kabum.com.br", name: "KaBuM!", color: "#FF6500" },
  "pichau": { domain: "pichau.com.br", name: "Pichau", color: "#E02B20" },
  "terabyte": { domain: "terabyteshop.com.br", name: "Terabyte", color: "#FF7300" },
  "kalunga": { domain: "kalunga.com.br", name: "Kalunga", color: "#004B9B" },
  "fast shop": { domain: "fastshop.com.br", name: "Fast Shop", color: "#000000" },
  "fastshop": { domain: "fastshop.com.br", name: "Fast Shop", color: "#000000" },

  // === Ferramentas & Produtividade & IA ===
  "chatgpt": { domain: "openai.com", name: "ChatGPT", color: "#10A37F" },
  "openai": { domain: "openai.com", name: "OpenAI", color: "#10A37F" },
  "claude": { domain: "anthropic.com", name: "Anthropic Claude", color: "#D97706" },
  "anthropic": { domain: "anthropic.com", name: "Anthropic", color: "#D97706" },
  "github": { domain: "github.com", name: "GitHub", color: "#181717" },
  "notion": { domain: "notion.so", name: "Notion", color: "#000000" },
  "figma": { domain: "figma.com", name: "Figma", color: "#F24E1E" },
  "canva": { domain: "canva.com", name: "Canva", color: "#00C4CC" },
  "adobe": { domain: "adobe.com", name: "Adobe", color: "#FF0000" },
  "linkedin": { domain: "linkedin.com", name: "LinkedIn", color: "#0A66C2" },
  "duolingo": { domain: "duolingo.com", name: "Duolingo", color: "#58CC02" },

  // === Streaming & Música & Cinema ===
  "spotify": { domain: "spotify.com", name: "Spotify", color: "#1DB954" },
  "netflix": { domain: "netflix.com", name: "Netflix", color: "#E50914" },
  "prime video": { domain: "primevideo.com", name: "Prime Video", color: "#00A8E1" },
  "disney": { domain: "disneyplus.com", name: "Disney+", color: "#113CCF" },
  "disney plus": { domain: "disneyplus.com", name: "Disney+", color: "#113CCF" },
  "disney+": { domain: "disneyplus.com", name: "Disney+", color: "#113CCF" },
  "hbo": { domain: "max.com", name: "Max", color: "#002BE7" },
  "hbo max": { domain: "max.com", name: "Max", color: "#002BE7" },
  "max": { domain: "max.com", name: "Max", color: "#002BE7" },
  "globoplay": { domain: "globoplay.globo.com", name: "Globoplay", color: "#FB0A09" },
  "youtube": { domain: "youtube.com", name: "YouTube", color: "#FF0000" },
  "youtube premium": { domain: "youtube.com", name: "YouTube Premium", color: "#FF0000" },
  "deezer": { domain: "deezer.com", name: "Deezer", color: "#A238FF" },
  "tidal": { domain: "tidal.com", name: "Tidal", color: "#000000" },
  "crunchyroll": { domain: "crunchyroll.com", name: "Crunchyroll", color: "#F47521" },
  "steam": { domain: "steampowered.com", name: "Steam", color: "#171A21" },
  "epic games": { domain: "epicgames.com", name: "Epic Games", color: "#313131" },
  "imax": { domain: "imax.com", name: "IMAX", color: "#000000" },
  "cinema imax": { domain: "imax.com", name: "Cinema IMAX", color: "#000000" },
  "cinemark": { domain: "cinemark.com.br", name: "Cinemark", color: "#E31B23" },
  "cinepolis": { domain: "cinepolis.com.br", name: "Cinépolis", color: "#0B2265" },
  "kinoplex": { domain: "kinoplex.com.br", name: "Kinoplex", color: "#F26522" },
  "ingresso": { domain: "ingresso.com", name: "Ingresso.com", color: "#FF5E00" },
  "ingresso.com": { domain: "ingresso.com", name: "Ingresso.com", color: "#FF5E00" },
  "sympla": { domain: "sympla.com.br", name: "Sympla", color: "#0073F6" },

  // === Delivery & Restaurantes & Cafés ===
  "ifood": { domain: "ifood.com.br", name: "iFood", color: "#EA1D2C" },
  "rappi": { domain: "rappi.com.br", name: "Rappi", color: "#FF441F" },
  "ze delivery": { domain: "zedelivery.com.br", name: "Zé Delivery", color: "#FFCC00" },
  "zé delivery": { domain: "zedelivery.com.br", name: "Zé Delivery", color: "#FFCC00" },
  "mcdonalds": { domain: "mcdonalds.com.br", name: "McDonald's", color: "#FFBC0D" },
  "mc donalds": { domain: "mcdonalds.com.br", name: "McDonald's", color: "#FFBC0D" },
  "mequi": { domain: "mcdonalds.com.br", name: "Méqui", color: "#FFBC0D" },
  "burger king": { domain: "burgerking.com.br", name: "Burger King", color: "#D62300" },
  "bk": { domain: "burgerking.com.br", name: "Burger King", color: "#D62300" },
  "starbucks": { domain: "starbucks.com.br", name: "Starbucks", color: "#006241" },
  "subway": { domain: "subway.com", name: "Subway", color: "#008C15" },
  "habibs": { domain: "habibs.com.br", name: "Habib's", color: "#C8102E" },
  "outback": { domain: "outback.com.br", name: "Outback", color: "#800000" },
  "coco bambu": { domain: "cocobambu.com.br", name: "Coco Bambu", color: "#8B5A2B" },
  "pizza hut": { domain: "pizzahut.com.br", name: "Pizza Hut", color: "#EE3124" },
  "dominos": { domain: "dominos.com.br", name: "Domino's Pizza", color: "#006491" },
  "cacau show": { domain: "cacaushow.com.br", name: "Cacau Show", color: "#3B2314" },
  "kopenhagen": { domain: "kopenhagen.com.br", name: "Kopenhagen", color: "#2E1A11" },
  "bacio di latte": { domain: "baciodilatte.com.br", name: "Bacio di Latte", color: "#3E2B1D" },

  // === Supermercados & Hortifruti ===
  "hortifruti": { domain: "hortifruti.com.br", name: "Hortifruti", color: "#006837" },
  "natural da terra": { domain: "hortifruti.com.br", name: "Natural da Terra", color: "#006837" },
  "pao de acucar": { domain: "paodeacucar.com", name: "Pão de Açúcar", color: "#008542" },
  "pão de açúcar": { domain: "paodeacucar.com", name: "Pão de Açúcar", color: "#008542" },
  "carrefour": { domain: "carrefour.com.br", name: "Carrefour", color: "#004B9B" },
  "assai": { domain: "assai.com.br", name: "Assaí", color: "#ED1C24" },
  "assaí": { domain: "assai.com.br", name: "Assaí", color: "#ED1C24" },
  "atacadao": { domain: "atacadao.com.br", name: "Atacadão", color: "#F37021" },
  "atacadão": { domain: "atacadao.com.br", name: "Atacadão", color: "#F37021" },
  "extra": { domain: "clubeextra.com.br", name: "Extra", color: "#ED1C24" },
  "st marche": { domain: "marche.com.br", name: "St Marche", color: "#2B2B2B" },
  "oba hortifruti": { domain: "obahortifruti.com.br", name: "Oba Hortifruti", color: "#E30613" },
  "dia supermercado": { domain: "dia.com.br", name: "Dia", color: "#ED1C24" },

  // === E-commerce & Varejo & Moda ===
  "amazon": { domain: "amazon.com.br", name: "Amazon", color: "#FF9900" },
  "mercado livre": { domain: "mercadolivre.com.br", name: "Mercado Livre", color: "#FFE600" },
  "mercadolivre": { domain: "mercadolivre.com.br", name: "Mercado Livre", color: "#FFE600" },
  "mercado pago": { domain: "mercadopago.com.br", name: "Mercado Pago", color: "#009EE3" },
  "shopee": { domain: "shopee.com.br", name: "Shopee", color: "#EE4D2D" },
  "magalu": { domain: "magazineluiza.com.br", name: "Magazine Luiza", color: "#0086FF" },
  "magazine luiza": { domain: "magazineluiza.com.br", name: "Magazine Luiza", color: "#0086FF" },
  "casas bahia": { domain: "casasbahia.com.br", name: "Casas Bahia", color: "#003399" },
  "americanas": { domain: "americanas.com.br", name: "Americanas", color: "#E60014" },
  "leroy merlin": { domain: "leroymerlin.com.br", name: "Leroy Merlin", color: "#78BE20" },
  "zara": { domain: "zara.com", name: "Zara", color: "#000000" },
  "renner": { domain: "lojasrenner.com.br", name: "Lojas Renner", color: "#E30613" },
  "lojas renner": { domain: "lojasrenner.com.br", name: "Lojas Renner", color: "#E30613" },
  "c&a": { domain: "cea.com.br", name: "C&A", color: "#E30613" },
  "cea": { domain: "cea.com.br", name: "C&A", color: "#E30613" },
  "riachuelo": { domain: "riachuelo.com.br", name: "Riachuelo", color: "#000000" },
  "shein": { domain: "shein.com", name: "Shein", color: "#000000" },
  "aliexpress": { domain: "aliexpress.com", name: "AliExpress", color: "#FF4747" },
  "decathlon": { domain: "decathlon.com.br", name: "Decathlon", color: "#0082C3" },
  "centauro": { domain: "centauro.com.br", name: "Centauro", color: "#E30613" },
  "nike": { domain: "nike.com.br", name: "Nike", color: "#111111" },
  "adidas": { domain: "adidas.com.br", name: "Adidas", color: "#000000" },

  // === Farmácias & Saúde ===
  "droga raia": { domain: "drogaraia.com.br", name: "Droga Raia", color: "#005697" },
  "farmacia raia": { domain: "drogaraia.com.br", name: "Droga Raia", color: "#005697" },
  "raia": { domain: "drogaraia.com.br", name: "Droga Raia", color: "#005697" },
  "drogasil": { domain: "drogasil.com.br", name: "Drogasil", color: "#E30613" },
  "drogaria sp": { domain: "drogariasaopaulo.com.br", name: "Drogaria São Paulo", color: "#D32F2F" },
  "drogaria sao paulo": { domain: "drogariasaopaulo.com.br", name: "Drogaria São Paulo", color: "#D32F2F" },
  "drogaria são paulo": { domain: "drogariasaopaulo.com.br", name: "Drogaria São Paulo", color: "#D32F2F" },
  "drogaria pacheco": { domain: "drogariaspacheco.com.br", name: "Drogaria Pacheco", color: "#E30613" },
  "pague menos": { domain: "paguemenos.com.br", name: "Pague Menos", color: "#E30613" },
  "panvel": { domain: "panvel.com.br", name: "Panvel", color: "#005CA9" },
  "petz": { domain: "petz.com.br", name: "Petz", color: "#0047BA" },
  "cobasi": { domain: "cobasi.com.br", name: "Cobasi", color: "#007A33" },

  // === Utilities, Energia & Telecom ===
  "enel": { domain: "enel.com.br", name: "Enel", color: "#0081C9" },
  "sabesp": { domain: "sabesp.com.br", name: "Sabesp", color: "#004B87" },
  "cpfl": { domain: "cpfl.com.br", name: "CPFL Energia", color: "#007A33" },
  "cemig": { domain: "cemig.com.br", name: "Cemig", color: "#008542" },
  "comgas": { domain: "comgas.com.br", name: "Comgás", color: "#004B87" },
  "comgás": { domain: "comgas.com.br", name: "Comgás", color: "#004B87" },
  "light": { domain: "light.com.br", name: "Light", color: "#008542" },
  "neoenergia": { domain: "neoenergia.com.br", name: "Neoenergia", color: "#007A33" },
  "claro": { domain: "claro.com.br", name: "Claro", color: "#DA291C" },
  "vivo": { domain: "vivo.com.br", name: "Vivo", color: "#660099" },
  "tim": { domain: "tim.com.br", name: "TIM", color: "#003399" },
  "oi": { domain: "oi.com.br", name: "Oi", color: "#FFD000" },

  // === Combustível & Pedágio & Mobilidade ===
  "shell": { domain: "shell.com.br", name: "Shell", color: "#FFD500" },
  "posto shell": { domain: "shell.com.br", name: "Shell", color: "#FFD500" },
  "ipiranga": { domain: "ipiranga.com.br", name: "Ipiranga", color: "#FFC700" },
  "posto ipiranga": { domain: "ipiranga.com.br", name: "Ipiranga", color: "#FFC700" },
  "petrobras": { domain: "postospetrobras.com.br", name: "Petrobras", color: "#008542" },
  "posto petrobras": { domain: "postospetrobras.com.br", name: "Petrobras", color: "#008542" },
  "sem parar": { domain: "semparar.com.br", name: "Sem Parar", color: "#ED1C24" },
  "semparar": { domain: "semparar.com.br", name: "Sem Parar", color: "#ED1C24" },
  "conectcar": { domain: "conectcar.com", name: "ConectCar", color: "#005697" },
  "veloe": { domain: "veloe.com.br", name: "Veloe", color: "#000000" },
  "uber": { domain: "uber.com", name: "Uber", color: "#000000" },
  "99": { domain: "99app.com", name: "99", color: "#F7B928" },
  "99app": { domain: "99app.com", name: "99", color: "#F7B928" },
  "99pop": { domain: "99app.com", name: "99", color: "#F7B928" },
  "localiza": { domain: "localiza.com", name: "Localiza", color: "#007A33" },
  "movida": { domain: "movida.com.br", name: "Movida", color: "#FF5900" },
  "gol": { domain: "voegol.com.br", name: "GOL", color: "#FF5A00" },
  "latam": { domain: "latamairlines.com", name: "LATAM", color: "#E8112D" },
  "azul": { domain: "voeazul.com.br", name: "Azul Linhas Aéreas", color: "#002B49" },
  "airbnb": { domain: "airbnb.com.br", name: "Airbnb", color: "#FF5A5F" },
  "booking": { domain: "booking.com", name: "Booking.com", color: "#003580" },

  // === Fitness & Estilo de Vida ===
  "smart fit": { domain: "smartfit.com.br", name: "Smart Fit", color: "#FFB800" },
  "smartfit": { domain: "smartfit.com.br", name: "Smart Fit", color: "#FFB800" },
  "wellhub": { domain: "wellhub.com", name: "Wellhub", color: "#FF385C" },
  "gympass": { domain: "wellhub.com", name: "Wellhub", color: "#FF385C" },
  "totalpass": { domain: "totalpass.com.br", name: "TotalPass", color: "#FF385C" },
  "bluefit": { domain: "bluefit.com.br", name: "Bluefit", color: "#005CA9" },
  "tinder": { domain: "tinder.com", name: "Tinder", color: "#FD3A73" },
  "bumble": { domain: "bumble.com", name: "Bumble", color: "#FFC629" },

  // === Bancos & Fintechs & Benefícios ===
  "santander": { domain: "santander.com.br", name: "Santander", color: "#EC0000" },
  "nubank": { domain: "nubank.com.br", name: "Nubank", color: "#820AD1" },
  "itau": { domain: "itau.com.br", name: "Itaú", color: "#EC7000" },
  "itaú": { domain: "itau.com.br", name: "Itaú", color: "#EC7000" },
  "bradesco": { domain: "bradesco.com.br", name: "Bradesco", color: "#CC092F" },
  "inter": { domain: "inter.co", name: "Banco Inter", color: "#FF7A00" },
  "banco inter": { domain: "inter.co", name: "Banco Inter", color: "#FF7A00" },
  "c6": { domain: "c6bank.com.br", name: "C6 Bank", color: "#242424" },
  "c6 bank": { domain: "c6bank.com.br", name: "C6 Bank", color: "#242424" },
  "caixa": { domain: "caixa.gov.br", name: "Caixa", color: "#005CA9" },
  "caixa economica": { domain: "caixa.gov.br", name: "Caixa", color: "#005CA9" },
  "banco do brasil": { domain: "bb.com.br", name: "Banco do Brasil", color: "#FFEF38" },
  "bb": { domain: "bb.com.br", name: "Banco do Brasil", color: "#FFEF38" },
  "btg": { domain: "btgpactual.com", name: "BTG Pactual", color: "#0A1E40" },
  "xp": { domain: "xpi.com.br", name: "XP Investimentos", color: "#000000" },
  "pagbank": { domain: "pagbank.com.br", name: "PagBank", color: "#00A868" },
  "picpay": { domain: "picpay.com", name: "PicPay", color: "#21C25E" },
  "vr": { domain: "vr.com.br", name: "VR Benefícios", color: "#00A859" },
  "vr beneficios": { domain: "vr.com.br", name: "VR Benefícios", color: "#00A859" },
  "alelo": { domain: "alelo.com.br", name: "Alelo", color: "#E30613" },
  "sodexo": { domain: "pluxee.com.br", name: "Pluxee", color: "#00EB88" },
  "pluxee": { domain: "pluxee.com.br", name: "Pluxee", color: "#00EB88" },
  "ticket": { domain: "ticket.com.br", name: "Ticket", color: "#E30613" },
  "caju": { domain: "caju.com.br", name: "Caju", color: "#FF5E36" },
  "flash": { domain: "flashapp.com.br", name: "Flash", color: "#FF007A" },
};

// Chaves ordenadas por tamanho decrescente para priorizar matches mais específicos (ex: 'google one' antes de 'google')
const SORTED_BRAND_KEYS = Object.keys(KNOWN_BRANDS).sort((a, b) => b.length - a.length);

/**
 * Normaliza uma string para comparação (sem acentos, minúsculas, pontuações excedentes).
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Tenta encontrar a marca correspondente baseando-se no título da compra.
 * Suporta detecção direta por palavra-chave, por domínio explícito e com normalização de termos.
 */
export function detectBrand(title: string): BrandInfo | null {
  if (!title) return null;
  const raw = title.trim();
  const normalized = normalizeText(raw);

  // 1. Se o próprio título contiver um domínio explícito (ex: "dell.com", "sub.netflix.com")
  const domainMatch = raw.match(/\b([a-zA-Z0-9-]+\.(?:com\.br|com|co|app|io|net|org|ai|me))\b/i);
  if (domainMatch) {
    const foundDomain = domainMatch[1].toLowerCase();
    return {
      domain: foundDomain,
      name: foundDomain,
    };
  }

  // 2. Busca nas marcas conhecidas (da chave mais longa para a mais curta)
  for (const key of SORTED_BRAND_KEYS) {
    const normKey = normalizeText(key);

    // Se chave for curta (<= 3 letras como "99", "hp", "lg", "oi", "bb", "vr", "bk"), exige palavra inteira
    if (normKey.length <= 3) {
      const regex = new RegExp(`(^|[^a-z0-9])${normKey}([^a-z0-9]|$)`, "i");
      if (regex.test(normalized)) {
        return KNOWN_BRANDS[key];
      }
    } else {
      // Para marcas maiores, aceita palavra inteira ou contenção direta
      if (normalized.includes(normKey)) {
        return KNOWN_BRANDS[key];
      }
    }
  }

  return null;
}

/**
 * Retorna a URL do logo em alta resolução da empresa utilizando a Google Favicon V2 API oficial.
 * Usa type=FAVICON para garantir retorno de imagem de alta qualidade (128x128).
 */
export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  const cleanDomain = domain
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "")
    .trim();
  return `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${cleanDomain}&size=${size}`;
}

/**
 * Gera uma cor de fundo pastel/vibrante estável a partir de qualquer string (ex: nome da loja).
 */
export function getAvatarColor(name: string): string {
  const colors = [
    "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4",
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#14b8a6"
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
