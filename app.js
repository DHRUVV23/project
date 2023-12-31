if(process.env.NODE_ENV != "  production"){

  require('dotenv').config();
}

// console.log(process.env);

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require("./utils/ExpressError.js");
const Joi =require('joi');
const session=require("express-session");
const MongoStore =require('connect-mongo');
const cookieParser = require('cookie-parser');
const flash=require("connect-flash");
const passport=require("passport");
const LocalStrategy=require("passport-local");
const User= require("./models/user.js");




const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const dbUrl=process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));



const store=MongoStore.create({
  mongoUrl:dbUrl,
  crypto:{
    secret:process.env.SECRET,
  },
  touchAfter: 86400,//1day
});

store.on("error",()=>{
  console.log("Error in mongo session store",err);
});

const sessionOptions={
  store:store,
  secret:process.env.SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now()+ 604800000, //7day
    maxAge:604800000,
    httpOnly:true,
  },
};

// app.get("/", (req, res) => {
//   res.send("Hi, I am root");
// });



app.use(session(sessionOptions));
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(cookieParser());




app.use((req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.currUser=req.user;
  next();
});




app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);



app.all("*",(req,res,next)=>{
  next(new ExpressError(404,"Page not Found"));
});

app.use((err,req,res,next)=>{
  let{status=500,msg="Something went Wrong"}=err;
  res.status(status).render("error.ejs",{err,msg});
  // res.status(status).send(msg);
});

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});
