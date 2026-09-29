async function supabaseInsert(table,payload){
  const url=process.env.SUPABASE_URL;
  const key=process.env.SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key) throw new Error('Supabase ainda não configurado');
  const r=await fetch(`${url}/rest/v1/${table}`,{
    method:'POST',
    headers:{apikey:key,Authorization:`Bearer ${key}`,'content-type':'application/json',Prefer:'return=minimal'},
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
    const query=String(b.query||'').trim();
    const email=String(b.email||'').trim().toLowerCase();
    const targetPrice=Number(b.target_price);
    if(query.length<2||query.length>200||email.length<5||email.length>254||!/^\S+@\S+\.\S+$/.test(email)||!Number.isFinite(targetPrice)||targetPrice<=0||targetPrice>100000000){
      return {statusCode:400,body:JSON.stringify({error:'Confira o produto, o preço e o e-mail'})};
    }
    const data=await supabaseInsert('alerts',{query,email,target_price:targetPrice,active:true});
    return {statusCode:200,body:JSON.stringify({ok:true})};
  }catch(e){ return {statusCode:500,body:JSON.stringify({error:e.message})};}
};
