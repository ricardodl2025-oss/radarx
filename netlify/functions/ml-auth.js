const crypto=require('crypto');

function base64url(buffer){
  return buffer.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

exports.handler=async()=>{
  const clientId=process.env.ML_CLIENT_ID;
  const redirectUri=process.env.ML_REDIRECT_URI;
  if(!clientId || !redirectUri){
    return {statusCode:500,body:'Configuração do Mercado Livre incompleta.'};
  }

  const state=crypto.randomBytes(24).toString('hex');
  const verifier=base64url(crypto.randomBytes(48));
  const challenge=base64url(crypto.createHash('sha256').update(verifier).digest());
  const authorization=new URL('https://auth.mercadolivre.com.br/authorization');
  authorization.searchParams.set('response_type','code');
  authorization.searchParams.set('client_id',clientId);
  authorization.searchParams.set('redirect_uri',redirectUri);
  authorization.searchParams.set('state',state);
  authorization.searchParams.set('code_challenge',challenge);
  authorization.searchParams.set('code_challenge_method','S256');

  return {
    statusCode:302,
    headers:{
      location:authorization.toString(),
      'set-cookie':`ml_oauth_ctx=${state}.${verifier}; Path=/.netlify/functions/ml-callback; Max-Age=600; HttpOnly; Secure; SameSite=Lax`,
      'cache-control':'no-store'
    },
    body:''
  };
};
