const {getStore}=require('@netlify/blobs');

exports.handler=async()=>{
  try{
    const store=getStore({name:'mercadolivre-oauth',consistency:'strong'});
    const probe={ok:true,created_at:new Date().toISOString()};
    await store.setJSON('connection-probe',probe);
    const saved=await store.get('connection-probe',{type:'json',consistency:'strong'});
    return {
      statusCode:200,
      headers:{'content-type':'application/json','cache-control':'no-store'},
      body:JSON.stringify({ok:Boolean(saved?.ok)})
    };
  }catch(error){
    console.error('blob-probe:',error?.message||String(error));
    return {
      statusCode:500,
      headers:{'content-type':'application/json','cache-control':'no-store'},
      body:JSON.stringify({ok:false,error:error?.message||'Falha desconhecida'})
    };
  }
};
