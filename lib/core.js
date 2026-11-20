const crypto=require('node:crypto');
const {neon}=require('@neondatabase/serverless');
const receiver='0x65b24321Bb13CE0E2ddBC4BC3F46a9DAE29B7850'.toLowerCase();
const tokens={
 'Base:USDC':{chain:8453,contract:'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',decimals:6,rpc:'RPC_BASE'},
 'Ethereum:USDC':{chain:1,contract:'0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',decimals:6,rpc:'RPC_ETHEREUM'},
 'Ethereum:USDT':{chain:1,contract:'0xdAC17F958D2ee523a2206206994597C13D831ec7',decimals:6,rpc:'RPC_ETHEREUM'},
 'Arbitrum:USDC':{chain:42161,contract:'0xaf88d065e77c8cC2239327C5EDb3A432268e5831',decimals:6,rpc:'RPC_ARBITRUM'},
 'Arbitrum:USDT':{chain:42161,contract:'0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',decimals:6,rpc:'RPC_ARBITRUM'},
 'Polygon:USDC':{chain:137,contract:'0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',decimals:6,rpc:'RPC_POLYGON'},
 'BNB Smart Chain:USDT':{chain:56,contract:'0x55d398326f99059ff775485246999027b3197955',decimals:18,rpc:'RPC_BSC'}
};
const topic='0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const addressTopic=a=>'0x'+a.toLowerCase().replace(/^0x/,'').padStart(64,'0');
function db(){if(!process.env.DATABASE_URL)throw Error('DATABASE_URL not configured');return neon(process.env.DATABASE_URL)}
function secret(){if(!process.env.ENTITLEMENT_SECRET||process.env.ENTITLEMENT_SECRET.length<32)throw Error('ENTITLEMENT_SECRET must contain at least 32 characters');return process.env.ENTITLEMENT_SECRET}
function sign(id){const p=Buffer.from(JSON.stringify({id,product:'meteor-v1'})).toString('base64url');return p+'.'+crypto.createHmac('sha256',secret()).update(p).digest('base64url')}
function decode(t){if(typeof t!=='string'||t.length>1500)return null;const [p,s]=t.split('.');if(!p||!s)return null;const expected=crypto.createHmac('sha256',secret()).update(p).digest('base64url');if(s.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected)))return null;try{const v=JSON.parse(Buffer.from(p,'base64url').toString());return v.product==='meteor-v1'&&typeof v.id==='string'?v.id:null}catch{return null}}
async function rpc(endpoint,method,params){if(!endpoint)throw Error('Network RPC not configured');const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('RPC HTTP '+r.status);const j=await r.json();if(j.error)throw Error('RPC '+j.error.message);return j.result}
async function check(order,hash){const cfg=tokens[order.network+':'+order.coin];if(!cfg)throw Error('Unsupported token');const endpoint=process.env[cfg.rpc];const chain=Number(BigInt(await rpc(endpoint,'eth_chainId',[])));if(chain!==cfg.chain)throw Error('RPC network mismatch');const receipt=await rpc(endpoint,'eth_getTransactionReceipt',[hash]);if(!receipt)return {ok:false,message:'Waiting for transaction to be mined'};if(receipt.status!=='0x1')throw Error('Transaction reverted');const block=Number(BigInt(receipt.blockNumber));if(block<Number(order.start_block))throw Error('Transaction occurred before order creation');const head=Number(BigInt(await rpc(endpoint,'eth_blockNumber',[])));if(head-block+1<3)return {ok:false,message:'Waiting for three confirmations'};const minimum=10n**BigInt(cfg.decimals);const matches=(receipt.logs||[]).some(l=>l.address?.toLowerCase()===cfg.contract.toLowerCase()&&l.topics?.length===3&&l.topics[0]?.toLowerCase()===topic&&l.topics[2]?.toLowerCase()===addressTopic(receiver)&&BigInt(l.data)>=minimum);if(!matches)throw Error('No qualifying $1 stablecoin transfer found');return {ok:true}}
function respond(res,status,data){res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');return res.status(status).json(data)}
function post(req,res){if(req.method!=='POST'){res.setHeader('Allow','POST');respond(res,405,{error:'POST required'});return false}return true}
function fail(res,e){console.error('Payment API:',e);return respond(res,400,{error:e.message||'Request failed'})}
module.exports={crypto,db,secret,sign,decode,check,rpc,respond,post,fail,receiver,tokens};
