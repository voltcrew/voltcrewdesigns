const fs = require("fs");
const path = require("path");

const productsDir = path.join(__dirname, "photos");
const outputFile = path.join(productsDir, "photos.json");

// Define default price mapping for product types
const priceMap = {
  tee: 55.5,
  hoodies: 75.5,
  longsleeve: 65.5,
  crewneck: 70.5
};

const photosJson = {};

// Get top-level categories (e.g., tee, hoodies)
const categories = fs.readdirSync(productsDir).filter(f =>
  fs.statSync(path.join(productsDir, f)).isDirectory()
);

categories.forEach(category => {
  const categoryPath = path.join(productsDir, category);
  
  // Get subfolders (e.g., speedlimit, wheelies)
  const subfolders = fs.readdirSync(categoryPath).filter(f =>
    fs.statSync(path.join(categoryPath, f)).isDirectory()
  );

  subfolders.forEach(sub => {
    const productPath = path.join(categoryPath, sub);
    
    // Only get image files
    const files = fs.readdirSync(productPath).filter(f =>
      /\.(png|jpg|jpeg)$/i.test(f)
    );

    const colors = {};

    files.forEach(file => {
      // filename format: product_color_x.ext
      // e.g., hoodie_black_1.jpg
      const nameParts = file.split("_");
      if (nameParts.length < 3) return;

      // color is everything after product and before last part
      const colorParts = nameParts.slice(1, -1);
      const colorName = colorParts.join(" ").toLowerCase();

      if (!colors[colorName]) colors[colorName] = [];
      // Only save filename, not full path
      colors[colorName].push(file);
    });

    // price lookup based on top-level category
    const price = priceMap[category.toLowerCase()] || 50;

    // build product key: e.g. hoodie-speedlimit
    const productKey = `${category}-${sub}`.toLowerCase();

    photosJson[productKey] = {
      type: category,
      name: sub,
      price: price,
      colors: colors
    };
  });
});

// Write JSON file
fs.writeFileSync(outputFile, JSON.stringify(photosJson, null, 2));
console.log("photos.json generated successfully!");
