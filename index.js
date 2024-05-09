const express = require("express");
const mongoose = require("mongoose");
const ObjectId = require("mongodb").ObjectId;
const app = express();
const cors = require("cors");
require("dotenv").config();
let logs = {};
// Import Mongo DB Atlas models
/*const User = require("./models/user");
const Exercise = require("./models/exercise");*/

let userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
});

let User = mongoose.model("Users_", userSchema);

let exerciseSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    description: String,
    duration: Number,
    date: Date,
});

let Exercise = mongoose.model("Exercise_", exerciseSchema);

// Mount the body parser as middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to DB Atlas
const MySecret = process.env.MONGO_URI;

mongoose
    .connect(MySecret, {
        serverSelectionTimeoutMS: 60000,
    })
    .then(() => {
        console.log("Successfully connected to MongoDB.");
    })
    .catch((err) => {
        console.error("Connection error", err);
    });

// Enable cors for FCC to test the application

app.use(cors());

// Mount the middleware to serve the style sheets in the public folder

app.use(express.static("public"));

// Print to the console information about each request made

app.use((req, res, next) => {
    console.log(
        "method: " + req.method + "  |  path: " + req.path + "  |  IP - " + req.ip,
    );

    next();
});

// GET: Display the index page for

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});

// PATH /api/users/ Requests

app.get("/api/users", async (req, res) => {
    let users = [];
    await User.find({})
        .then((res) => {
            console.log(res);
            users = [...res];
        })
        .catch((error) => console.log(error));
    if (!users) {
        console.log("No users found in DB");
        return;
    }
    res.json(users);
});

app.post("/api/users", async (req, res, next) => {
    let usernameExist = {};
    await User.findOne({ username: req.body.username })
        .then((response) => {
            usernameExist = response;
        })
        .catch((error) => {
            console.log(error);
        });
    //
    if (usernameExist != null) {
        res.status(200).send("User already exists");
        return;
    } else {
        const newUser = new User({
            username: req.body.username,
        });

        //newUser._id = new mongoose.Types.ObjectId();

        // Add new User

        const saveUser = await newUser.save();

        if (!saveUser) {
            console.log("Error saving the user to the DB");
            return;
        }

        return res.status(200).json({
            username: saveUser.username,
            _id: saveUser._id,
        });
    }
});

app.post("/api/users/:_id/exercises", async (req, res) => {
    // Get data from form
    const userId = req.params._id;
    const description = req.body.description;
    const duration = req.body.duration;
    let date = req.body.date;

    // Make sure the user has entered in an id, a description, and a duration
    // Set the date entered to now if the date is not entered

    if (!userId) {
        res.json("Path 'userID' is required.");
        return;
    }
    if (!description) {
        res.json("Path 'description' is required.");
        return;
    }
    if (!duration) {
        res.json("Path 'duration' is required.");
        return;
    }

    // Check if user ID is in the User model

    let user = {};

    await User.findById(userId)
        .then((response) => {
            console.log(response);
            user = response;
        })
        .catch((error) => console.log(error));

    if (user === null) {
        return res.json("Invalid userID");
    } else {
        // Create an Exercise object
        let exerciseObj = {
            userId,
            date: date ? new Date(date) : new Date(),
            duration,
            description,
        };
        //
        const newExercise = new Exercise(exerciseObj);
        // Save the exercise
        const savedExercise = await newExercise.save();
        //
        if (!savedExercise) return console.log("Exercise not saved successfully");
        // Create JSON object to be sent to the response
        return res.json({
            _id: user._id,
            username: user.username,
            description: savedExercise.description,
            duration: savedExercise.duration,
            date: new Date(savedExercise.date).toDateString(),
        });
        //
    }
});

// PATH /api/users/:_id/logs?[from][&to][&limit]

app.get("/api/users/:_id/logs", async (req, res, next) => {
    //
    const id = req.params._id;
    let from = req.body.from;
    let to = req.body.to;
    const limit = req.query.limit;
    //
    console.log(id, from, to, limit);
    // Get the user's information
    const user = await User.findById(id);

    if (!user) {
        res.json("Invalid userID");
        return;
    } else {
        let queryObj = { userId: user._id };
        /*
        if (from != undefined && to != undefined) {
          queryObj.date = {};
          queryObj.date["$gte"] = new Date(from).toDateString();
          console.log("from", queryObj.date["$gte"]);
          queryObj.date["$lte"] = new Date(to).toDateString();
          console.log("to", queryObj.date["$lte"]);
        }

        if (limit != undefined) {
          limit = new Number(limit);
          if (isNaN(limit)) {
            res.json("Invalid Limit Entered");
            return;
          }
        }*/

        let responseObject = {
            _id: user._id,
            username: user.username,
        };

        const exercises = await Exercise.find(queryObj)
            .then((exercises) => {
                let arr = [];
                const dates = exercises.reduce((data, elem) => {
                    data.push(elem.date.toDateString());
                    arr.push({
                        duration: elem.duration,
                        description: elem.description,
                        date: elem.date.toDateString(),
                    });
                    return data;
                }, []);

                const isDateFormart = /^\d{4}-\d{2}-\d{2}$/;
                const isDigit = /^[0-9]*$/;

                if (from !== undefined) {
                    console.log("date test from insideside", from);
                    const fromDate = new Date(from);
                    arr = arr.filter((value) => new Date(value.date) >= fromDate);
                    console.log(fromDate);
                    throw new Error("Something went badly wrong!");
                }
                if (to !== undefined) {
                    console.log("date test to insideside", to);
                    const toDate = new Date(to);
                    arr = arr.filter((value) => new Date(value.date) <= toDate);
                    console.log(toDate);
                    throw new Error("Something went badly wrong!");
                }

                if (limit !== undefined && isDigit.test(limit)) {
                    console.log("limit test inside", limit);
                    arr = arr.slice(0, limit);
                }

                responseObject.log = arr;
                responseObject.count = arr.length;
                console.log(responseObject);
            })
            .catch((error) => console.log("Error"));

        res.json(responseObject);

        next();
    }
});

app.get("/api/users/:_id/exercises", async (req, res) => {
    //
    const id = req.params._id;
    const user = await User.findById(id);
    //
    if (!user) {
        res.json("Invalid userID");
        return;
    } else {
        let obj = {};
        await Exercise.find({ userId: user._id })
            .then((res) => {
                obj = res;
            })
            .catch((error) => console.log(error));
        return res.json(obj);
    }
});

// Listen on the proper port to connect to the server

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
