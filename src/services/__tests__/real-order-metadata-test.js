import BrevoService from '../brevo.js';

// Sanitized order data for testing
const realOrderData = {
  "id": "order_01K143KKEB35G1APD2C46VHYTZ",
  "created_at": "2025-07-26T19:33:24.515Z",
  "updated_at": "2025-07-26T19:33:26.952Z",
  "status": "pending",
  "fulfillment_status": "not_fulfilled",
  "payment_status": "awaiting",
  "display_id": 82,
  "cart_id": "cart_01K143K44ERY1JER7YFSQMX2PZ",
  "customer_id": "cus_01HYHRX2CAJNCQGC40G567441F",
  "email": "[email]",
  "region_id": "reg_01HVEZ8MW2AQZD5YHC84DNJE1N",
  "currency_code": "eur",
  "tax_rate": null,
  "draft_order_id": null,
  "canceled_at": null,
  "metadata": {
    "isPickup": false,
    "detailed_status": "Processing",
    "formattedPrices": {
      "total": "55,00 €",
      "tax_total": "9,17 €",
      "shipping_total": "0,00 €"
    }
  },
  "no_notification": null,
  "sales_channel_id": "sc_01HVEYW51YHHA9XPEK9KP4PWWQ",
  "billing_address": {
    "id": "addr_01K143KDBTKTG3P2XHWSHS5QN6",
    "created_at": "2025-07-26T19:33:18.300Z",
    "updated_at": "2025-07-26T19:33:18.300Z",
    "deleted_at": null,
    "customer_id": null,
    "company": "[company]",
    "first_name": "[first_name]",
    "last_name": "[last_name]",
    "address_1": "[address]",
    "address_2": "",
    "city": "[city]",
    "country_code": "at",
    "province": null,
    "postal_code": "[postal_code]",
    "phone": "[phone]",
    "metadata": {
      "company_uid": "[company_uid]"
    }
  },
  "customer": {
    "id": "cus_01HYHRX2CAJNCQGC40G567441F",
    "created_at": "2024-05-23T03:46:16.787Z",
    "updated_at": "2024-05-24T04:27:52.840Z",
    "deleted_at": null,
    "email": "[email]",
    "first_name": null,
    "last_name": null,
    "billing_address_id": null,
    "phone": null,
    "has_account": false,
    "metadata": {
      "stripe_id": "[stripe_id]"
    }
  },
  "discounts": [],
  "fulfillments": [],
  "gift_card_transactions": [],
  "gift_cards": [],
  "items": [
    {
      "id": "item_01K143K47YDQ4AVCFNSR5TGWSF",
      "created_at": "2025-07-26T19:33:08.989Z",
      "updated_at": "2025-07-26T19:33:24.515Z",
      "cart_id": "cart_01K143K44ERY1JER7YFSQMX2PZ",
      "order_id": "order_01K143KKEB35G1APD2C46VHYTZ",
      "swap_id": null,
      "claim_order_id": null,
      "original_item_id": null,
      "order_edit_id": null,
      "title": "Safety Glass – Secure. Strong. Transparent",
      "description": "STANDARD",
      "thumbnail": "https://example.com/image.jpg",
      "is_return": false,
      "is_giftcard": false,
      "should_merge": true,
      "allow_discounts": true,
      "has_shipping": true,
      "unit_price": 5500,
      "variant_id": "variant_01J9DRBM9S2G6B27VYN9668XA5",
      "quantity": 1,
      "fulfilled_quantity": null,
      "returned_quantity": null,
      "shipped_quantity": null,
      "metadata": {
        "formattedPrice": "55,00 €",
        "price_attributes": {
          "area": 1,
          "info": {
            "width": 1000,
            "height": 1000,
            "ral_code": "222",
            "sketchFile": "https://example.com/sketch.svg"
          },
          "shape": "square",
          "hole_5_30": null,
          "perimeter": 4,
          "thickness": "4mm",
          "BASE_PRICE": 5500,
          "glass_type": "ral_farbe",
          "hole_32_40": null,
          "hole_45_64": null,
          "hole_65_80": null,
          "hole_hinge": null,
          "shape_price": 0,
          "fine_corners": "no",
          "easy_to_clean": "no",
          "express_delivery": "no"
        }
      },
      "includes_tax": true,
      "adjustments": [],
      "tax_lines": [
        {
          "id": "litl_01K143KKAR0G02JPBQZD159JNB",
          "created_at": "2025-07-26T19:33:24.428Z",
          "updated_at": "2025-07-26T19:33:24.515Z",
          "rate": 20,
          "name": "default",
          "code": "default",
          "metadata": null,
          "item_id": "item_01K143K47YDQ4AVCFNSR5TGWSF"
        }
      ],
      "variant": {
        "id": "variant_01J9DRBM9S2G6B27VYN9668XA5",
        "created_at": "2024-10-05T07:12:29.482Z",
        "updated_at": "2025-07-26T19:33:24.515Z",
        "deleted_at": null,
        "title": "STANDARD",
        "product_id": "prod_01HXY9VEPEPPWFEAAAET8D8510",
        "sku": null,
        "barcode": null,
        "ean": null,
        "upc": null,
        "variant_rank": 0,
        "inventory_quantity": 99997,
        "allow_backorder": false,
        "manage_inventory": false,
        "hs_code": null,
        "origin_country": null,
        "mid_code": null,
        "material": null,
        "weight": null,
        "length": null,
        "height": null,
        "width": null,
        "metadata": {
          "price_attributes": [
            {
              "name": "thickness",
              "type": "switch",
              "options": [
                {
                  "name": "4mm",
                  "metadata": {
                    "name": "4mm"
                  }
                },
                {
                  "name": "6mm",
                  "metadata": {
                    "name": "6mm"
                  }
                }
              ]
            },
            {
              "name": "shape",
              "type": "switch",
              "options": [
                {
                  "name": "square",
                  "metadata": {
                    "name": "Rectangle (no extra charge)",
                    "image": "https://example.com/square.svg",
                    "price": 0
                  }
                },
                {
                  "name": "circle",
                  "metadata": {
                    "name": "plus 50% on base price",
                    "image": "https://example.com/circle.svg",
                    "price": 0.5
                  }
                }
              ]
            },
            {
              "name": "glass_type",
              "type": "switch",
              "options": [
                {
                  "name": "klar",
                  "metadata": {
                    "name": "Standard (clear)",
                    "image": "https://example.com/clear-glass.jpg"
                  }
                },
                {
                  "name": "ral_farbe",
                  "metadata": {
                    "name": "RAL Color Coating",
                    "image": "https://example.com/ral-coating.jpg",
                    "description": "Note: one side will be coated."
                  }
                }
              ]
            }
          ],
          "price_calculation_rule_id": "pcrule_01JVXWWB0XQPH833J651J02SDE"
        },
        "thumbnail": null,
        "product": {
          "id": "prod_01HXY9VEPEPPWFEAAAET8D8510",
          "created_at": "2024-05-15T14:17:42.280Z",
          "updated_at": "2024-10-05T06:49:55.831Z",
          "deleted_at": null,
          "title": "Safety Glass – Secure. Strong. Transparent",
          "subtitle": "Safety Glass",
          "description": "Our safety glass combines unparalleled security with stunning clarity.",
          "handle": "safety-glass",
          "is_giftcard": false,
          "status": "published",
          "thumbnail": "https://example.com/product-image.jpg",
          "weight": null,
          "length": null,
          "height": null,
          "width": null,
          "hs_code": null,
          "origin_country": null,
          "mid_code": null,
          "material": "1000",
          "collection_id": "pcol_01HZYAE96AA4E16XM7W8VZ3060",
          "type_id": "ptyp_01J2ZH6HNZ5BNV1AF75DMPYSQ8",
          "discountable": true,
          "external_id": null,
          "metadata": {
            "vat_info": "inkl. 20% MwSt.",
            "price_info": "per m² from €59,40",
            "bullet_points": [
              "Maximum Safety",
              "Versatile Use",
              "Environmentally Friendly",
              "Thermal Resistance"
            ],
            "delivery_info": "Delivery time: approx. 14 working days after payment",
            "shipping_info": "plus shipping costs",
            "extra_description": "Safety glass combines maximum security with a modern, clear design."
          },
          "profiles": [
            {
              "id": "sp_01HVEYW3NBT65CMCQRJD207TVN",
              "created_at": "2024-04-14T18:45:49.043Z",
              "updated_at": "2024-04-14T18:45:49.043Z",
              "deleted_at": null,
              "name": "Default Shipping Profile",
              "type": "default",
              "metadata": null
            }
          ]
        }
      },
      "refundable": 5500,
      "subtotal": 4583,
      "discount_total": 0,
      "total": 5500,
      "original_total": 5500,
      "original_tax_total": 917,
      "tax_total": 917
    }
  ],
  "region": {
    "id": "reg_01HVEZ8MW2AQZD5YHC84DNJE1N",
    "currency_code": "eur",
    "tax_rate": 20,
    "includes_tax": true
  },
  "subtotal": 4583,
  "discount_total": 0,
  "shipping_total": 0,
  "tax_total": 917,
  "total": 5500
};

