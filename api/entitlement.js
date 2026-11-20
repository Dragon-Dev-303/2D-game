const {db,decode,respond,post,fail}=require('../lib/core');
module.exports=async(req,res)=>{if(!post(req,res))return;try{const id=decode(req.body?.token);if(!id)return respond(res,200,{unlocked:false});const sql=db();const rows=await sql`SELECT paid FROM orders WHERE id=${id}`;return respond(res,200,{unlocked:rows[0]?.paid===true})}catch(e){return fail(res,e)}};
