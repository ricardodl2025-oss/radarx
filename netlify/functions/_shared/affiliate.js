const AWIN_ADVERTISERS={
  kabum:'17729'
};

// Loja existente confirmada no painel do Influenciador Magalu.
const MAGALU_STORE_BASE='https://www.magazinevoce.com.br/magazineprimoportado/';

function magaluSearchLink(query){
  if(typeof query!=='string' || !query.trim()) return null;
  const encoded=encodeURIComponent(query.trim()).replace(/%20/g,'+');
  return `${MAGALU_STORE_BASE}busca/${encoded}/`;
}

function cleanPublisherId(){
  const value=String(process.env.AWIN_AFFILIATE_ID||'').trim();
  return /^\d+$/.test(value)?value:null;
}

function approvedStores(){
  const configured=String(process.env.AWIN_APPROVED_STORES||'')
    .split(',')
    .map(store=>store.trim().toLowerCase())
    .filter(Boolean);
  return configured.filter(store=>AWIN_ADVERTISERS[store]);
}

function awinLink(storeKey,destination,clickref='radarx'){
  const publisherId=cleanPublisherId();
  const advertiserId=AWIN_ADVERTISERS[storeKey];
  if(!publisherId || !advertiserId || !approvedStores().includes(storeKey) || !destination) return null;
  try{
    const target=new URL(destination);
    if(target.protocol!=='https:') return null;
    if(storeKey==='kabum' && target.hostname!=='kabum.com.br' && !target.hostname.endsWith('.kabum.com.br')) return null;
    const link=new URL('https://www.awin1.com/cread.php');
    link.searchParams.set('awinmid',advertiserId);
    link.searchParams.set('awinaffid',publisherId);
    link.searchParams.set('clickref',clickref);
    link.searchParams.set('ued',target.href);
    return link.href;
  }catch{
    return null;
  }
}

function monetizeOffer(item){
  const affiliate_url=awinLink(item.source,item.url,`oferta-${item.source}`);
  return affiliate_url?{...item,affiliate_url,affiliate:true}:{...item,affiliate:false};
}

function monetizeSearch(store){
  if(store.key==='magalu'){
    const url=magaluSearchLink(store.query);
    if(url) return {...store,url,affiliate:true,network:'Influenciador Magalu'};
  }
  const affiliate_url=awinLink(store.key,store.url,`busca-${store.key}`);
  return affiliate_url?{...store,url:affiliate_url,affiliate:true}:{...store,affiliate:false};
}

function affiliateStatus(){
  const publisherId=cleanPublisherId();
  const awinStores=publisherId?approvedStores():[];
  const stores=['magalu',...awinStores];
  return {
    active:true,
    network:awinStores.length?'Influenciador Magalu / Awin':'Influenciador Magalu',
    stores,
    magalu_store_url:MAGALU_STORE_BASE,
    magalu_mode:'store_search',
    pending:publisherId?String(process.env.AWIN_PENDING_STORES||'').split(',').map(store=>store.trim().toLowerCase()).filter(store=>AWIN_ADVERTISERS[store] && !stores.includes(store)):[]
  };
}

module.exports={monetizeOffer,monetizeSearch,affiliateStatus};
