// Example of the enhanced data structure available in your Brevo email templates
// This shows how metadata is preserved and accessible

const exampleOrderData = {
  // ... other order fields
  items: [
    {
      id: "item_123",
      title: "Custom T-Shirt",
      quantity: 2,
      unit_price: 2500, // in cents
      price: "$25.00 USD", // formatted price
      discounted_price: "$22.50 USD", // formatted discounted price
      
      // ✅ ITEM-LEVEL METADATA - Your custom data is preserved here!
      metadata: {
        gift_message: "Happy Birthday! Love, Mom",
        special_instructions: "Please use eco-friendly packaging",
        custom_engraving: "John & Jane 2024",
        personalization: "Embroidered initials: J.D.",
        promotional_code: "SUMMER2024",
        custom_field_1: "Any custom value you store",
        custom_field_2: { nested: "objects work too" }
      },
      
      // Quick access to pricing metadata
      price_attributes: {
        bulk_discount: true,
        custom_price: true,
        discount_applied: 10
      },
      
      variant: {
        id: "variant_456",
        title: "Large / Blue",
        
        // ✅ VARIANT-LEVEL METADATA - Custom variant options preserved!
        metadata: {
          size: "Large",
          color: "Royal Blue",
          material: "100% Organic Cotton",
          custom_options: {
            sleeve_length: "Short",
            fit: "Regular",
            print_location: "Front Center"
          },
          price_attributes: {
            size_upcharge: 200, // $2.00 upcharge for large
            color_premium: 150  // $1.50 premium for royal blue
          }
        },
        
        // Quick access to variant pricing metadata
        price_attributes: {
          size_upcharge: 200,
          color_premium: 150
        },
        
        product: {
          id: "product_789",
          title: "Custom T-Shirt",
          description: "High-quality custom t-shirt with personalization options",
          
          // ✅ PRODUCT-LEVEL METADATA - Brand, specs, care instructions preserved!
          metadata: {
            brand: "EcoWear",
            category: "Apparel",
            subcategory: "T-Shirts",
            specifications: {
              weight: "180gsm",
              fabric: "100% Organic Cotton",
              origin: "Made in USA",
              certifications: ["GOTS Certified", "Fair Trade"]
            },
            care_instructions: "Machine wash cold, tumble dry low, do not bleach",
            warranty: "30-day satisfaction guarantee",
            sustainability: {
              eco_friendly: true,
              carbon_neutral: true,
              recyclable_packaging: true
            },
            custom_product_fields: {
              designer: "Jane Smith",
              collection: "Summer 2024",
              launch_date: "2024-06-01"
            }
          },
          
          // Product images array
          images: [
            { url: "https://example.com/tshirt-front.jpg" },
            { url: "https://example.com/tshirt-back.jpg" },
            { url: "https://example.com/tshirt-detail.jpg" }
          ],
          
          thumbnail: "https://example.com/tshirt-thumb.jpg",
          
          profiles: [
            { id: "profile_1", name: "default" }
          ]
        }
      },
      
      // Financial adjustments preserved
      adjustments: [
        { id: "adj_1", amount: -250, description: "Bulk discount" }
      ],
      
      // Tax information preserved
      tax_lines: [
        { id: "tax_1", rate: 0.08, name: "Sales Tax" }
      ],
      
      // Calculated totals
      totals: {
        total: 4500,        // $45.00 total for this item
        original_total: 5000, // $50.00 before discounts
        subtotal: 4200      // $42.00 subtotal
      }
    }
  ],
  
  // Order-level metadata also preserved
  metadata: {
    delivery_instructions: "Leave at front door",
    gift_order: true,
    promotional_campaign: "summer_sale_2024",
    customer_notes: "First time customer",
    referral_source: "instagram_ad"
  }
};

// ✅ HOW TO USE IN YOUR BREVO TEMPLATES:

console.log("Examples of accessing metadata in Brevo templates:");
console.log("");

console.log("1. Item custom fields:");
console.log("   {{items.0.metadata.gift_message}}");
console.log("   {{items.0.metadata.custom_engraving}}");
console.log("");

console.log("2. Variant custom options:");
console.log("   {{items.0.variant.metadata.size}}");
console.log("   {{items.0.variant.metadata.color}}");
console.log("   {{items.0.variant.metadata.custom_options.sleeve_length}}");
console.log("");

console.log("3. Product specifications:");
console.log("   {{items.0.variant.product.metadata.brand}}");
console.log("   {{items.0.variant.product.metadata.specifications.fabric}}");
console.log("   {{items.0.variant.product.metadata.care_instructions}}");
console.log("");

console.log("4. Pricing metadata:");
console.log("   {{items.0.price_attributes.bulk_discount}}");
console.log("   {{items.0.variant.price_attributes.size_upcharge}}");
console.log("");

console.log("5. Order-level custom data:");
console.log("   {{metadata.delivery_instructions}}");
console.log("   {{metadata.gift_order}}");

export default exampleOrderData;