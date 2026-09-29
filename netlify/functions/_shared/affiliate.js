const AWIN_ADVERTISERS={
  casasbahia:'17629',
  kabum:'17729'
};

function cleanPublisherId(){
  const value=String(process.env.AWIN_AFFILIATE_ID||'').trim();
  return /^\d+$/.test(value)?value:null;
}

function awinLink(storeKey,destination,clickref='radarx'){
  const publisherId=cleanPublisherId();
  const advertiserId=AWIN_ADVERTISERS[storeKey];
  if(!publisherId || !advertiserId || !destination) return null;
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
  return {
    active:Boolean(cleanPublisherId()),
    network:'Awin',
    stores:Object.keys(AWIN_ADVERTISERS)
  };
}

module.exports={monetizeOffer,monetizeSearch,affiliateStatus};
