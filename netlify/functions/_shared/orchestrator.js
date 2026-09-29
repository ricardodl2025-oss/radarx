const {promoScore}=require('./scoring');
const {verify}=require('./verifier');
const {historyEnrich}=require('./history');
const {demoSearch}=require('./providers/demo');
const {mercadoLivreSearch}=require('./providers/mercadolivre');

function discount(price,original){
  if(!original || original<=price) return 0;
  return Math.round((1-price/original)*100);
}

async function orchestrate(query){
  const jobs=[mercadoLivreSearch(query)];
  if(process.env.RADARX_DEMO==='true') jobs.push(demoSearch(query));
  const settled=await Promise.allSettled(jobs);
  const raw=settled.flatMap(x=>x.status==='fulfilled'?x.value:[]);
  const verified=raw.map(x=>verify({...x,discount:discount(x.price,x.original_price)},query)).filter(x=>!x.suspicious);
  const enriched=await historyEnrich(verified);
  const items=enriched.map(x=>({...x,score:promoScore(x)})).sort((a,b)=>b.score-a.score||a.price-b.price);
  return {items,providers_ok:settled.filter(x=>x.status==='fulfilled').length};
}
module.exports={orchestrate};
