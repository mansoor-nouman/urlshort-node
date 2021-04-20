const express = require("express");
const app = express();
const cors = require("cors");
const mongodb = require("mongodb");
const URL = "mongodb+srv://mansoor:mansoor123@cluster0.ybuuf.mongodb.net/test?authSource=admin&replicaSet=atlas-qox0hn-shard-0&readPreference=primary&appname=MongoDB%20Compass&ssl=true"
const DB = "urlShortener"
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config()
app.use(cors())
app.use(express.json());

app.post("/register", async function(req,res){
    try{
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let uniqueEmail = await db.collection("Registeredusers").findOne({userEmail: req.body.userEmail});
        if(uniqueEmail){
            res.status(401).json({
                message: "Email already exist"
            })
        }else{
            let salt = await bcrypt.genSalt(10);
            let hash = await bcrypt.hash(req.body.userPassword,salt);
            req.body.userPassword = hash;
            await db.collection("Registeredusers").insertOne(req.body);

            await connection.close();
            res.json({
                message: "User registered"
            })
        }
    } catch(error){
        console.log(error)
    }
})
app.post("/login", async function(req,res){
    try{
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let user = await db.collection("Registeredusers").findOne({userEmail: req.body.userEmail})
        if(user){
            let isPasswordCorrect = await bcrypt.compare(req.body.userPassword, user.userPassword);
            if(isPasswordCorrect){
                let token = jwt.sign({_id:user._id}, process.env.secret)
                res.json({
                    message: "allow", token, id: user._id
                })
            }else{
                res.status(404).json({
                    message: "Email or password is incorrect"
                })
            }
        }else{
            res.status(404).json({
                message: "Email or password is incorrect"
            })
        }
    }catch(error){
        console.log(error);
    }
})

function generateUrl(){
    var rand = "";
    var char = "sadfaidsiuosyfcayuicanyefryusaiyrucysa";
    var charlen = char.length;
    for(var i=0; i<5; i++){
        rand += char.charAt(
            Math.floor(Math.random()* charlen)
        );
    }
    return rand;
}

app.post("/urlshort", async function(req, res){
  try{
    req.body.shorturl = generateUrl();
    let connection = await mongodb.connect(URL);
    let db = connection.db(DB);
    await db.collection("urls").insertOne(req.body);
    await connection.close();
    res.json({
        message: "url created"
    })
  }catch(error){
      console.log(error);
  }
})
app.get("/urlshort", async function(req, res){
    try{
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let url = await db.collection("urls").find().toArray();
        res.json(url)
        await connection.close();
        res.redirect(url.longurl)
    }catch (error){
        console.log(error)
    }
})

app.get("/:id",async (req,res) => {
    try{
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        db.collection("urls").findOne({shorturl: req.params.id}, (err, data) => {
            if(err){
                throw err;
            }
            else{
                res.redirect(data.longurl)
            }
        })
        await connection.close();
    } catch(error){
        console.log(error)
    }
})

app.get("/userurl/:id", async function(req,res){
    try{
        let connection = await mongodb.connect(URL);
        let db = connection.db(DB);
        let urls = await db.collection("urls").find({userEmail : req.params.id}).toArray();
        res.json(urls)
        await connection.close();
    }catch(error){
        console.log(error)
    }
})
app.listen(process.env.PORT||5000);
