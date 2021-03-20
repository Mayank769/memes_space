// IMPORTING REQUIRED PACKAGES

// Backend Web-Application framework for Nodejs 
var express=require("express");    

// Schema-based solution to model application data
var mongoose=require("mongoose");  

// To Parse incoming request bodies
var bodyParser=require("body-parser");

// To notify user in error or success in doing task 
var flash=require("connect-flash");

// Importing model for memes
var memes=require("./models/meme_model");

// For overiding methods like post,get
var methodOverride=require("method-override");

// Creating object of express 
var app=express();

// For Handling authenticity and users
var passport=require("passport");
var LocalStrategy=require("passport-local");
var User=require("./models/user");


// making 'app' to use the following 
app.use(express.json());
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.locals.moment = require('moment');
app.use(flash());
app.use(methodOverride("_method"));
app.use(require("express-session")({
	secret:"this is mayank",
	resave:false,
	saveUninitialized:false
}));


// Passport configuration
//----------------------------------------------//
app.use(require("express-session")({
	secret:"this is mounika",
	resave:false,
	saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//----------------------------------------------//

app.use(function(req,res,next){
	
	res.locals.currentuser=req.user;
    res.locals.error=req.flash("error");
	res.locals.success=req.flash("success");
	next();
});

// Local Connection to DB
mongoose.connect("mongodb://localhost:27017/meme_data",{useNewUrlParser:true,useUnifiedTopology:true}).then(() =>{
	console.log("connected to db")}).catch(err=>{
	console.log("ERROR : ",err.message)});


// handling GET request for https://<Server_URL>/
app.get("/",function(req,res){
	
	memes.find({}, function(err, allMemes){
        if(err)
		{
               console.log(err);
        } 
		else
		{
			res.render("home/home_page",{memes:allMemes.slice(-100).reverse()});
        }
    });
});

// handling POST request for https://<Server_URL>/
app.post("/",function(req,res){
	//console.log(req.user);
	var creator;
	if(req.user)
	    creator=req.user.username;
	else 
		creator=req.body.name;
	var url=req.body.url;
	var title=req.body.caption;
	var newMeme={owner_name:creator,meme_url:url,caption:title};
	
	memes.find({caption: title, meme_url: url}, function(err, allMemes){
		  if(err)
		  {
              console.log(err);
          } 
		  else 
		  {
              if(allMemes.length < 1) 
			  {
	              memes.create(newMeme,function(err,mm){
		             if(err)
			             console.log("error");
		             else
		             { 
					   req.flash("success","Successfully posted meme!");
			           res.redirect("/");
		             }
				  });
			  }
			  else
			  {
				  req.flash("error","This meme already exists!");
			      res.redirect("/");
			  }
		   }							   
	});	
});

// handling GET request for https://<Server_URL>/memes
app.get("/memes",function(req,res){
	memes.find({}, function(err, allMemes){
           if(err)
		   {
               console.log(err);
           }
		   else
		   {
              res.json(allMemes.slice(-100).reverse());
           }
        });
});

// handling POST request for https://<Server_URL>/memes
app.post("/memes",function(req,res){
	var creator=req.body.name;
	var url=req.body.url;
	var title=req.body.caption;
	var newMeme={owner_name:creator,meme_url:url,caption:title};
	
	memes.find({caption: title, meme_url: url}, function(err, allMemes){
		  if(err)
		  {
              console.log(err);
          } 
		  else
		  {
              if(allMemes.length < 1)
			  {
	              memes.create(newMeme,function(err,mm){
		             if(err)
			             console.log("error");
		             else
		             { 
			           res.json({"id":mm["id"]});
		             }
				  });
			  }
			  else
			  {
			      res.status(409).send('Meme already exist');
			  }
		   }							   
	});			
});

// handling GET request for https://<Server_URL>/memes/id_of_meme
app.get("/memes/:id",function(req,res){
	var id=req.params.id;
	memes.findById(id, function(err, meme){
           if(err)
		   {
			   res.status(404).send("Invalid ID");
               console.log(err);
           } 
		   else
		   {
              res.json(meme);
           }
        });
});

// handling PATCH request for https://<Server_URL>/memes/id_of_meme
// to update some attribute of memes 
app.patch("/memes/:id",function(req,res){
	var id=req.params.id;
	var url=req.body.url;
	var title=req.body.caption;
	var updateData={meme_url:url,caption:title};
	memes.findByIdAndUpdate(id,updateData, function(err, meme){
           if(err)
		   {
			   res.status(404).send("Invalid ID");
               console.log(err);
           } 
		   else 
		   {
              res.json(meme);
           }
        });
});

// handling GET request for https://<Server_URL>/register 
app.get("/register",function(req,res){
	res.render("register",{page:'register'});
});

// Signup logic ,handling post request
app.post("/register",function(req,res){
	var newUser = new User({username: req.body.username,});
	User.register(newUser,req.body.password,function(err,user){
		if(err)
		{
		console.log(err);
		return res.render("register", {error: err.message,page:"register"});
		}
		passport.authenticate("local")(req,res,function(){
			req.flash("success","Welcome to XMeme "+user.username);
			res.redirect("/");
		});
	});
});

// handling GET request for https://<Server_URL>/login
app.get("/login",function(req,res){
	res.render("login",{page:'login'});
})

// login logic
app.post("/login",passport.authenticate("local",
{
	successRedirect:"/",
	failureRedirect:"/login",
	failureFlash: true,
	successFlash: 'Welcome to XMeme!'
}),function(req,res){
	
});

// Logout
app.get("/logout",function(req,res){
	req.logout();
	req.flash("success","Logged you out successfully!")
	res.redirect("/");
});

// handling PATCH request to update likes
app.patch("/like/:id",function(req,res){
	var id =req.params.id;
	if(!req.user)
	{
		req.flash("error","You have to login first to like ");
		res.redirect("/login");
	}
	else
	{
	memes.findById(id,function(err, meme){
           if(err)
		   {
			   res.status(404).send("Invalid ID");
               console.log(err);
           } 
		   else 
		   {
			 var lusers= meme.likedUsers;
			 var likes= meme.likes+1;
			 lusers.push(req.user._id);
			   
             memes.findByIdAndUpdate(id,{likedUsers:lusers,likes:likes},function(err, meme){
			   if(err)
			   {
				   console.log(err);
			   } 
			   else 
			   {
				  res.redirect("/");
			   }
             });
		   }
        });
	}
});

// to handle unknown request 
app.get("/:dummy",function(req,res){
	res.status(404).send("Page Doesnot exist!");
});
// deciding port number and IP where this app will run
/*
app.listen(process.env.PORT,process.env.IP,function(){
	console.log("MEME_PAGE has started");
});*/

app.listen(3000,'0.0.0.0',function(){
	console.log("MEME_PAGE has started");
});