// Mock dependencies
const mockOrderService = {
  retrieve: jest.fn()
};

const mockTotalsService = {
  getLineItemTotals: jest.fn()
};

const mockCartService = {
  retrieve: jest.fn()
};

describe('BrevoService - Real Order Metadata Preservation Test', () => {
  let brevoService;

  beforeEach(() => {
    brevoService = new BrevoService(
      {
        manager: {},
        orderRepository: {},
        cartRepository: {},
        lineItemRepository: {},
        orderService: mockOrderService,
        cartService: mockCartService,
        fulfillmentService: {},
        totalsService: mockTotalsService,
        giftCardService: {}
      },
      {
        api_key: 'test-key',
        from_email: 'test@example.com',
        from_name: 'Test'
      }
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Real Glass Order Processing', () => {
    it('should preserve all glass customization metadata from your real order', async () => {
      // Mock cart context
      const mockCart = {
        id: 'cart_01K143K44ERY1JER7YFSQMX2PZ',
        context: {
          locale: 'de-AT',
          countryCode: 'AT'
        }
      };

      // Mock totals calculation
      const mockTotals = {
        total: 5500,
        original_total: 5500,
        subtotal: 4583
      };

      // Setup mocks
      mockOrderService.retrieve.mockResolvedValue(realOrderData);
      mockCartService.retrieve.mockResolvedValue(mockCart);
      mockTotalsService.getLineItemTotals.mockResolvedValue(mockTotals);

      // Execute the method
      const result = await brevoService.orderPlacedData({ id: 'order_01K143KKEB35G1APD2C46VHYTZ' });

      // Verify that the order-level metadata is preserved
      expect(result.metadata).toEqual({
        "isPickup": false,
        "detailed_status": "Processing",
        "formattedPrices": {
          "total": "55,00 €",
          "tax_total": "9,17 €",
          "shipping_total": "0,00 €"
        }
      });

      // Get the processed item
      const processedItem = result.items[0];

      // ✅ TEST 1: Item-level glass customization metadata is preserved
      expect(processedItem.metadata).toBeDefined();
      expect(processedItem.metadata.formattedPrice).toBe("55,00 €");

      // Test the complex price_attributes with glass specifications
      expect(processedItem.metadata.price_attributes).toEqual({
        "area": 1,
        "info": {
          "width": 1000,
          "height": 1000,
          "ral_code": "222",
          "sketchFile": "https://#"
        },
        "shape": "square",
        "hole_5_30": null,
        "perimeter": 4,
        "thickness": "4mm",
        "BASE_PRICE": 5500,
        "glass_type": "ral_farbe",
        "hole_32_40": null,
        "hole_45_64": null,
        "hole_65_80": null,
        "hole_hinge": null,
        "shape_price": 0,
        "fine_corners": "no",
        "easy_to_clean": "no",
        "express_delivery": "no"
      });

      // Test quick access to price_attributes
      expect(processedItem.price_attributes).toEqual(processedItem.metadata.price_attributes);

      // ✅ TEST 2: Variant-level glass configuration metadata is preserved
      expect(processedItem.variant).toBeDefined();
      expect(processedItem.variant.metadata).toBeDefined();
      expect(processedItem.variant.metadata.price_attributes).toBeDefined();
      expect(Array.isArray(processedItem.variant.metadata.price_attributes)).toBe(true);

      // Test specific glass configuration options
      const thicknessConfig = processedItem.variant.metadata.price_attributes.find(attr => attr.name === 'thickness');
      expect(thicknessConfig).toBeDefined();
      expect(thicknessConfig.type).toBe('switch');
      expect(thicknessConfig.options).toContainEqual({
        "name": "4mm",
        "metadata": {
          "name": "4mm"
        }
      });

      const shapeConfig = processedItem.variant.metadata.price_attributes.find(attr => attr.name === 'shape');
      expect(shapeConfig).toBeDefined();
      expect(shapeConfig.options).toContainEqual({
        "name": "square",
        "metadata": {
          "name": "Rectangle (no extra charge)",
          "image": "https://example.com/square.svg",
          "price": 0
        }
      });

      const glassTypeConfig = processedItem.variant.metadata.price_attributes.find(attr => attr.name === 'glass_type');
      expect(glassTypeConfig).toBeDefined();
      expect(glassTypeConfig.options).toContainEqual({
        "name": "ral_farbe",
        "metadata": {
          "name": "RAL Color Coating",
          "image": "https://example.com/ral-coating.jpg",
          "description": "Note: one side will be coated."
        }
      });

      // ✅ TEST 3: Product-level glass information metadata is preserved
      expect(processedItem.variant.product).toBeDefined();
      expect(processedItem.variant.product.metadata).toEqual({
        "vat_info": "inkl. 20% MwSt.",
        "price_info": "m² ab €59,40",
        "bullet_points": [
          "Maximum Safety",
          "Versatile Use",
          "Environmentally Friendly",
          "Thermal Resistance"
        ],
        "delivery_info": "Delivery time: approx. 14 working days after payment",
        "shipping_info": "plus shipping costs",
        "extra_description": "Safety glass combines maximum security with a modern, clear design."
      });

      // ✅ TEST 4: Product description and images are preserved
      expect(processedItem.variant.product.description).toBe("Our safety glass combines unparalleled security with stunning clarity.");
      expect(processedItem.variant.product.thumbnail).toBe("https://example.com/product-image.jpg");
      expect(processedItem.variant.product.profiles).toHaveLength(1);
      expect(processedItem.variant.product.profiles[0].name).toBe("Default Shipping Profile");

      // ✅ TEST 5: Tax lines and financial data are preserved
      expect(processedItem.tax_lines).toHaveLength(1);
      expect(processedItem.tax_lines[0]).toEqual({
        "id": "litl_01K143KKAR0G02JPBQZD159JNB",
        "created_at": "2025-07-26T19:33:24.428Z",
        "updated_at": "2025-07-26T19:33:24.515Z",
        "rate": 20,
        "name": "default",
        "code": "default",
        "metadata": null,
        "item_id": "item_01K143K47YDQ4AVCFNSR5TGWSF"
      });

      // ✅ TEST 6: Calculated fields are added while preserving original data
      expect(processedItem.totals).toEqual(mockTotals);
      expect(processedItem.discounted_price).toBeDefined();
      expect(processedItem.price).toBeDefined();
      expect(processedItem.thumbnail).toBe("https://example.com/product-image.jpg");

      // ✅ TEST 7: All original item fields are preserved
      expect(processedItem.id).toBe("item_01K143K47YDQ4AVCFNSR5TGWSF");
      expect(processedItem.title).toBe("Safety Glass – Secure. Strong. Transparent");
      expect(processedItem.description).toBe("STANDARD");
      expect(processedItem.unit_price).toBe(5500);
      expect(processedItem.quantity).toBe(1);
    });

    it('should make glass customization data easily accessible in email templates', async () => {
      // Mock setup (same as above)
      const mockCart = { id: 'cart_01K143K44ERY1JER7YFSQMX2PZ', context: { locale: 'de-AT', countryCode: 'AT' } };
      const mockTotals = { total: 5500, original_total: 5500, subtotal: 4583 };

      mockOrderService.retrieve.mockResolvedValue(realOrderData);
      mockCartService.retrieve.mockResolvedValue(mockCart);
      mockTotalsService.getLineItemTotals.mockResolvedValue(mockTotals);

      const result = await brevoService.orderPlacedData({ id: 'order_01K143KKEB35G1APD2C46VHYTZ' });
      const item = result.items[0];

      // Test template accessibility for glass customization
      console.log('\n🔍 Glass Customization Data Available in Email Templates:');

      console.log('\n📏 Glass Dimensions:');
      console.log(`  Width: ${item.metadata.price_attributes.info.width}mm`);
      console.log(`  Height: ${item.metadata.price_attributes.info.height}mm`);
      console.log(`  Area: ${item.metadata.price_attributes.area}m²`);
      console.log(`  Thickness: ${item.metadata.price_attributes.thickness}`);

      console.log('\n🎨 Glass Specifications:');
      console.log(`  Shape: ${item.metadata.price_attributes.shape}`);
      console.log(`  Glass Type: ${item.metadata.price_attributes.glass_type}`);
      console.log(`  RAL Code: ${item.metadata.price_attributes.info.ral_code}`);
      console.log(`  Fine Corners: ${item.metadata.price_attributes.fine_corners}`);
      console.log(`  Easy to Clean: ${item.metadata.price_attributes.easy_to_clean}`);

      console.log('\n🖼️ Custom Design:');
      console.log(`  Sketch File: ${item.metadata.price_attributes.info.sketchFile}`);

      console.log('\n💰 Pricing Information:');
      console.log(`  Base Price: €${(item.metadata.price_attributes.BASE_PRICE / 100).toFixed(2)}`);
      console.log(`  Formatted Price: ${item.metadata.formattedPrice}`);

      console.log('\n📦 Product Details:');
      console.log(`  VAT Info: ${item.variant.product.metadata.vat_info}`);
      console.log(`  Price Info: ${item.variant.product.metadata.price_info}`);
      console.log(`  Delivery Info: ${item.variant.product.metadata.delivery_info}`);
      console.log(`  Bullet Points: ${item.variant.product.metadata.bullet_points.join(', ')}`);

      // Verify all this data is accessible
      expect(item.metadata.price_attributes.info.width).toBe(1000);
      expect(item.metadata.price_attributes.info.height).toBe(1000);
      expect(item.metadata.price_attributes.thickness).toBe("4mm");
      expect(item.metadata.price_attributes.glass_type).toBe("ral_farbe");
      expect(item.metadata.price_attributes.info.ral_code).toBe("222");
      expect(item.variant.product.metadata.bullet_points).toContain("Maximum Safety");
    });
  });
});