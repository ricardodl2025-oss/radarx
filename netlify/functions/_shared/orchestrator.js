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
  const providers=[
    {key:'mercadolivre',name:'Mercado Livre',live:Boolean(process.env.ML_ACCESS_TOKEN),run:()=>mercadoLivreSearch(query)}
  ];
  if(process.env.RADARX_DEMO==='true') providers.push({key:'demo',name:'Demonstração',live:false,run:()=>demoSearch(query)});
  const settled=await Promise.allSettled(providers.map(x=>x.run()));
  const raw=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
  const verified=raw.map(x=>verify({...x,discount:discount(x.price,x.original_price)},query)).filter(x=>!x.suspicious);
  const enriched=await historyEnrich(verified);
  const items=enriched.map(x=>({...x,score:promoScore(x)})).sort((a,b)=>b.score-a.score||a.price-b.price);
  const provider_status=providers.map((provider,index)=>({
    key:provider.key,
    name:provider.name,
    status:settled[index].status==='rejected'?'error':provider.live?'connected':'pending',
    count:settled[index].status==='fulfilled'?settled[index].value.length:0
  }));
  return {
    items,
    direct_searches:storeSearches(query),
    provider_status,
    providers_ok:provider_status.filter(x=>x.status==='connected').length
  };
}
module.exports={orchestrate};
