function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function promoScore(item){
  let s=45;
  if(item.condition==='new') s+=8;
  if(item.official_store) s+=12;
  if(item.shipping_free) s+=5;
  if(item.discount>=10) s+=8;
  if(item.discount>=20) s+=8;
  if(item.discount>=30) s+=5;
  if(item.history_drop>=10) s+=7;
  if(item.suspicious) s-=35;
  return clamp(Math.round(s),0,100);
}
module.exports={promoScore};
