const Content = require('../model/contents');

const updateContent = async(req,res,next)=>{
    try {
        let body = {...req.body};
        console.log(req.files)
         if(req.files && req.files.logo){
             body.logo = `/images/${req.files.logo[0].filename}`;
         }
         if(req.files && req.files.background){
            body.background = `/images/${req.files.background[0].filename}`;
        }
        const contentUpdated = (await Content.updateContent(body,["id",'about','logo','background','tagline','title','email'],'address')).rows[0];
        res.status(200).json({success:true,data:contentUpdated})
    } catch (error) {
        res.send(error.message);
    }
}

const getContents = async (req, res, next)=>{
    try {
        const content = (await Content.findContents()).rows[0];
        res.status(200).json({success: true,data:content});
    } catch (error) {
        res.status(500).json({success:false,msg:error.message});
    }
}

module.exports = {
    updateContent,
    getContents
}