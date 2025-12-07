import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getMenuItems = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.category) {
      return await ctx.db
        .query("menuItems")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("available"), true))
        .collect();
    }
    return await ctx.db
      .query("menuItems")
      .filter((q) => q.eq(q.field("available"), true))
      .collect();
  },
});

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    const categories = [...new Set(items.map((item) => item.category))];
    return categories;
  },
});

// Security: Get single menu item for server-side price validation
export const getMenuItem = query({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    const menuItem = await ctx.db.get(args.id);
    if (!menuItem || !menuItem.available) {
      throw new Error("Menu item not found or not available");
    }
    return menuItem;
  },
});

export const seedMenu = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if menu already exists
    const existingItems = await ctx.db.query("menuItems").take(1);
    if (existingItems.length > 0) {
      return "Menu already seeded";
    }

    const menuItems = [
      {
        name: "Espresso",
        description: "Rich and bold single shot of espresso",
        basePrice: 2.5,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Single", priceModifier: 0 },
          { name: "Double", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Decaf", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Americano",
        description: "Espresso with hot water",
        basePrice: 3.25,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Decaf", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Latte",
        description: "Espresso with steamed milk and light foam",
        basePrice: 4.5,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Almond Milk", price: 0.6 },
          { name: "Soy Milk", price: 0.6 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
          { name: "Decaf", price: 0 },
        ],
      },
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk and thick foam",
        basePrice: 4.25,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Almond Milk", price: 0.6 },
          { name: "Cinnamon", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
          { name: "Decaf", price: 0 },
        ],
      },
      {
        name: "Mocha",
        description: "Espresso with chocolate and steamed milk",
        basePrice: 5.0,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Whipped Cream", price: 0.5 },
          { name: "Extra Chocolate", price: 0.5 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Green Tea",
        description: "Premium loose leaf green tea",
        basePrice: 2.75,
        category: "tea",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Honey", price: 0.25 },
          { name: "Lemon", price: 0.25 },
        ],
      },
      {
        name: "Chai Latte",
        description: "Spiced tea with steamed milk",
        basePrice: 4.0,
        category: "tea",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Oat Milk", price: 0.6 },
          { name: "Almond Milk", price: 0.6 },
          { name: "Extra Spice", price: 0.25 },
        ],
      },
      {
        name: "Croissant",
        description: "Buttery, flaky pastry",
        basePrice: 3.5,
        category: "pastry",
        available: true,
        sizes: [{ name: "Regular", priceModifier: 0 }],
        customizations: [{ name: "Warmed", price: 0 }],
      },
      {
        name: "Blueberry Muffin",
        description: "Fresh baked muffin with blueberries",
        basePrice: 3.25,
        category: "pastry",
        available: true,
        sizes: [{ name: "Regular", priceModifier: 0 }],
        customizations: [{ name: "Warmed", price: 0 }],
      },
    ];

    for (const item of menuItems) {
      await ctx.db.insert("menuItems", item);
    }

    return "Menu seeded successfully";
  },
});

