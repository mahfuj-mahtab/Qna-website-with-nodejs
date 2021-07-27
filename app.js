const express = require("express");
const app = express();
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const passwordValidator = require("password-validator");
const bcrypt = require("bcrypt");
const session = require("express-session");
require('dotenv').config();
const salt = 10;


app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : true,

}))

//databvase connection
mongoose.connect("mongodb://localhost/qna",{useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("connected");
});
//register schema 
const registerSchema = new mongoose.Schema({
    name : String,
    user : String,
    password : String,
});
//register model
const Registeruser = mongoose.model("Registeruser", registerSchema);

const questionSchema = new mongoose.Schema({
    title : String,
    body : String,
    author : String,
})
const Question = mongoose.model("Question", questionSchema);


const answerSchema = new mongoose.Schema({
    questionId : String,
    ans : String,
    author : String,
    views : Number,
})
const Answer = mongoose.model("Answer", answerSchema);
app.get("/",(req,res)=>{
    if(req.session.user){
        Question.find({},(err,result)=>{
            Answer.find({questionId : result[0]._id},(err,answerLengthResult)=>{

                res.render("index",{login : true, results : result,totalAnswer : answerLengthResult.length});
            })
        })
        
        //document.getElementsByClassName("join").id="hidden";
    }
    else{
        Question.find({},(err,result)=>{
            Answer.find({questionId : result[0]._id},(err,answerLengthResult)=>{
            res.render("index",{login : false, results : result,totalAnswer : answerLengthResult.length});
        })
        })
}
})

app.get("/question/:qId/:qTitle",(req,res)=>{
    console.log(req.params.qId);
    console.log(req.params.qTitle);
    Question.find({_id : req.params.qId},(err,result)=>{
        if(err){
            console.log(err)
        }
        else{
            // res.render("question",{qId : req.params.qId, qTitle : result[0].title, qBody : result[0].body, author : result[0].author});
            console.log(result[0]._id);
            console.log(result[0].title);
            Answer.find({questionId : req.params.qId},(err,answerResult)=>{
                if(err){
                    console.log(err)
                }
                else{
                     res.render("question",{results : result,answerResults : answerResult, login : true});

                }
            })
        }
        
    })
   
   // res.redirect(`/question/${req.params.qId}/abc`);
})



app.get("/ask",(req,res)=>{
    if(req.session.user){
        res.render("ask",);
    }
    else{
        res.redirect("/community");
    }
})
app.post("/ans/:qId",(req,res)=>{
    var ans = req.body.ans;
    // var qId = Number();
    const newAnswer = Answer({
        questionId : req.params.qId,
        ans : ans,
        author : req.session.user,
    })
    newAnswer.save();
    Question.find({_id : req.params.qId},(err,result)=>{
        res.redirect(`/question/${req.params.qId}/${result[0].title.replace(/\s+/g, '-').toLowerCase()}`);
    })
    
})


app.get("/community",(req,res)=>{
    res.render("community");
})
app.post("/join",(req,res)=>{
    let user = req.body.user;
    let password = req.body.password;
    let name = req.body.name;
    let email = req.body.email;

    //password validation
    var passwordSchema = new passwordValidator();
    passwordSchema.is().min(8)                                    // Minimum length 8
    passwordSchema.is().max(100)                                  // Maximum length 100
    passwordSchema.has().uppercase()                              // Must have uppercase letters
    passwordSchema.has().lowercase()                              // Must have lowercase letters
    passwordSchema.has().digits(2) 
    Registeruser.find({"email" : email},(err,result)=>{
        if(err){
            console.log(err);
        }
        else if(result.length == 0){
            Registeruser.find({"user":user},(err,result)=>{
                if(result.length == 0){

                    if(passwordSchema.validate(password)){
                        bcrypt.hash(password,salt,(err,hash)=>{
                            console.log(hash)
                            const newUser = new Registeruser({
                                name : name,
                                user  : user,
                                password : hash,
                            })
                            newUser.save()
                            req.session.user = user;
                            res.redirect("/");
                        })
                    }
                    else{
                        console.log("password is not validated");
                    }
                }
                else{
                    console.log("user already exist");
                }
            })

        }
        else{
            console.log("email already exist");
        }
    })


    
    

})


app.post("/login",(req,res)=>{
    let user = req.body.user;
    let password = req.body.password;
    Registeruser.find({"user":user},(err,result)=>{
        if(result.length == 1){
            console.log(result[0].user);
            bcrypt.compare(password,result[0].password,(err,result)=>{
                if(result == true){
                    req.session.user = user;
                    res.redirect("/");
                    
                }
            })
        }
    })
})

app.get("/logout",(req,res)=>{
    req.session.destroy();
    res.redirect("/");
})


app.post("/ask",(req,res)=>{
    var title = req.body.title;
    var body = req.body.body;
    const newQuestion = new Question({
        title : title,
        body : body,
        author : req.session.user,
    });
    newQuestion.save();
    res.redirect("/");

})



app.listen(3000,()=>{
    console.log("server started");
})