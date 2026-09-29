# RadarX V3

Primeira base funcional do caçador inteligente de promoções.

## O que já existe
- Interface responsiva e futurista
- Central visual de 6 agentes
- Orquestrador de busca
- Caçador por conectores
- Verificador de anúncios incorretos/incompletos
- Cálculo de desconto e PromoScore
- Estrutura de histórico de preços
- Alertas gravados no Supabase
- Conector Mercado Livre preparado para token
- Busca direta nos sites oficiais do Magazine Luiza, Amazon Brasil, KaBuM!, Casas Bahia e Shopee
- Modo demo somente para desenvolvimento local
- Integração de afiliado Awin para lojas com programa ativo e aprovado

## Agentes V1
1. Orquestrador
2. Caçador
3. Comparador (estrutura inicial no fluxo)
4. Histórico
5. Verificador
6. PromoScore

## Implantação no Supabase
1. Crie um projeto gratuito no Supabase.
2. Abra SQL Editor.
3. Cole e execute `supabase/schema.sql`.
4. Copie `Project URL` e a chave publicável.
5. O RadarX usa RLS para permitir somente a criação segura de alertas.

## Implantação no Netlify
1. Faça deploy desta pasta no Netlify.
2. Em Site configuration > Environment variables, crie:
   - SUPABASE_URL
   - SUPABASE_PUBLISHABLE_KEY
   - RADARX_DEMO=false
3. Para Mercado Livre real, crie também:
   - ML_ACCESS_TOKEN
4. Para ativar as comissões da Awin, depois da aprovação dos programas, crie:
   - AWIN_AFFILIATE_ID
   - AWIN_APPROVED_STORES (exemplo: `kabum`)
5. Faça um novo deploy.

Sem `AWIN_AFFILIATE_ID`, o RadarX mantém os links normais. Uma loja só recebe deep links da Awin quando também estiver listada em `AWIN_APPROVED_STORES`, evitando marcar como comissionado um programa pendente ou encerrado.

## Estado dos conectores
- Mercado Livre: código real pronto, depende do token da aplicação.
- Magazine Luiza: busca direta ativa. A API oficial disponível é voltada ao catálogo de sellers.
- Amazon: busca direta ativa. A busca automática de preço depende da API do Programa de Associados.
- KaBuM!, Casas Bahia e Shopee: busca direta ativa nos sites oficiais.

## Próxima etapa planejada
- Persistir cada captura em `offers` e `price_history`
- Normalização de produto por marca/modelo/GTIN
- Comparador do mesmo produto entre lojas
- Agente Histórico 7/30/90 dias
- Execuções agendadas
- Usuários e painel de alertas
- Frete por CEP quando a fonte oferecer
- Notificação automática
- Novos conectores

## Segurança
Nunca coloque chaves secretas ou `service_role` no `app.js`, HTML ou qualquer arquivo público.
