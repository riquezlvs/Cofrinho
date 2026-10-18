# Documentação de Escopo: Projeto Cofrinho

## Visão Geral
Aplicativo financeiro (PWA mobile-first para iOS) projetado para substituir planilhas. O sistema atua como um dashboard centralizado, com arquitetura otimizada para lidar de forma inteligente com o fluxo de compras a prazo (cartão de crédito), pagamentos instantâneos (Pix, Débito), recebimentos variáveis, rateios com terceiros e categorização avançada de eventos e benefícios.

## Stack Tecnológica
* **Frontend & Lógica:** Next.js (App Router com Server Actions para o backend)
* **Interface:** Tailwind CSS (UI responsiva e nativa para mobile)
* **Banco de Dados & Autenticação:** Supabase (PostgreSQL + Row Level Security)
* **Hospedagem:** Vercel

---

## 1. Motor Financeiro e de Pagamentos (Core)
* **Múltiplos Métodos de Pagamento:** Suporte nativo para pagamentos instantâneos (Pix, Cartão de Débito, Dinheiro). Gastos à vista descontam o saldo imediatamente, coexistindo de forma fluida com a gestão de limite de crédito.
* **Cálculo "Safe to Spend" (Saldo Livre):** O dashboard principal consolida todas as frentes para fornecer o poder de compra real através da fórmula: `(Rendas Fixas + Rendas Variáveis) - (Fatura Atual Acumulada de Todos os Cartões) - (Gastos Fixos) - (Gastos à vista) = Valor Livre`.

## 2. Gestão Híbrida de Cartões de Crédito
* **Separação Estrutural (Banco de Dados):** O sistema cadastra cada cartão individualmente para respeitar os dias de virada e de vencimento específicos de cada instituição, facilitando a conciliação exata.
* **Agrupamento Visual (Dashboard):** Soma de todas as dívidas de crédito ativas exibidas em uma única "Fatura Total Acumulada", refletindo o impacto consolidado no orçamento.
* **Projeção de Faturas (Bola de Neve):** Lançamento de compras parceladas preenche automaticamente a previsão das faturas dos meses subsequentes.
* **Área de Pagamento de Faturas:** Aba isolada para visualizar cada cartão e dar "baixa" no sistema ao realizar o pagamento do boleto.

## 3. Gestão Isolada de Benefícios (VR / VA)
* **Contas de Débito Isoladas:** Saldos de benefícios de alimentação e refeição operam em silos, garantindo que o VR não se misture com a conta corrente bancária.
* **Widget de Sobrevivência:** Monitoramento visual na tela inicial exibindo o saldo restante em paralelo com a quantidade de dias úteis restantes no mês.

## 4. Gestão de Entradas e Receitas Múltiplas
* **Categorização de Recebimentos:** Rastreio de fontes de entrada, diferenciando rendas fixas (salário/estágio) de rendas variáveis (projetos freelance, contribuições familiares, ganhos pontuais).
* **Injeção Dinâmica de Caixa:** Registros de entradas extras inesperadas recalculam e aumentam imediatamente o "Safe to Spend" do mês.
* **Receitas Previstas (Contas a Receber):** Capacidade de projetar dinheiro que entrará no futuro para calcular a viabilidade de pagamento das faturas.

## 5. Finanças Sociais e Rateios (Rachadinhas)
* **Isolamento de Orçamento:** O valor devido por terceiros não entra nos gráficos de despesa pessoal. Em uma conta de R$ 100 dividida, apenas a sua parte (R$ 50) afeta a categoria correspondente.
* **Acerto de Contas Neutro:** O recebimento da parte de um amigo via Pix entra apenas como "baixa de dívida" e não como "Receita", evitando inflar os gráficos de ganhos reais.
* **Saldo Líquido por Pessoa:** Painel de consolidação que calcula o balanço final entre dívidas cruzadas, mostrando de forma simples o saldo final de quem deve quem.

## 6. Categorização e Agrupamentos Avançados
* **Sistema de Tags (Micro-Categorização):** Utilização de hashtags opcionais e flexíveis (ex: `#burger-king`, `#ifood`) para detalhar subcategorias sem burocratizar o esquema do banco de dados.
* **Modo Viagem / Eventos:** Agrupamento temporário de transações de múltiplas categorias (transporte, alimentação, hospedagem) sob um evento específico. Permite apurar o custo total de uma viagem e isola esses gastos atípicos para não distorcer a média de custo de vida mensal.

## 7. Experiência de Uso e Funcionalidades (QoL)
* **Fast Input (2 Cliques):** Tela principal com teclado numérico em destaque. O fluxo assume o "Cartão de Crédito Principal" como padrão, apresentando botões de acesso rápido para alternar para "Pix", "Débito" ou "VR" com um único toque.
* **Leitura Inteligente com IA:** Integração nativa com APIs de visão computacional para ler prints de comprovantes ou notas fiscais, preenchendo valor, data e estabelecimento automaticamente.
* **SaaS & Custos Fixos:** Área de monitoramento contínuo para visualizar o peso e o comprometimento do orçamento com assinaturas recorrentes.
* **Metas Visuais ("Cofrinhos"):** Sistema de alocação de saldo virtual com barras de progresso para objetivos específicos de compra de médio a longo prazo.

## 8. Alertas Nativos Inteligentes (Push Notifications do PWA)
* **Notificações Integradas ao iOS:** Utilização da API de Web Push para enviar alertas diretos à tela de bloqueio do iPhone, equiparando a experiência do PWA a um aplicativo nativo.
* **Lembretes Operacionais:** Disparos automatizados do servidor para eventos críticos, como fechamento de faturas ("Sua fatura do Nubank fechou hoje"), cobranças iminentes de assinaturas mensais, ou alertas de pendências ativas com amigos.

## 9. Fechamento Mensal Gamificado (O "Wrapped" Financeiro)
* **Review Automatizado de Ciclo:** Substituição temporária do dashboard principal no dia 1º de cada mês por uma tela de consolidação e insights rápidos.
* **Métricas de Engajamento:** Exibição de comparativos de economia em relação ao mês anterior, destaques dos maiores "vilões" do orçamento baseados no sistema de tags, e celebração visual do avanço nas metas de economia ("Cofrinhos").
* **Transição Limpa:** Encerramento do review via ação do usuário para reiniciar e limpar a visualização do dashboard para o novo ciclo mensal.