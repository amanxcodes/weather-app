require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const mongoose = require('mongoose');
const bodyParser= require('body-parser');
const https= require('https');


const session= require('express-session');
const passport= require('passport');
const passportLocalMongoose= require('passport-local-mongoose');

const _= require('lodash');
 

const app= express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'));
app.set('view engine', 'ejs');

app.use(session({
    resave:false,
    saveUninitialized:false,
    secret:'This is also a new secret'
}))

app.use(passport.initialize());
app.use(passport.session());

//DB ------
// mongoose.connect('mongodb://localhost:27017/weatherUsers');
mongoose.connect('mongodb+srv://amanpreetsingh:test123@cluster0.nfeymax.mongodb.net/weatherAppUsers')
const userSchema = mongoose.Schema({
    usrname:String,
    password:String
})
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('user',userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//   ------


app.get('/',(req,res)=>{
    res.render('home');
})

app.get('/home',(req,res)=>{
    if(req.isAuthenticated()){
        res.render('weatherHome')
    }else{
        res.redirect('/login')
    }

})

app.get('/login',(req,res)=>{
    res.render('login')
})

app.post('/login',(req,res)=>{
    const newUser = new User({
        username:req.body.username,
        password:req.body.password
    })

    req.logIn(newUser,(err,user)=>{
        if(err){
            res.redirect('/');
        } else{
            passport.authenticate('local')(req,res,()=>{
                console.log('found')
                res.redirect('/home');
            })
        }
    })

})

app.post('/',(req,res)=>{
   
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect('/login')
        }else{
            console.log(user);
            passport.authenticate('local')(req,res,()=>{
                res.redirect('/home')
            })
        }
    })
})
// weather api



app.post('/result',(req,res)=>{
    
    const options = {
        day:'numeric',
        weekday:'long',
        month:'long'
    }
    const date = new Date();
    const today= date.toLocaleDateString('en-us',options);

    const cityName = _.upperFirst(req.body.city) ;
    const apiKey= process.env.API_KEY;
        
    const url= `https://api.openweathermap.org/data/2.5/weather?q=${cityName},in&appid=${apiKey}&units=metric`
    if(!(cityName==='')){
    https.get(url,(response)=>{
        console.log(response.statusCode);
        if(response.statusCode===200){
            response.on('data',(data)=>{
            const dataParsed = JSON.parse(data);
            const description= dataParsed.weather[0].description;
            const temp= dataParsed.main.temp;
            const feelsLike= dataParsed.main.feels_like;
            const imgCode=dataParsed.weather[0].icon;
            const imgUrl= `http://openweathermap.org/img/wn/${imgCode}@2x.png`

            res.render('result',{city:cityName,temp:temp,description:description,feelsLike:feelsLike,imgUrl:imgUrl,today:today});
        }) 
         } else{
            res.render('failed')
         }
       
    })
} else{
    res.redirect('/home')
}
    
})

app.get('/logout',(req,res)=>{
    req.logout((err)=>{
        if(!err){
            res.redirect('/');
        }
    })
})


app.listen(process.env.PORT ||3000,()=>{
    console.log(`Server Started at PORT: 3000`);
})