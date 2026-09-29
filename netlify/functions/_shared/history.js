async function historyEnrich(items){
  // V1: ponto de extensão. Na V2 consulta price_history no Supabase
  // e calcula queda contra média de 7/30/90 dias.
  return items.map(x=>({...x,history_drop:x.history_drop||0}));
}
module.exports={historyEnrich};
