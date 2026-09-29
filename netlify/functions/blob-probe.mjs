import {getStore} from '@netlify/blobs';

export default async ()=>{
  try{
    const store=getStore({name:'mercadolivre-oauth',consistency:'strong'});
    const probe={ok:true,created_at:new Date().toISOString()};
    await store.setJSON('connection-probe',probe);
    const saved=await store.get('connection-probe',{type:'json',consistency:'strong'});
    return Response.json({ok:Boolean(saved?.ok)},{headers:{'cache-control':'no-store'}});
  }catch(error){
    console.error('blob-probe:',error?.message||String(error));
    return Response.json(
      {ok:false,error:error?.message||'Falha desconhecida'},
      {status:500,headers:{'cache-control':'no-store'}}
    );
  }
};
