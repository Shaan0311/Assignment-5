const { Sequelize, DataTypes } = require('sequelize');

var sequelize = new Sequelize('fcwwjhrg', 'fcwwjhrg', '7U0fGqwDIjHQyCfiyVJWfBgvVh7Q7swr', {
  host: 'bubble.db.elephantsql.com',
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
      ssl: { rejectUnauthorized: false }
  },
  query: { raw: true }
});

// Define the Item model
const Item = sequelize.define('item', {
  body: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  postDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  featureImage: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  published: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  price: {
    type: DataTypes.DOUBLE,
    allowNull: false,
  },
});

// Define the Category model
const Category = sequelize.define('Category', {
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Define the relationship: Item belongs to a Category
Item.belongsTo(Category, { foreignKey: 'category' });

// Function to initialize the database
function initialize() {
  return new Promise((resolve, reject) => {
    sequelize
      .sync()
      .then(() => {
        resolve('Database synced successfully');
      })
      .catch((err) => {
        reject('Unable to sync the database');
      });
  });
}

// Function to get all items
function getAllItems() {
  return Item.findAll()
    .then((items) => {
      return items;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to get items by category
function getItemsByCategory(category) {
  return Item.findAll({
    where: {
      category: category,
    },
  })
    .then((items) => {
      return items;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to get items by minimum date
function getItemsByMinDate(minDateStr) {
  const { Op } = Sequelize;
  return Item.findAll({
    where: {
      postDate: {
        [Op.gte]: new Date(minDateStr),
      },
    },
  })
    .then((items) => {
      return items;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to get item by ID
function getItemById(id) {
  return Item.findAll({
    where: {
      id: id,
    },
  })
    .then((items) => {
      return items[0];
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to add an item
function addItem(itemData) {
  itemData.published = itemData.published ? true : false;

  for (const key in itemData) {
    if (itemData[key] === '') {
      itemData[key] = null;
    }
  }

  itemData.postDate = new Date();

  return Item.create(itemData)
    .then(() => {
      return;
    })
    .catch(() => {
      throw new Error('Unable to create post');
    });
}

// Function to get published items
function getPublishedItems() {
  return Item.findAll({
    where: {
      published: true,
    },
  })
    .then((items) => {
      return items;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to get published items by category
function getPublishedItemsByCategory(category) {
  return Item.findAll({
    where: {
      published: true,
      category: category,
    },
  })
    .then((items) => {
      return items;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

// Function to get all categories
function getCategories() {
  return Category.findAll()
    .then((categories) => {
      return categories;
    })
    .catch(() => {
      throw new Error('No results returned');
    });
}

const addCategory = (categoryData) => {
  return new Promise(async (resolve, reject) => {
    try {
      for (let prop in categoryData) {
        if (categoryData[prop] === "") {
          categoryData[prop] = null;
        }
      }
      const category = await Category.create(categoryData);
      resolve(category);
    } catch (err) {
      reject("unable to create category");
    }
  });
};

const deleteCategoryById = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const deletedCategory = await Category.destroy({ where: { id: id } });
      if (deletedCategory) {
        resolve();
      } else {
        reject("Category not found");
      }
    } catch (err) {
      reject("Error deleting category");
    }
  });
};

async function deletePostById(id) {
  try {
    // Find the post by its id and delete it
    const deletedRows = await Item.destroy({
      where: {
        id: id,
      },
    });

    // If no rows were deleted, the post was not found
    if (deletedRows === 0) {
      return Promise.reject("Post not found");
    }

    // Resolve the promise if the post was successfully deleted
    return Promise.resolve();
  } catch (error) {
    // Reject the promise if there was an error
    return Promise.reject("Unable to remove post");
  }
}


module.exports = {
  initialize,
  getAllItems,
  getItemsByCategory,
  getItemsByMinDate,
  getItemById,
  addItem,
  getPublishedItems,
  getPublishedItemsByCategory,
  addCategory,
  getCategories,
  deleteCategoryById,
  deletePostById,
};
