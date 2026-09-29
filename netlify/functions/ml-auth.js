const crypto=require('crypto');

exports.handler=async()=>{
  const clientId=process.env.ML_CLIENT_ID;
  const redirectUri=process.env.ML_REDIRECT_URI;
  if(!clientId || !redirectUri){
    return {statusCode:500,body:'Configuração do Mercado Livre incompleta.'};
  }

  const state=crypto.randomBytes(24).toString('hex');
  const authorization=new URL('https://auth.mercadolivre.com.br/authorization');
  authorization.searchParams.set('response_type','code');
  authorization.searchParams.set('client_id',clientId);
  authorization.searchParams.set('redirect_uri',redirectUri);
  authorization.searchParams.set('state',state);

  return {
    statusCode:302,
    headers:{
      location:authorization.toString(),
      'set-cookie':`ml_oauth_state=${state}; Path=/.netlify/functions/ml-callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      'cache-control':'no-store'
    },
    body:''
  };
};
