const express = require('express');
const app = express();
const path = require('path');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const exphbs = require('express-handlebars');
const Sequelize = require('sequelize');

const storeService = require('./store-service');


var sequelize = new Sequelize('fcwwjhrg', 'fcwwjhrg', '7U0fGqwDIjHQyCfiyVJWfBgvVh7Q7swr', {
  host: 'bubble.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

cloudinary.config({
  cloud_name: 'dt0sdt0qs',
  api_key: '374356338479726',
  api_secret: 'wXQZC0u9IUKrdRoVztrGrVJosMI',
  secure: true
});


// no { storage: storage } since we are not using disk storage
const upload = multer().single('featureImage');

// Serve static files from the 'public' directory
app.use(express.static('public'));

// Set up the view engine
app.engine('.hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', '.hbs');

app.use(function(req,res,next){
  let route = req.path.substring(1);
  app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
  app.locals.viewingCategory = req.query.category;
  next();
});


// Route for the home page that redirects to "/about"
app.get('/', (req, res) => {
  res.redirect('/shop');
});

// Route for the "/about" page that returns the about.html file from the 'views' folder
app.get('/about', (req, res) => {
  res.render('about');
});


app.get('/items/add', (req, res) => {
  res.render('addItems');
});

// Route to get all items
app.get("/items", async (req, res) => {
  try {
    const items = await itemData.getAllItems();
    if (items.length > 0) {
      res.render("items", { items: items });
    } else {
      res.render("items", { message: "no results" });
    }
  } catch (err) {
    res.render("items", { message: "no results" });
  }
});

app.get('/items', (req, res) => {
  try {
    let filteredItems = [...storeService.getAllItems()]; // Create a copy of all items to apply filters

    // Check if the "category" query parameter is provided
    if (req.query.category) {
      const categoryValue = parseInt(req.query.category);
      filteredItems = storeService.getItemsByCategory(categoryValue);
    }

    // Check if the "minDate" query parameter is provided
    if (req.query.minDate) {
      const minDateValue = new Date(req.query.minDate);
      filteredItems = storeService.getItemsByMinDate(minDateValue);
    }

    // Return the filtered items as JSON
    res.json(filteredItems);
  } catch (error) {
    console.error('Error getting items:', error);
    res.status(500).json({ message: 'Error getting items' });
  }
});

app.get('/item/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    storeService.getItemById(itemId)
      .then(item => {
        if (item) {
          res.json(item);
        } else {
          res.status(404).json({ message: 'Item not found' });
        }
      })
      .catch(error => {
        console.error('Error getting item:', error);
        res.status(500).json({ message: 'Error getting item' });
      });
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ message: 'Error handling request' });
  }
});

// Route to get all categories

app.get("/categories", async (req, res) => {
  try {
    const categories = await itemData.getCategories();
    if (categories.length > 0) {
      res.render("categories", { categories: categories });
    } else {
      res.render("categories", { message: "no results" });
    }
  } catch (err) {
    res.render("categories", { message: "no results" });
  }
});

app.get("/Items/delete/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    // Delete the post by its id using store-service.deletePostById
    await storeService.deletePostById(postId);

    // Redirect back to the /Items route after successful deletion
    res.redirect("/Items");
  } catch (error) {
    // If there was an error, set status code to 500 and display an error message
    res.status(500).send("Unable to Remove Post / Post not found");
  }
});


app.post("/categories/add", async (req, res) => {
  try {
    const categoryData = {
      category: req.body.category,
    };

    // Call the addCategory function from store-service.js to add the category
    await storeService.addCategory(categoryData);

    // Redirect to the /categories route after successfully adding the category
    res.redirect("/categories");
  } catch (err) {
    // Handle errors here (e.g., render an error view)
    res.send("Error adding category");
  }
});

app.get("/Items/add", async (req, res) => {
  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // Render the "addPost" view with the categories data
    res.render("addPost", { categories });
  } catch (err) {
    // If there was an error fetching categories, render the "addPost" view with an empty array for categories
    res.render("addPost", { categories: [] });
  }
});


app.get("/items/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Call the deletePostById function from store-service.js to delete the item
    await storeService.deletePostById(id);

    // Redirect to the /items route after successfully deleting the item
    res.redirect("/items");
  } catch (err) {
    // Handle errors here (e.g., return a status code and plain text message)
    res.status(500).send("Unable to Remove Item / Item not found");
  }
});