// Force refresh menu with latest items (clears existing and reseeds)
export const refreshMenu = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing menu items
    const existingItems = await ctx.db.query("menuItems").collect();
    for (const item of existingItems) {
      await ctx.db.delete(item._id);
    }

    const menuItems = [
      {
        name: "Espresso",
        description: "Rich and bold single shot of espresso",
        basePrice: 2.5,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Single", priceModifier: 0 },
          { name: "Double", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Decaf", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Americano",
        description: "Espresso with hot water",
        basePrice: 3.25,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Decaf", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Latte",
        description: "Espresso with steamed milk and light foam",
        basePrice: 4.5,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Almond Milk", price: 0.6 },
          { name: "Soy Milk", price: 0.6 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
          { name: "Decaf", price: 0 },
        ],
      },
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk and thick foam",
        basePrice: 4.25,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Almond Milk", price: 0.6 },
          { name: "Cinnamon", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
          { name: "Decaf", price: 0 },
        ],
      },
      {
        name: "Mocha",
        description: "Espresso with chocolate and steamed milk",
        basePrice: 5.0,
        category: "coffee",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Extra Shot", price: 0.75 },
          { name: "Oat Milk", price: 0.6 },
          { name: "Whipped Cream", price: 0.5 },
          { name: "Extra Chocolate", price: 0.5 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Green Tea",
        description: "Premium loose leaf green tea",
        basePrice: 2.75,
        category: "tea",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Honey", price: 0.25 },
          { name: "Lemon", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Earl Grey",
        description: "Classic bergamot-flavored black tea",
        basePrice: 2.75,
        category: "tea",
        available: true,
        sizes: [
          { name: "Small", priceModifier: 0 },
          { name: "Medium", priceModifier: 0.5 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Milk", price: 0.5 },
          { name: "Honey", price: 0.25 },
          { name: "Lemon", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
          { name: "No Sugar", price: 0 },
        ],
      },
      {
        name: "Croissant",
        description: "Buttery, flaky French pastry",
        basePrice: 3.5,
        category: "pastry",
        available: true,
        sizes: [{ name: "Regular", priceModifier: 0 }],
        customizations: [
          { name: "Butter", price: 0 },
          { name: "Jam", price: 0.5 },
        ],
      },
      {
        name: "Blueberry Muffin",
        description: "Fresh baked muffin with blueberries",
        basePrice: 4.25,
        category: "pastry",
        available: true,
        sizes: [{ name: "Regular", priceModifier: 0 }],
        customizations: [
          { name: "Butter", price: 0 },
          { name: "Heated", price: 0 },
        ],
      },
    ];

    // Insert new menu items
    for (const item of menuItems) {
      await ctx.db.insert("menuItems", item);
    }

    return "Menu refreshed successfully with sugar options!";
  },
});

// Replace with 316 Food Truck's actual menu
export const loadRealMenu = mutation({
  args: {},
  handler: async (ctx) => {
    // Delete all existing menu items
    const existingItems = await ctx.db.query("menuItems").collect();
    for (const item of existingItems) {
      await ctx.db.delete(item._id);
    }

    const menuItems = [
      {
        name: "Latte",
        description: "Espresso with steamed milk and light foam",
        basePrice: 5.0,
        category: "coffee",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Cappuccino",
        description: "Espresso with steamed milk and thick foam",
        basePrice: 5.0,
        category: "coffee",
        image: "cappuccino.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Flat White",
        description: "Double shot espresso with steamed milk",
        basePrice: 5.0,
        category: "coffee",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Chai Latte",
        description: "Spiced tea blend with steamed milk",
        basePrice: 5.0,
        category: "coffee",
        image: "chailatte.png",
        available: true,
        sizes: [{ name: "Small", priceModifier: 0 }],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Hot Chocolate",
        description: "Rich chocolate drink with steamed milk",
        basePrice: 5.0,
        category: "coffee",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Mocha",
        description: "Espresso with chocolate and steamed milk",
        basePrice: 5.0,
        category: "coffee",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Iced Chocolate",
        description: "Cold chocolate drink with milk over ice",
        basePrice: 5.0,
        category: "iced",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Iced Latte",
        description: "Espresso with cold milk over ice",
        basePrice: 5.0,
        category: "iced",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 1.0 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Iced Coffee",
        description: "Cold brew coffee over ice",
        basePrice: 5.0,
        category: "iced",
        image: "latte.png",
        available: true,
        sizes: [
          { name: "Medium", priceModifier: 0 },
          { name: "Large", priceModifier: 0.5 },
        ],
        customizations: [
          { name: "Skim Milk", price: 0.5 },
          { name: "Almond Milk", price: 0.5 },
          { name: "Oat Milk", price: 0.5 },
          { name: "Lactose Free Milk", price: 0.5 },
          { name: "Soy Milk", price: 0.5 },
          { name: "Hazelnut Syrup", price: 0.5 },
          { name: "Caramel Syrup", price: 0.5 },
          { name: "Vanilla Syrup", price: 0.5 },
          { name: "No Sugar", price: 0 },
          { name: "1 Sugar", price: 0 },
          { name: "2 Sugars", price: 0 },
          { name: "3 Sugars", price: 0 },
        ],
      },
      {
        name: "Bacon and Egg Roll",
        description: "Fresh bacon and egg on a soft roll",
        basePrice: 8.5,
        category: "food",
        image: "latte.png",
        available: true,
        sizes: [{ name: "Regular", priceModifier: 0 }],
        customizations: [],
      },
    ];

    // Insert new menu items
    for (const item of menuItems) {
      await ctx.db.insert("menuItems", item);
    }

    return "316 Food Truck menu loaded successfully!";
  },
});

// Update menu item image
export const updateMenuItemImage = mutation({
  args: {
    itemName: v.string(),
    imageName: v.string(),
  },
  handler: async (ctx, args) => {
    // Find the menu item by name
    const menuItem = await ctx.db
      .query("menuItems")
      .filter((q) => q.eq(q.field("name"), args.itemName))
      .first();

    if (!menuItem) {
      throw new Error(`Menu item "${args.itemName}" not found`);
    }

    // Update the image field
    await ctx.db.patch(menuItem._id, {
      image: args.imageName,
    });

    return `Updated ${args.itemName} image to ${args.imageName}`;
  },
});

// Add sugar options to all hot coffee items that don't have them
export const addSugarOptionsToHotCoffee = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const sugarOptions = [
      { name: "No Sugar", price: 0 },
      { name: "1 Sugar", price: 0 },
      { name: "2 Sugars", price: 0 },
      { name: "3 Sugars", price: 0 },
    ];

    // Get all coffee category items (hot coffee items)
    const coffeeItems = await ctx.db
      .query("menuItems")
      .filter((q) => q.eq(q.field("category"), "coffee"))
      .collect();

    let updatedCount = 0;

    for (const item of coffeeItems) {
      // Check if the item already has sugar options
      const hasSugarOptions = item.customizations.some((customization: any) =>
        customization.name.includes("Sugar")
      );

      if (!hasSugarOptions) {
        // Add sugar options to the existing customizations
        const updatedCustomizations = [...item.customizations, ...sugarOptions];

        await ctx.db.patch(item._id, {
          customizations: updatedCustomizations,
        });

        updatedCount++;
      }
    }

    return `Added sugar options to ${updatedCount} hot coffee items`;
  },
});

