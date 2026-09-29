const AWIN_ADVERTISERS={
  kabum:'17729'
};

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
  const affiliate_url=awinLink(store.key,store.url,`busca-${store.key}`);
  return affiliate_url?{...store,url:affiliate_url,affiliate:true}:{...store,affiliate:false};
}

function affiliateStatus(){
  const publisherId=cleanPublisherId();
  const stores=approvedStores();
  return {
    active:Boolean(publisherId && stores.length),
    network:'Awin',
    stores,
    pending:publisherId?Object.keys(AWIN_ADVERTISERS).filter(store=>!stores.includes(store)):[]
  };
}

module.exports={monetizeOffer,monetizeSearch,affiliateStatus};