app.get("/categories/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;

    // Call the deleteCategoryById function from store-service.js to delete the category
    await storeService.deleteCategoryById(id);

    // Redirect to the /categories route after successfully deleting the category
    res.redirect("/categories");
  } catch (err) {
    // Handle errors here (e.g., return a status code and plain text message)
    res.status(500).send("Unable to Remove Category / Category not found");
  }
});


// Route to handle the form submission and image upload
app.post('/items/add', upload, async (req, res) => {
  try {
    let imageUrl = "";

    if (req.file) {
      // Function to handle the file upload to Cloudinary
      const streamUpload = (req) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream((error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          });

          streamifier.createReadStream(req.file.buffer).pipe(stream);
        });
      };

      // Async function to upload the file to Cloudinary
      const uploadFile = async (req) => {
        try {
          const uploaded = await streamUpload(req);
          return uploaded;
        } catch (error) {
          throw new Error('Error uploading image to Cloudinary: ' + error.message);
        }
      };

      // Call the uploadFile function to handle the file upload
      const uploaded = await uploadFile(req);
      imageUrl = uploaded.url;
    }

    const itemData = req.body;
    itemData.featureImage = imageUrl;

    // Add the new item to the "items" array using the store-service module
    await storeService.addItem(itemData);

    // After adding the new item, redirect the user to the /items route
    res.redirect('/items');
  } catch (error) {
    console.error('Error handling the form submission:', error);
    // If there was an error, handle it appropriately
    // For example, you can send an error message to the client or redirect to an error page
    res.status(500).send('Error handling the form submission');
  }
});

app.get("/shop", async (req, res) => {
  // Declare an object to store properties for the view
  let viewData = {};

  try {
    // Declare empty array to hold "items" objects
    let items = [];

    // If there's a "category" query, filter the returned items by category
    if (req.query.category) {
      // Obtain the published "items" by category
      items = await storeService.getPublishedItemsByCategory(req.query.category);
    } else {
      // Obtain the published "items"
      items = await storeService.getPublishedItems();
    }

    // Sort the published items by postDate
    items.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    // Get the latest item from the front of the list (element 0)
    let post = items[0];

    // Store the "items" and "post" data in the viewData object (to be passed to the view)
    viewData.items = items;
    viewData.post = post; // Changed from 'item' to 'post'
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    // Obtain the full list of "categories"
    let categories = await storeService.getCategories();

    // Store the "categories" data in the viewData object (to be passed to the view)
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }

  // Render the "shop" view with all of the data (viewData)
  res.render("shop", { storeService: viewData }); // Changed 'data' to 'storeService'
});


app.get('/shop/:id', async (req, res) => {

  // Declare an object to store properties for the view
  let viewData = {};

  try{

      // declare empty array to hold "item" objects
      let items = [];

      // if there's a "category" query, filter the returned posts by category
      if(req.query.category){
          // Obtain the published "posts" by category
          items = await itemData.getPublishedItemsByCategory(req.query.category);
      }else{
          // Obtain the published "posts"
          items = await itemData.getPublishedItems();
      }

      // sort the published items by postDate
      items.sort((a,b) => new Date(b.postDate) - new Date(a.postDate));

      // store the "items" and "item" data in the viewData object (to be passed to the view)
      viewData.items = items;

  }catch(err){
      viewData.message = "no results";
  }

  try{
      // Obtain the item by "id"
      viewData.item = await itemData.getItemById(req.params.id);
  }catch(err){
      viewData.message = "no results"; 
  }

  try{
      // Obtain the full list of "categories"
      let categories = await itemData.getCategories();

      // store the "categories" data in the viewData object (to be passed to the view)
      viewData.categories = categories;
  }catch(err){
      viewData.categoriesMessage = "no results"
  }

  // render the "shop" view with all of the data (viewData)
  res.render("shop", {data: viewData})
});

// 404 Route - No matching route
app.use((req, res, next) => {
  res.status(404).render('404');
});

// Define the port for the server to listen on
const PORT = process.env.PORT || 8080;

// Initialize data and start the server
storeService.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Express http server listening on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error initializing data:', error);
    process.exit(1); // Exit the process with an error code
  });
