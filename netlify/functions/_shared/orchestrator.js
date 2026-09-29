const {promoScore}=require('./scoring');
const {verify}=require('./verifier');
const {historyEnrich}=require('./history');
const {demoSearch}=require('./providers/demo');
const {mercadoLivreSearch}=require('./providers/mercadolivre');
const {storeSearches}=require('./providers/store-links');

function discount(price,original){
  if(!original || original<=price) return 0;
  return Math.round((1-price/original)*100);
}

async function orchestrate(query){
  const mercadoLivreConfigured=Boolean(
    process.env.ML_ACCESS_TOKEN ||
    (process.env.ML_CLIENT_ID && process.env.ML_CLIENT_SECRET)
  );

  const providers=[
    {key:'mercadolivre',name:'Mercado Livre',live:mercadoLivreConfigured,run:()=>mercadoLivreSearch(query)}
  ];

  if(process.env.RADARX_DEMO==='true'){
    providers.push({key:'demo',name:'Demonstração',live:false,run:()=>demoSearch(query)});
  }

  const settled=await Promise.allSettled(providers.map(provider=>provider.run()));
  const raw=settled.flatMap(result=>result.status==='fulfilled'?result.value:[]);
  const verified=raw
    .map(item=>verify({...item,discount:discount(item.price,item.original_price)},query))
    .filter(item=>!item.suspicious);
  const enriched=await historyEnrich(verified);
  const items=enriched
    .map(item=>({...item,score:promoScore(item)}))
    .sort((a,b)=>b.score-a.score||a.price-b.price);

  const provider_status=providers.map((provider,index)=>({
    key:provider.key,
    name:provider.name,
    status:settled[index].status==='rejected'?'error':provider.live?'connected':'pending',
    count:settled[index].status==='fulfilled'?settled[index].value.length:0,
    error:settled[index].status==='rejected'
      ? String(settled[index].reason?.message||'Falha no conector')
      : undefined
  }));

  return {
    items,
    direct_searches:storeSearches(query),
    provider_status,
    providers_ok:provider_status.filter(item=>item.status==='connected').length
  };
}

module.exports={orchestrate};
