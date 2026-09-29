import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const {orchestrate}=require('./_shared/orchestrator');

export default async request=>{
  const start=Date.now();
  const url=new URL(request.url);
  const q=(url.searchParams.get('q')||'').trim();

  if(q.length<2){
    return Response.json(
      {error:'Digite o produto que deseja procurar.'},
      {status:400,headers:{'cache-control':'no-store'}}
    );
  }

  try{
    const data=await orchestrate(q);
    return Response.json(
      {...data,elapsed_ms:Date.now()-start},
      {headers:{'cache-control':'no-store'}}
    );
  }catch(error){
    return Response.json(
      {error:error?.message||'Falha na busca'},
      {status:500,headers:{'cache-control':'no-store'}}
    );
  }
};
