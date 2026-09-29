# RadarX V1

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
- Modo demo para testar a interface sem nenhuma credencial

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
   - RADARX_DEMO=true
3. Para Mercado Livre real, crie também:
   - ML_ACCESS_TOKEN
4. Faça um novo deploy.

## Estado dos conectores
- Mercado Livre: código real pronto, depende do token da aplicação.
- Magazine Luiza: ainda não ativado. Será conectado por meio oficial/parceria disponível.
- Amazon: ainda não ativado. Será conectado por API/programa autorizado.
- Outras lojas: entram depois pelo mesmo padrão de provider.

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
