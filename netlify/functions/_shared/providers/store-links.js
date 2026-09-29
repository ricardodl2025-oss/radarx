function slug(q){
  return q.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

function storeSearches(q){
  const encoded=encodeURIComponent(q.trim());
  const path=slug(q);
  return [
    {key:'mercadolivre',name:'Mercado Livre',url:`https://lista.mercadolivre.com.br/${path}`,mode:'Busca direta'},
    {key:'magalu',name:'Magazine Luiza',url:`https://www.magazineluiza.com.br/busca/${path}/`,mode:'Busca direta'},
    {key:'amazon',name:'Amazon Brasil',url:`https://www.amazon.com.br/s?k=${encoded}`,mode:'Busca direta'},
    {key:'kabum',name:'KaBuM!',url:`https://www.kabum.com.br/busca/${path}`,mode:'Busca direta'},
    {key:'casasbahia',name:'Casas Bahia',url:`https://www.casasbahia.com.br/${path}/b`,mode:'Busca direta'},
    {key:'shopee',name:'Shopee',url:`https://shopee.com.br/search?keyword=${encoded}`,mode:'Busca direta'}
  ];
}

module.exports={storeSearches};
