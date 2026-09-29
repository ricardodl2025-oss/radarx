const {getStore}=require('@netlify/blobs');

let tokenCache={value:null,expiresAt:0};

function tokenStore(){
  return getStore({name:'mercadolivre-oauth',consistency:'strong'});
}

async function readStoredToken(){
  try{
    return await tokenStore().get('tokens',{type:'json'});
  }catch{
    return null;
  }
}

async function saveStoredToken(data,previous={}){
  const lifetime=Math.max(60,Number(data.expires_in)||21600);
  const record={
    access_token:data.access_token,
    refresh_token:data.refresh_token||previous.refresh_token||null,
    token_type:data.token_type||'Bearer',
    user_id:data.user_id||previous.user_id||null,
    expires_at:Date.now()+lifetime*1000
  };
  await tokenStore().set('tokens',JSON.stringify(record));
  tokenCache={value:record.access_token,expiresAt:record.expires_at-60000};
  return record.access_token;
}

async function refreshUserToken(stored){
  const body=new URLSearchParams({
    grant_type:'refresh_token',
    client_id:process.env.ML_CLIENT_ID,
    client_secret:process.env.ML_CLIENT_SECRET,
    refresh_token:stored.refresh_token
  });
  const response=await fetch('https://api.mercadolibre.com/oauth/token',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body
  });
  if(!response.ok) throw new Error('A autorização do Mercado Livre expirou. Autorize novamente.');
  const data=await response.json();
  if(!data.access_token) throw new Error('Mercado Livre não renovou o acesso.');
  return saveStoredToken(data,stored);
}

async function mercadoLivreToken(){
  if(process.env.ML_ACCESS_TOKEN) return process.env.ML_ACCESS_TOKEN;
  if(tokenCache.value && Date.now()<tokenCache.expiresAt) return tokenCache.value;

  const stored=await readStoredToken();
  if(stored?.access_token && Date.now()<Number(stored.expires_at||0)-60000){
    tokenCache={value:stored.access_token,expiresAt:Number(stored.expires_at)-60000};
    return stored.access_token;
  }
  if(stored?.refresh_token) return refreshUserToken(stored);

  throw new Error('Conta Mercado Livre ainda não autorizada');
}

async function mercadoLivreSearch(q){
  const token=await mercadoLivreToken();
  const url='https://api.mercadolibre.com/sites/MLB/search?q='+encodeURIComponent(q)+'&limit=30';
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
  if(response.status===401) throw new Error('A autorização do Mercado Livre expirou. Autorize novamente.');
  if(response.status===403) throw new Error('Mercado Livre recusou a busca. Autorize novamente.');
  if(!response.ok) throw new Error('Mercado Livre respondeu '+response.status);

  const data=await response.json();
  return (data.results||[]).map(item=>({
    id:item.id,
    title:item.title,
    price:Number(item.price),
    original_price:item.original_price?Number(item.original_price):null,
    store:'Mercado Livre',
    official_store:Boolean(item.official_store_id),
    shipping_free:Boolean(item.shipping?.free_shipping),
    condition:item.condition,
    url:item.permalink,
    seller_id:item.seller?.id||item.seller_id||null,
    source:'mercadolivre'
  }));
}

module.exports={mercadoLivreSearch};
