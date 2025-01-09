require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const app = express();
const port = 3000;
const userModel = require('./models/user');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


// Middleware to parse incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // Make sure cookie-parser is added if you are using cookies


// login start
app.get('/login', (req, res) => {
    res.render('login');  // Ensure login.ejs exists in the 'views' folder
});

// Assuming you have a middleware to verify JWT and set `req.user`
app.get('/profile', (req, res) => {
    const token = req.cookies.token;
  
    if (!token) {
      return res.redirect('/login');
    }
  
    jwt.verify(token, 'shhh', (err, decoded) => {
      if (err) {
        return res.redirect('/login');
      }
  
      req.user = decoded; // Attach user data to the request object
      const { name, username, email } = req.user;
      res.render('profile', { name, username, email });
    });
  });
  

app.get("/", (req, res) => {
    res.render("sign-up")
})

app.post('/login', async (req, res) => {
    let { email, password } = req.body;

    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send('User not found');

    bcrypt.compare(password, user.password, function(err, result) {
        if (err) return res.status(500).send('Error comparing passwords');

        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhh");
            res.cookie('token', token);  // Set token in cookies
            console.log('Token set:', token);  // Debugging log
            return res.status(200).redirect('/home');
        } else {
            return res.redirect('/login');
        }
    });
});

app.get("/logout", (req, res) => {
    res.clearCookie('token', { path: '/' }); // Make sure the path is the same as the one when setting the cookie
    res.redirect('/login');
});

app.post('/register', async (req, res) => {
    let { email, password, name, age, username } = req.body;
    
    let user = await userModel.findOne({ email });
    if (user) {
        return res.status(500).send('User already registered');
    }

    bcrypt.genSalt(10, async (err, salt) => {
        if (err) {
            return res.status(500).send('Error generating salt');
        }
        bcrypt.hash(password, salt, async (err, hash) => {
            if (err) {
                return res.status(500).send('Error hashing password');
            }

            const newUser = new userModel({
                email,
                password: hash,
                name,
                age,
                username
            });

            // Save user to DB
            await newUser.save();

            // Create a JWT Token
            let token = jwt.sign({ email: email, userid: newUser._id }, "shhh");

            // Set the cookie
            res.cookie('token', token);
            res.redirect('/login');
        });
    });
});

// Middleware to check if the user is logged in
function isLoggedin(req, res, next) {
    if (!req.cookies.token) {
        return res.redirect('/login?error=Please login first');
    }

    jwt.verify(req.cookies.token, "shhh", (err, decoded) => {
        if (err) {
            return res.status(500).send('Invalid token');
        }

        console.log('Decoded token:', decoded); // Debugging log
        req.user = decoded; // Assign decoded to req.user
        next();  // Proceed to the next middleware/route
    });
}

// login end

// Set up EJS view engine
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize YouTube API client
const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

// Routes
app.get('/home', isLoggedin, async (req, res) => {
    try {
        const response = await youtube.videos.list({
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            regionCode: 'US',
            maxResults: 10,
        });

        const nextPageToken = response.data.nextPageToken || '';
        res.render('index', {
            videos: response.data.items,
            nextPageToken
        });
    } catch (error) {
        console.error('Error fetching videos:', error.message);
        res.status(500).send('Error fetching videos');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.q || '';
    if (query) {
        try {
            const response = await youtube.search.list({
                part: 'snippet',
                q: query,
                type: 'video',
                maxResults: 10,
            });

            const nextPageToken = response.data.nextPageToken || '';
            res.render('search', { results: response.data.items, query, nextPageToken });
        } catch (error) {
            console.error('Error fetching search results:', error);
            res.status(500).send('Error fetching search results');
        }
    } else {
        res.redirect('/');
    }
});

app.get('/load-more', async (req, res) => {
    const pageToken = req.query.v || '';
    try {
        const response = await youtube.videos.list({
            part: 'snippet,contentDetails,statistics',
            chart: 'mostPopular',
            regionCode: 'US',
            maxResults: 10,
            pageToken: pageToken,
        });

        res.json({
            videos: response.data.items,
            nextPageToken: response.data.nextPageToken || ''
        });
    } catch (error) {
        console.error('Error fetching more videos:', error);
        res.status(500).send('Error fetching more videos');
    }
});

app.get('/video/:id', async (req, res) => {
    const videoId = req.params.id;
    try {
        const response = await youtube.videos.list({
            part: 'snippet,statistics',
            id: videoId,
        });

        if (response.data.items.length === 0) {
            res.status(404).send('Video not found');
        } else {
            res.render('video', { video: response.data.items[0] });
        }
    } catch (error) {
        console.error('Error fetching video details:', error);
        res.status(500).send('Error fetching video details');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
