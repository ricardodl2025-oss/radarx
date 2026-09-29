const {getStore}=require('@netlify/blobs');

function cookieValue(header,name){
  const cookies=String(header||'').split(';');
  for(const cookie of cookies){
    const [key,...parts]=cookie.trim().split('=');
    if(key===name) return parts.join('=');
  }
  return null;
}

function html(statusCode,title,message){
  return {
    statusCode,
    headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'},
    body:`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>${title}</title><body style="font-family:system-ui;background:#070a11;color:#eef4ff;padding:40px"><h1>${title}</h1><p>${message}</p><p><a style="color:#63f3ff" href="/">Voltar ao RadarX</a></p></body></html>`
  };
}

exports.handler=async(event)=>{
  const query=event.queryStringParameters||{};
  if(query.error) return html(400,'Autorização cancelada','O Mercado Livre não autorizou a conexão.');

  const context=cookieValue(event.headers?.cookie,'ml_oauth_ctx')||'';
  const separator=context.indexOf('.');
  const expected=separator>0?context.slice(0,separator):'';
  const verifier=separator>0?context.slice(separator+1):'';
  if(!query.code || !query.state || !expected || !verifier || query.state!==expected){
    return html(400,'Autorização inválida','O código de segurança expirou. Inicie a conexão novamente pelo RadarX.');
  }

  const clientId=process.env.ML_CLIENT_ID;
  const clientSecret=process.env.ML_CLIENT_SECRET;
  const redirectUri=process.env.ML_REDIRECT_URI;
  if(!clientId || !clientSecret || !redirectUri){
    return html(500,'Configuração incompleta','As credenciais do servidor não foram encontradas.');
  }

  const body=new URLSearchParams({
    grant_type:'authorization_code',
    client_id:clientId,
    client_secret:clientSecret,
    code:query.code,
    redirect_uri:redirectUri,
    code_verifier:verifier
  });

  try{
    const response=await fetch('https://api.mercadolibre.com/oauth/token',{
      method:'POST',
      headers:{'content-type':'application/x-www-form-urlencoded'},
      body
    });
    if(!response.ok) return html(502,'Falha na autorização','O Mercado Livre recusou a troca do código ('+response.status+').');

    const data=await response.json();
    if(!data.access_token) return html(502,'Falha na autorização','O Mercado Livre não retornou o acesso esperado.');

    const lifetime=Math.max(60,Number(data.expires_in)||21600);
    const record={
      access_token:data.access_token,
      refresh_token:data.refresh_token||null,
      token_type:data.token_type||'Bearer',
      user_id:data.user_id||null,
      expires_at:Date.now()+lifetime*1000
    };
    const store=getStore({name:'mercadolivre-oauth',consistency:'strong'});
    await store.set('tokens',JSON.stringify(record));

    return {
      statusCode:302,
      headers:{
        location:'/?ml=connected',
        'set-cookie':'ml_oauth_ctx=; Path=/.netlify/functions/ml-callback; Max-Age=0; HttpOnly; Secure; SameSite=Lax',
        'cache-control':'no-store'
      },
      body:''
    };
  }catch{
    return html(500,'Falha na conexão','Não foi possível guardar a autorização com segurança.');
  }
};
