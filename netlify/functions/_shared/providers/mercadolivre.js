async function mercadoLivreSearch(q){
  const token=process.env.ML_ACCESS_TOKEN;
  if(!token) return [];
  const url='https://api.mercadolibre.com/sites/MLB/search?q='+encodeURIComponent(q)+'&limit=30';
  const r=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});
  if(!r.ok) throw new Error('Mercado Livre respondeu '+r.status);
  const data=await r.json();
  return (data.results||[]).map(x=>({
    id:x.id,
    title:x.title,
    price:Number(x.price),
    original_price:x.original_price?Number(x.original_price):null,
    store:'Mercado Livre',
    official_store:Boolean(x.official_store_id),
    shipping_free:Boolean(x.shipping?.free_shipping),
    condition:x.condition,
    url:x.permalink,
    seller_id:x.seller?.id||x.seller_id||null,
    source:'mercadolivre'
  }));
}
module.exports={mercadoLivreSearch};
