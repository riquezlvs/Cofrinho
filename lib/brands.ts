/**
 * Mapeamento de marcas e identificadores para obtenção de logos oficiais.
 * Permite resolver domínios de empresas nacionais (brasileiras) e globais
 * a partir do título da transação.
 */

export interface BrandInfo {
  domain: string;
  name: string;
  color?: string;
}

export const KNOWN_BRANDS: Record<string, BrandInfo> = {
  // Mobilidade / Viagem
  "99": { domain: "99app.com", name: "99", color: "#F7B928" },
  "99app": { domain: "99app.com", name: "99", color: "#F7B928" },
  "99pop": { domain: "99app.com", name: "99", color: "#F7B928" },
  "uber": { domain: "uber.com", name: "Uber", color: "#000000" },

  // Bem-estar / Saúde / Farmácias
  "wellhub": { domain: "wellhub.com", name: "Wellhub", color: "#FF385C" },
  "gympass": { domain: "wellhub.com", name: "Wellhub", color: "#FF385C" },
  "drogaria sp": { domain: "drogariasaopaulo.com.br", name: "Drogaria São Paulo", color: "#D32F2F" },
  "drogaria sao paulo": { domain: "drogariasaopaulo.com.br", name: "Drogaria São Paulo", color: "#D32F2F" },
  "drogasil": { domain: "drogasil.com.br", name: "Drogasil", color: "#E30613" },
  "droga raia": { domain: "drogaraia.com.br", name: "Droga Raia", color: "#005697" },
  "smart fit": { domain: "smartfit.com.br", name: "Smart Fit", color: "#FFB800" },

  // Assinaturas / Lifestyle / Relacionamento
  "tinder": { domain: "tinder.com", name: "Tinder", color: "#FD3A73" },
  "spotify": { domain: "spotify.com", name: "Spotify", color: "#1DB954" },
  "netflix": { domain: "netflix.com", name: "Netflix", color: "#E50914" },
  "prime video": { domain: "primevideo.com", name: "Amazon Prime Video", color: "#00A8E1" },
  "disney": { domain: "disneyplus.com", name: "Disney+", color: "#113CCF" },
  "max": { domain: "max.com", name: "Max", color: "#002BE7" },
  "hbo": { domain: "max.com", name: "Max", color: "#002BE7" },
  "youtube": { domain: "youtube.com", name: "YouTube", color: "#FF0000" },
  "deezer": { domain: "deezer.com", name: "Deezer", color: "#A238FF" },
  "apple": { domain: "apple.com", name: "Apple", color: "#000000" },
  "steam": { domain: "steampowered.com", name: "Steam", color: "#171A21" },
  "chatgpt": { domain: "openai.com", name: "OpenAI", color: "#10A37F" },
  "openai": { domain: "openai.com", name: "OpenAI", color: "#10A37F" },

  // Delivery / Restaurantes
  "ifood": { domain: "ifood.com.br", name: "iFood", color: "#EA1D2C" },
  "mcdonalds": { domain: "mcdonalds.com.br", name: "McDonald's", color: "#FFBC0D" },
  "mc donalds": { domain: "mcdonalds.com.br", name: "McDonald's", color: "#FFBC0D" },
  "burger king": { domain: "burgerking.com.br", name: "Burger King", color: "#D62300" },
  "starbucks": { domain: "starbucks.com.br", name: "Starbucks", color: "#006241" },
  "rappi": { domain: "rappi.com.br", name: "Rappi", color: "#FF441F" },

  // E-commerce / Varejo
  "amazon": { domain: "amazon.com.br", name: "Amazon", color: "#FF9900" },
  "mercado livre": { domain: "mercadolivre.com.br", name: "Mercado Livre", color: "#FFE600" },
  "mercado pago": { domain: "mercadopago.com.br", name: "Mercado Pago", color: "#009EE3" },
  "shopee": { domain: "shopee.com.br", name: "Shopee", color: "#EE4D2D" },
  "magalu": { domain: "magazineluiza.com.br", name: "Magazine Luiza", color: "#0086FF" },
  "magazine luiza": { domain: "magazineluiza.com.br", name: "Magazine Luiza", color: "#0086FF" },
  "pao de acucar": { domain: "paodeacucar.com", name: "Pão de Açúcar", color: "#008542" },
  "carrefour": { domain: "carrefour.com.br", name: "Carrefour", color: "#004B9B" },

  // Bancos / Fintechs
  "nubank": { domain: "nubank.com.br", name: "Nubank", color: "#820AD1" },
  "inter": { domain: "inter.co", name: "Banco Inter", color: "#FF7A00" },
  "itau": { domain: "itau.com.br", name: "Itaú", color: "#EC7000" },
  "bradesco": { domain: "bradesco.com.br", name: "Bradesco", color: "#CC092F" },
  "santander": { domain: "santander.com.br", name: "Santander", color: "#EC0000" },
  "c6": { domain: "c6bank.com.br", name: "C6 Bank", color: "#242424" },
  "c6 bank": { domain: "c6bank.com.br", name: "C6 Bank", color: "#242424" },

  // Combustível
  "shell": { domain: "shell.com.br", name: "Shell", color: "#FFD500" },
  "ipiranga": { domain: "ipiranga.com.br", name: "Ipiranga", color: "#FFC700" },
};

/**
 * Normaliza uma string para comparação (sem acentos, minúsculas).
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
 */
export function detectBrand(title: string): BrandInfo | null {
  const normalized = normalizeText(title);

  // 1. Busca exata ou por início
  for (const [key, brand] of Object.entries(KNOWN_BRANDS)) {
    const normKey = normalizeText(key);
    // Verifica palavra inteira ou contenção direta
    const regex = new RegExp(`\\b${normKey}\\b`, "i");
    if (regex.test(normalized) || normalized.includes(normKey)) {
      return brand;
    }
  }

  return null;
}

/**
 * Retorna a URL do logo em alta resolução da empresa utilizando a Google Favicon V2 API.
 * 100% gratuita, sem limites e sem requisição de API key.
 */
export function getGoogleFaviconUrl(domain: string, size: number = 128): string {
  return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAV&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size}`;
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
