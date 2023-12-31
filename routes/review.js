const express=require("express");
const router =express.Router({mergeParams:true});
const wrapAsync=require("../utils/wrapAsync.js");
// const ExpressError=require("../utils/ExpressError.js");
// const {listingSchema,reviewSchema}=require('../schema.js');
const Review = require("../models/review.js");
const Listing = require("../models/listing.js");
const {validatereview , isLoggedIn ,isReviewAuthor}=require("../middleware.js");



// const validatereview=(req,res,next)=>{
//     let {error}=  reviewSchema.validate(req.body);
//     if(error){
     
//       throw new ExpressError(400,error);
//     }else{
//       next();
//     }
//   };


//Reviews

//postreview
router.post("/", isLoggedIn, validatereview,
 wrapAsync(async (req, res) => {
let listing =await Listing.findById(req.params.id);
let newReview=new Review(req.body.review);
newReview.author =req.user._id;
listing.reviews.push(newReview);

await newReview.save();
await listing.save();
req.flash("success","New review added");

res.redirect(`/listings/${listing._id}`);
}));

// delete review route

router.delete("/:reviewId",isLoggedIn,isReviewAuthor,
wrapAsync(async (req,res) => {
  let {id,reviewId}=req.params;

  await Listing.findByIdAndUpdate(id, {$pull: {reviews:reviewId}});
  await Review.findByIdAndDelete(reviewId);
  req.flash("success","Review deleted");

  res.redirect(`/listings/${id}`);
}));

module.exports=router;