// Helper function to check if user has staff or admin role
async function requireStaffOrAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Must be logged in");
  }

  const userRoles = await ctx.db
    .query("userRoles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .collect();

  const hasStaffRole = userRoles.some(
    (role: any) => role.role === "staff" || role.role === "admin"
  );

  if (!hasStaffRole) {
    throw new Error("Only staff or admin users can perform this action");
  }

  return userId;
}

// Validators for menu item fields
const sizeValidator = v.object({
  name: v.string(),
  priceModifier: v.number(),
});

const customizationValidator = v.object({
  name: v.string(),
  price: v.number(),
  category: v.optional(v.string()), // "milk", "syrup", "sugar", "extras", "addons"
});

// Get all menu items (including unavailable) for admin management
export const getAllMenuItemsAdmin = query({
  args: {},
  returns: v.array(
    v.object({
      _id: v.id("menuItems"),
      _creationTime: v.number(),
      name: v.string(),
      description: v.string(),
      basePrice: v.number(),
      category: v.string(),
      image: v.optional(v.string()),
      imageId: v.optional(v.id("_storage")),
      available: v.boolean(),
      sizes: v.array(sizeValidator),
      customizations: v.array(customizationValidator),
    })
  ),
  handler: async (ctx) => {
    // Check user is staff/admin
    await requireStaffOrAdmin(ctx);

    const items = await ctx.db.query("menuItems").collect();
    return items;
  },
});

// Add a new menu item (staff/admin only)
export const addMenuItem = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    basePrice: v.number(),
    category: v.string(),
    image: v.optional(v.string()), // Legacy: filename
    imageId: v.optional(v.id("_storage")), // New: storage ID
    available: v.boolean(),
    sizes: v.array(sizeValidator),
    customizations: v.array(customizationValidator),
  },
  returns: v.id("menuItems"),
  handler: async (ctx, args) => {
    // Check user is staff/admin
    await requireStaffOrAdmin(ctx);

    const menuItemId = await ctx.db.insert("menuItems", {
      name: args.name,
      description: args.description,
      basePrice: args.basePrice,
      category: args.category,
      image: args.image,
      imageId: args.imageId,
      available: args.available,
      sizes: args.sizes,
      customizations: args.customizations,
    });

    return menuItemId;
  },
});

// Update an existing menu item (staff/admin only)
export const updateMenuItem = mutation({
  args: {
    id: v.id("menuItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    basePrice: v.optional(v.number()),
    category: v.optional(v.string()),
    image: v.optional(v.string()), // Legacy: filename
    imageId: v.optional(v.id("_storage")), // New: storage ID
    removeImage: v.optional(v.boolean()), // Flag to remove the image
    available: v.optional(v.boolean()),
    sizes: v.optional(v.array(sizeValidator)),
    customizations: v.optional(v.array(customizationValidator)),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    // Check user is staff/admin
    await requireStaffOrAdmin(ctx);

    const { id, removeImage, ...updates } = args;

    // Get existing item to verify it exists
    const existingItem = await ctx.db.get(id);
    if (!existingItem) {
      throw new Error("Menu item not found");
    }

    // If removing image, we need to use replace() since patch() ignores undefined values
    if (removeImage) {
      // Delete the old file from storage
      if (existingItem.imageId) {
        await ctx.storage.delete(existingItem.imageId);
      }

      // Build the full replacement document without image fields
      const {
        _id,
        _creationTime,
        image: _oldImage,
        imageId: _oldImageId,
        ...restOfItem
      } = existingItem;

      await ctx.db.replace(id, {
        ...restOfItem,
        // Apply any other updates
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.basePrice !== undefined && {
          basePrice: updates.basePrice,
        }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.available !== undefined && {
          available: updates.available,
        }),
        ...(updates.sizes !== undefined && { sizes: updates.sizes }),
        ...(updates.customizations !== undefined && {
          customizations: updates.customizations,
        }),
      });
    } else {
      // Build update object with only provided fields
      const updateFields: Record<string, any> = {};
      if (updates.name !== undefined) updateFields.name = updates.name;
      if (updates.description !== undefined)
        updateFields.description = updates.description;
      if (updates.basePrice !== undefined)
        updateFields.basePrice = updates.basePrice;
      if (updates.category !== undefined)
        updateFields.category = updates.category;
      if (updates.image !== undefined) updateFields.image = updates.image;
      if (updates.imageId !== undefined) updateFields.imageId = updates.imageId;
      if (updates.available !== undefined)
        updateFields.available = updates.available;
      if (updates.sizes !== undefined) updateFields.sizes = updates.sizes;
      if (updates.customizations !== undefined)
        updateFields.customizations = updates.customizations;

      await ctx.db.patch(id, updateFields);
    }

    return null;
  },
});
