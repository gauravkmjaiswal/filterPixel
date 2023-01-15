require('dotenv').config();
const express= require("express")
const hbs= require("hbs")
const path= require("path")
const cookieParser=require("cookie-parser")
const bcrypt= require("bcryptjs")
const auth=require("./middleware/auth")
const app = express()
const { v4: uuidv4 } = require('uuid')
const port= process.env.PORT || 8000
require("./db/connection.js")
const RegisterPeople=require("./models/registers")
const static_path=path.join(__dirname,"../public")
const template_path = path.join(__dirname,"../templates/views")
const partials_path = path.join(__dirname,"../templates/partials")
const bodyParser = require('body-parser');
const rp = require('request-promise');
const passport =require('passport')



// google authentication 


// var GoogleStrategy = require('passport-google-oauth20').Strategy;

// passport.use(new GoogleStrategy({
//     clientID: process.env.GOOGLE_CLIENT_ID,
//     clientSecret: process.env.GOOGLE_SECRET_KEY,
//     callbackURL: "/auth/google/callback"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));

// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile'] }));

// app.get('/auth/google/callback', 
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function(req, res) {

//     console.log("hello there")
//     // Successful authentication, redirect home.
//     res.redirect('/');
//   });

//   
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "hbs");
app.set("views",template_path);


hbs.registerPartials(partials_path)
app.get('/',(req,res)=>{
    res.sendFile('login.html', { root: path.join(__dirname, '../public') });
})
app.get('/logout', auth, async (req, res) => {
    try {

        req.user.tokens = req.user.tokens.filter((cur) => {
            if (cur.token !== req.token) {
                return 1
            }
            else {
                return 0
            }
        })

        res.clearCookie("jwtlogin")
        await req.user.save();
        res.sendFile('login.html', { root: path.join(__dirname, '../public') });

    } catch (error) {
        res.status(401).send(error)
    }
})
app.get('/register',(req,res)=>{
    res.sendFile('register.html', { root: path.join(__dirname, '../public') });
})



//   AWS Content fetch API

const {
    S3Client,
    ListObjectsCommand,GetObjectCommand
} = require("@aws-sdk/client-s3");
// Set the AWS Region.
const REGION = "ap-south-1";
// Create an Amazon S3 service client object.
const s3Client = new S3Client({
    region: REGION,
    signer: {
        sign: async (request) => request
    }
});
const run = async () => {
    const bucketParams = {
        Bucket: 'testbucketfp',
      }
    console.log("hello")
    try {
        const data = await s3Client.send(new ListObjectsCommand(
            bucketParams
        ));
        return data; // For unit tests.
    } catch (err) {
        console.log("Error", err);
    }
};

app.get('/S3Images',async (req,res)=>{
    let data = await run()
    res.send(data)
})
app.get('/login',(req,res)=>{
    res.sendFile('login.html', { root: path.join(__dirname, '../public') });
})
app.post('/login',async (req,res)=>{
    try {
        const name=req.body.your_name;
        const pass=req.body.your_pass;
        const user=await RegisterPeople.findOne({name:name})
        
        const token=await user.generateAuthToken();
        res.cookie("jwtlogin",token,{
        expires: new Date(Date.now()+300000),
        httpOnly:true
        })
        if(user)
        {

        

            const matchh=await bcrypt.compare(pass,user.pass)
            if(matchh)
            {
                res.sendFile('secret.html', { root: path.join(__dirname, '../public') });
            }
            else{
                res.status(400).send("wrong details")
            }

        }
        else{
            res.status(400).send("wrong details this")
        }
 
    }catch(error){
        console.log("hello")
    }
})


app.post('/register',async (req,res)=>{
    try{
        const pas= req.body.pass;
        const re_pas= req.body.re_pass;
        if(pas!==re_pas)
        {
            return res.send("password and confirm password are diffrent !!!")
        }

        const regisPerson= await new RegisterPeople({
            name: req.body.name,
            email:req.body.email,
            pass:req.body.pass
        })
        const token=await regisPerson.generateAuthToken();

        res.cookie("jwt",token,{
            expires:new Date(Date.now()+300000),
            httpOnly:true
        })
        const finalPeople= await regisPerson.save()
        res.sendFile('login.html', { root: path.join(__dirname, '../public') });

    }catch(e)
    {
        res.status(400).send("error => "+e)
    }
})






app.listen(port,()=>{
    console.log("server is working well")
})