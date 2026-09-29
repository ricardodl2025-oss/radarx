const USER_AGENT='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154.0.0.0 Safari/537.36';

function normalize(value){
  return String(value||'')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase();
}

function slug(value){
  return normalize(value)
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'');
}

function relevant(title,query){
  const name=normalize(title);
  const tokens=normalize(query).match(/[a-z0-9]+/g)?.filter(token=>token.length>1)||[];
  if(!tokens.length) return true;
  return tokens.every(token=>name.includes(token));
}

async function fetchHtml(url){
  const response=await fetch(url,{
    headers:{
      'user-agent':USER_AGENT,
      'accept':'text/html,application/xhtml+xml',
      'accept-language':'pt-BR,pt;q=0.9'
    },
    signal:AbortSignal.timeout(25000)
  });
  if(!response.ok) throw new Error('Loja respondeu '+response.status);
  return response.text();
}

function jsonLdProducts(html){
  const products=[];
  const scripts=html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for(const match of scripts){
    try{
      const parsed=JSON.parse(match[1]);
      const entries=Array.isArray(parsed)?parsed:(parsed?.['@graph']||[parsed]);
      for(const entry of entries){
        if(entry?.['@type']==='Product' && entry?.offers) products.push(entry);
      }
    }catch{}
  }
  return products;
}

function mapProduct(product,store,source){
  const offer=Array.isArray(product.offers)?product.offers[0]:product.offers;
  const price=Number(offer?.price||offer?.lowPrice);
  const url=offer?.url||product.url;
  if(!product.name || !Number.isFinite(price) || price<=0 || !url) return null;
  return {
    id:`${source}-${product.sku||slug(product.name)}`,
    title:product.name,
    price,
    original_price:null,
    image:Array.isArray(product.image)?product.image[0]:product.image||null,
    store,
    official_store:true,
    shipping_free:false,
    condition:'new',
    url,
    seller_id:null,
    source
  };
}

function unique(items){
  const seen=new Set();
  return items.filter(item=>{
    const key=item.url;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchRetailer({query,url,store,source,limit=20}){
  const html=await fetchHtml(url);
  return unique(
    jsonLdProducts(html)
      .filter(product=>relevant(product.name,query))
      .map(product=>mapProduct(product,store,source))
      .filter(Boolean)
  ).slice(0,limit);
}

function magaluSearch(query){
  return searchRetailer({
    query,
    url:`https://www.magazineluiza.com.br/busca/${slug(query)}/`,
    store:'Magazine Luiza',
    source:'magalu',
    limit:24
  });
}

function kabumSearch(query){
  return searchRetailer({
    query,
    url:`https://www.kabum.com.br/busca/${slug(query)}`,
    store:'KaBuM!',
    source:'kabum',
    limit:16
  });
}

module.exports={magaluSearch,kabumSearch};
