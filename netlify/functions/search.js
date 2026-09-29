const {orchestrate}=require('./_shared/orchestrator');
exports.handler=async(event)=>{
  const start=Date.now();
  const q=(event.queryStringParameters?.q||'').trim();
  if(q.length<2) return {statusCode:400,body:JSON.stringify({error:'Digite o produto que deseja procurar.'})};
  try{
    const data=await orchestrate(q);
    return {statusCode:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:JSON.stringify({...data,elapsed_ms:Date.now()-start})};
  }catch(e){
    return {statusCode:500,body:JSON.stringify({error:e.message||'Falha na busca'})};
  }
};
