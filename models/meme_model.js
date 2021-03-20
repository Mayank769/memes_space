var mongoose=require("mongoose");

var memeSchema=new mongoose.Schema({
	owner_name:String,
	caption:String,
	meme_url:String,
	createdAt: { type: Date, default: Date.now },
    likes: {type:Number, default:0 },
	likedUsers: [{
				type: mongoose.Schema.Types.ObjectId,
            	ref: "User"
				}]
});
var meme_model=mongoose.model("meme_model",memeSchema);


module.exports = mongoose.model("meme_model",memeSchema);