async function supabaseInsert(table,payload){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!key) throw new Error('Supabase ainda não configurado');
  const r=await fetch(`${url}/rest/v1/${table}`,{
    method:'POST',
    headers:{apikey:key,Authorization:`Bearer ${key}`,'content-type':'application/json',Prefer:'return=representation'},
    body:JSON.stringify(payload)
  });
  const data=await r.json().catch(()=>null);
  if(!r.ok) throw new Error(data?.message||'Erro no Supabase');
  return data;
}
exports.handler=async(event)=>{
  if(event.httpMethod!=='POST') return {statusCode:405,body:JSON.stringify({error:'Método não permitido'})};
  try{
    const b=JSON.parse(event.body||'{}');
    if(!b.query||!b.email||!b.target_price) return {statusCode:400,body:JSON.stringify({error:'Produto, preço e e-mail são obrigatórios'})};
    const data=await supabaseInsert('alerts',{query:b.query,email:b.email,target_price:Number(b.target_price),active:true});
    return {statusCode:200,body:JSON.stringify({ok:true,data})};
  }catch(e){ return {statusCode:500,body:JSON.stringify({error:e.message})};}
};
