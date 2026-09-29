let tokenCache={value:null,expiresAt:0};

async function mercadoLivreToken(){
  if(process.env.ML_ACCESS_TOKEN) return process.env.ML_ACCESS_TOKEN;

  const clientId=process.env.ML_CLIENT_ID;
  const clientSecret=process.env.ML_CLIENT_SECRET;
  if(!clientId || !clientSecret) return null;

  if(tokenCache.value && Date.now()<tokenCache.expiresAt) return tokenCache.value;

  const body=new URLSearchParams({
    grant_type:'client_credentials',
    client_id:clientId,
    client_secret:clientSecret
  });

  const response=await fetch('https://api.mercadolibre.com/oauth/token',{
    method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body
  });

  if(!response.ok) throw new Error('Falha ao autenticar no Mercado Livre ('+response.status+')');

  const data=await response.json();
  if(!data.access_token) throw new Error('Mercado Livre não retornou um token de acesso');

  const lifetime=Math.max(60,Number(data.expires_in)||300);
  tokenCache={
    value:data.access_token,
    expiresAt:Date.now()+Math.max(30,lifetime-60)*1000
  };
  return tokenCache.value;
}

async function mercadoLivreSearch(q){
  const token=await mercadoLivreToken();
  if(!token) return [];

  const url='https://api.mercadolibre.com/sites/MLB/search?q='+encodeURIComponent(q)+'&limit=30';
  const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
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
