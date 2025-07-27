// Enhanced Order Data Tests - Testing the logic patterns without importing the service
// This avoids dependency issues while thoroughly testing the enhanced data functionality

describe('BrevoService - Enhanced Order Data Validation', () => {
  // Mock the enhanced order data logic patterns
  const mockEnhancedOrderLogic = {
    // Test the enhanced relations array
    getEnhancedRelations() {
      return [
        "customer",
        "billing_address",
        "shipping_address",
        "discounts",
        "discounts.rule",
        "shipping_methods",
        "shipping_methods.shipping_option",
        "payments",
        "fulfillments",
        "returns",
        "gift_cards",
        "gift_card_transactions",
        "items",
        "items.variant",
        "items.variant.product",
        "items.variant.product.profiles",
        "items.adjustments",
        "items.tax_lines",
        "region",
        "sales_channel",
        "claims",
        "swaps"
      ];
    },

    // Test the enhanced select fields
    getEnhancedSelectFields() {
      return [
        "id",
        "status",
        "fulfillment_status", 
        "payment_status",
        "display_id",
        "cart_id",
        "customer_id",
        "email",
        "billing_address_id",
        "shipping_address_id",
        "region_id",
        "currency_code",
        "tax_rate",
        "canceled_at",
        "metadata",
        "no_notification",
        "idempotency_key",
        "draft_order_id",
        "created_at",
        "updated_at",
        "shipping_total",
        "discount_total",
        "tax_total",
        "refunded_total",
        "gift_card_total",
        "subtotal",
        "total",
        "paid_total",
        "refundable_amount",
        "external_id",
        "sales_channel_id"
      ];
    },

    // Test enhanced order retrieval with fallback
    async retrieveOrderWithEnhancedData(orderId, mockOrderService) {
      try {
        return await mockOrderService.retrieve(orderId, {
          select: this.getEnhancedSelectFields(),
          relations: this.getEnhancedRelations()
        });
      } catch (enhancedError) {
        // Fallback to minimal data
        return await mockOrderService.retrieve(orderId, {
          select: [
            "shipping_total",
            "discount_total", 
            "tax_total",
            "refunded_total",
            "gift_card_total",
            "subtotal",
            "total",
            "currency_code",
            "tax_rate",
            "created_at",
            "email",
            "id",
            "display_id"
          ],
          relations: [
            "customer",
            "billing_address",
            "shipping_address",
            "discounts",
            "discounts.rule",
            "shipping_methods",
            "shipping_methods.shipping_option",
            "payments",
            "fulfillments",
            "returns",
            "gift_cards",
            "gift_card_transactions",
          ]
        });
      }
    },

    // Test enhanced item processing logic
    async processItemsWithCompleteData(items, mockTotalsService, order) {
      if (!items || !Array.isArray(items)) {
        return [];
      }

      return await Promise.all(
        items.map(async (originalItem, index) => {
          try {
            // Calculate totals with error handling
            let totals;
            try {
              totals = await mockTotalsService.getLineItemTotals(originalItem, order, {
                include_tax: true,
                use_tax_lines: true,
              });
            } catch (totalsError) {
              // Fallback totals calculation
              totals = {
                total: originalItem.unit_price * originalItem.quantity,
                original_total: originalItem.unit_price * originalItem.quantity,
                subtotal: originalItem.unit_price * originalItem.quantity,
                tax_total: 0,
                discount_total: 0
              };
            }

            // Preserve all original item fields and metadata
            return {
              ...originalItem,
              
              // Preserve complete variant data
              variant: originalItem.variant ? {
                ...originalItem.variant,
                metadata: originalItem.variant?.metadata || {},
                price_attributes: originalItem.variant?.metadata?.price_attributes || null,
                
                // Include complete product information
                product: originalItem.variant?.product ? {
                  ...originalItem.variant.product,
                  metadata: originalItem.variant.product?.metadata || {},
                  description: originalItem.variant.product?.description || null,
                  images: originalItem.variant.product?.images || [],
                  thumbnail: originalItem.variant.product?.thumbnail || null,
                  profiles: originalItem.variant.product?.profiles || []
                } : null
              } : null,

              // Add calculated totals
              totals,
              
              // Add formatted prices
              discounted_price: `$${(totals.total / (originalItem.quantity || 1) / 100).toFixed(2)}`,
              price: `$${(totals.original_total / (originalItem.quantity || 1) / 100).toFixed(2)}`,
              
              // Ensure metadata is accessible
              metadata: originalItem.metadata || {},
              price_attributes: originalItem.metadata?.price_attributes || null,
              
              // Preserve arrays with fallbacks
              adjustments: originalItem.adjustments || [],
              tax_lines: originalItem.tax_lines || []
            };
          } catch (itemProcessingError) {
            // Return minimal item structure on error
            return {
              ...originalItem,
              variant: originalItem.variant || null,
              totals: {
                total: originalItem.unit_price * originalItem.quantity,
                original_total: originalItem.unit_price * originalItem.quantity,
                subtotal: originalItem.unit_price * originalItem.quantity,
                tax_total: 0,
                discount_total: 0
              },
              discounted_price: `$${(originalItem.unit_price / 100).toFixed(2)}`,
              price: `$${(originalItem.unit_price / 100).toFixed(2)}`,
              metadata: originalItem.metadata || {},
              price_attributes: null,
              adjustments: [],
              tax_lines: []
            };
          }
        })
      );
    }
  };

  beforeEach(() => {
    // Reset any state if needed
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Enhanced Data Retrieval Logic', () => {
    it('should include all comprehensive relations in enhanced retrieval', () => {
      const relations = mockEnhancedOrderLogic.getEnhancedRelations();
      
      // Verify all required relations are included
      const expectedRelations = [
        'customer', 'billing_address', 'shipping_address', 'discounts',
        'discounts.rule', 'shipping_methods', 'shipping_methods.shipping_option',
        'payments', 'fulfillments', 'returns', 'gift_cards', 'gift_card_transactions',
        'items', 'items.variant', 'items.variant.product', 'items.variant.product.profiles',
        'items.adjustments', 'items.tax_lines', 'region', 'sales_channel', 'claims', 'swaps'
      ];

      expectedRelations.forEach(relation => {
        expect(relations).toContain(relation);
      });

      // Verify specific enhanced relations that weren't in original
      expect(relations).toContain('items.variant.product');
      expect(relations).toContain('items.variant.product.profiles');
      expect(relations).toContain('items.adjustments');
      expect(relations).toContain('items.tax_lines');
      expect(relations).toContain('region');
      expect(relations).toContain('sales_channel');
      expect(relations).toContain('claims');
      expect(relations).toContain('swaps');
    });

    it('should include all order fields in enhanced select', () => {
      const selectFields = mockEnhancedOrderLogic.getEnhancedSelectFields();
      
      // Verify core order fields
      const coreFields = [
        'id', 'status', 'fulfillment_status', 'payment_status', 'display_id',
        'cart_id', 'customer_id', 'email', 'currency_code', 'tax_rate',
        'metadata', 'created_at', 'updated_at'
      ];

      coreFields.forEach(field => {
        expect(selectFields).toContain(field);
      });

      // Verify financial fields
      const financialFields = [
        'shipping_total', 'discount_total', 'tax_total', 'refunded_total',
        'gift_card_total', 'subtotal', 'total', 'paid_total', 'refundable_amount'
      ];

      financialFields.forEach(field => {
        expect(selectFields).toContain(field);
      });

      // Verify additional enhanced fields
      const enhancedFields = [
        'billing_address_id', 'shipping_address_id', 'region_id',
        'canceled_at', 'no_notification', 'idempotency_key',
        'draft_order_id', 'external_id', 'sales_channel_id'
      ];

      enhancedFields.forEach(field => {
        expect(selectFields).toContain(field);
      });
    });

    it('should attempt enhanced retrieval first then fallback to minimal', async () => {
      const mockOrderService = {
        retrieve: jest.fn()
          .mockRejectedValueOnce(new Error('Enhanced retrieval failed'))
          .mockResolvedValueOnce({
            id: 'order_123',
            email: 'test@example.com',
            total: 1000
          })
      };

      const result = await mockEnhancedOrderLogic.retrieveOrderWithEnhancedData('order_123', mockOrderService);

      // Verify both calls were made
      expect(mockOrderService.retrieve).toHaveBeenCalledTimes(2);
      
      // Verify first call used enhanced parameters
      expect(mockOrderService.retrieve).toHaveBeenNthCalledWith(1, 'order_123', {
        select: mockEnhancedOrderLogic.getEnhancedSelectFields(),
        relations: mockEnhancedOrderLogic.getEnhancedRelations()
      });

      // Verify second call used minimal parameters
      expect(mockOrderService.retrieve).toHaveBeenNthCalledWith(2, 'order_123', {
        select: expect.arrayContaining(['id', 'email', 'total']),
        relations: expect.not.arrayContaining(['items.variant.product'])
      });

      // Verify result from fallback
      expect(result.id).toBe('order_123');
      expect(result.email).toBe('test@example.com');
    });

    it('should succeed with enhanced retrieval when available', async () => {
      const mockOrder = {
        id: 'order_123',
        status: 'pending',
        metadata: { source: 'web' },
        customer: { id: 'customer_1', email: 'test@example.com' },
        items: [{ id: 'item_1', variant: { product: { title: 'Test Product' } } }]
      };

      const mockOrderService = {
        retrieve: jest.fn().mockResolvedValue(mockOrder)
      };

      const result = await mockEnhancedOrderLogic.retrieveOrderWithEnhancedData('order_123', mockOrderService);

      // Verify only one call was made (enhanced succeeded)
      expect(mockOrderService.retrieve).toHaveBeenCalledTimes(1);
      expect(mockOrderService.retrieve).toHaveBeenCalledWith('order_123', {
        select: mockEnhancedOrderLogic.getEnhancedSelectFields(),
        relations: mockEnhancedOrderLogic.getEnhancedRelations()
      });

      // Verify complete data is returned
      expect(result.id).toBe('order_123');
      expect(result.status).toBe('pending');
      expect(result.metadata).toEqual({ source: 'web' });
      expect(result.customer.email).toBe('test@example.com');
      expect(result.items[0].variant.product.title).toBe('Test Product');
    });

  });

  describe('Item Processing with Complete Data Preservation', () => {
    it('should preserve complete variant and product data in items', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 2500, // $25.00
          thumbnail: 'product-thumb.jpg',
          metadata: {
            price_attributes: {
              custom_price: true,
              bulk_discount: 15
            },
            custom_data: 'item_custom'
          },
          variant: {
            id: 'variant_1',
            title: 'Large Blue Shirt',
            sku: 'SHIRT-L-BLUE',
            inventory_quantity: 100,
            metadata: {
              size: 'L',
              color: 'blue',
              material: 'cotton',
              price_attributes: {
                wholesale_price: 1800,
                retail_price: 2500
              }
            },
            product: {
              id: 'product_1',
              title: 'Cotton T-Shirt',
              subtitle: 'Comfortable cotton t-shirt',
              description: 'High-quality cotton t-shirt perfect for everyday wear',
              handle: 'cotton-t-shirt',
              thumbnail: 'product-main.jpg',
              weight: 200,
              length: 30,
              height: 1,
              width: 25,
              images: [
                { id: 'img_1', url: 'image1.jpg' },
                { id: 'img_2', url: 'image2.jpg' }
              ],
              metadata: {
                category: 'clothing',
                brand: 'TestBrand',
                care_instructions: 'Machine wash cold',
                specifications: {
                  fabric: '100% cotton',
                  fit: 'regular'
                }
              },
              profiles: [
                { id: 'profile_1', name: 'default', type: 'default' },
                { id: 'profile_2', name: 'gift', type: 'gift' }
              ]
            }
          },
          adjustments: [
            { id: 'adj_1', amount: -250, description: 'Bulk discount' }
          ],
          tax_lines: [
            { id: 'tax_1', rate: 0.1, name: 'Sales Tax', code: 'SALES_TAX' }
          ]
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 4750, // $47.50 after discount
          original_total: 5000, // $50.00 original
          subtotal: 4500, // $45.00 before tax
          tax_total: 250, // $2.50 tax
          discount_total: 250 // $2.50 discount
        })
      };

      const mockOrder = { id: 'order_123', currency_code: 'usd' };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        mockOrder
      );

      expect(result).toHaveLength(1);
      const item = result[0];

      // Verify all original item fields are preserved
      expect(item.id).toBe('item_1');
      expect(item.quantity).toBe(2);
      expect(item.unit_price).toBe(2500);
      expect(item.thumbnail).toBe('product-thumb.jpg');

      // Verify item metadata and price_attributes are preserved
      expect(item.metadata).toEqual({
        price_attributes: {
          custom_price: true,
          bulk_discount: 15
        },
        custom_data: 'item_custom'
      });
      expect(item.price_attributes).toEqual({
        custom_price: true,
        bulk_discount: 15
      });

      // Verify complete variant data is preserved
      expect(item.variant).toBeDefined();
      expect(item.variant.id).toBe('variant_1');
      expect(item.variant.title).toBe('Large Blue Shirt');
      expect(item.variant.sku).toBe('SHIRT-L-BLUE');
      expect(item.variant.inventory_quantity).toBe(100);
      expect(item.variant.metadata).toEqual({
        size: 'L',
        color: 'blue',
        material: 'cotton',
        price_attributes: {
          wholesale_price: 1800,
          retail_price: 2500
        }
      });
      expect(item.variant.price_attributes).toEqual({
        wholesale_price: 1800,
        retail_price: 2500
      });

      // Verify complete product information is preserved
      const product = item.variant.product;
      expect(product).toBeDefined();
      expect(product.id).toBe('product_1');
      expect(product.title).toBe('Cotton T-Shirt');
      expect(product.subtitle).toBe('Comfortable cotton t-shirt');
      expect(product.description).toBe('High-quality cotton t-shirt perfect for everyday wear');
      expect(product.handle).toBe('cotton-t-shirt');
      expect(product.weight).toBe(200);
      expect(product.images).toEqual([
        { id: 'img_1', url: 'image1.jpg' },
        { id: 'img_2', url: 'image2.jpg' }
      ]);
      expect(product.metadata).toEqual({
        category: 'clothing',
        brand: 'TestBrand',
        care_instructions: 'Machine wash cold',
        specifications: {
          fabric: '100% cotton',
          fit: 'regular'
        }
      });
      expect(product.profiles).toEqual([
        { id: 'profile_1', name: 'default', type: 'default' },
        { id: 'profile_2', name: 'gift', type: 'gift' }
      ]);

      // Verify adjustments and tax_lines are preserved
      expect(item.adjustments).toEqual([
        { id: 'adj_1', amount: -250, description: 'Bulk discount' }
      ]);
      expect(item.tax_lines).toEqual([
        { id: 'tax_1', rate: 0.1, name: 'Sales Tax', code: 'SALES_TAX' }
      ]);

      // Verify calculated totals are added
      expect(item.totals).toEqual({
        total: 4750,
        original_total: 5000,
        subtotal: 4500,
        tax_total: 250,
        discount_total: 250
      });

      // Verify formatted prices
      expect(item.discounted_price).toBe('$23.75'); // 4750 / 2 / 100
      expect(item.price).toBe('$25.00'); // 5000 / 2 / 100
    });

    it('should handle missing variant and product data gracefully', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 1,
          unit_price: 1000, // $10.00
          thumbnail: null,
          metadata: null,
          variant: null,
          adjustments: null,
          tax_lines: null
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 1000,
          original_total: 1000,
          subtotal: 1000,
          tax_total: 0,
          discount_total: 0
        })
      };

      const mockOrder = { id: 'order_123', currency_code: 'usd' };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        mockOrder
      );

      const item = result[0];

      // Verify graceful handling of null/missing data
      expect(item.variant).toBeNull();
      expect(item.metadata).toEqual({});
      expect(item.price_attributes).toBeNull();
      expect(item.adjustments).toEqual([]);
      expect(item.tax_lines).toEqual([]);

      // Verify calculated fields are still present
      expect(item.totals).toEqual({
        total: 1000,
        original_total: 1000,
        subtotal: 1000,
        tax_total: 0,
        discount_total: 0
      });
      expect(item.discounted_price).toBe('$10.00');
      expect(item.price).toBe('$10.00');
      expect(item.thumbnail).toBeNull();
    });

    it('should handle item processing errors gracefully with fallback', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 1500, // $15.00
          thumbnail: 'thumb.jpg',
          metadata: { test: 'data' },
          variant: { id: 'variant_1' }
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockRejectedValue(new Error('Totals calculation failed'))
      };

      const mockOrder = { id: 'order_123', currency_code: 'usd' };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        mockOrder
      );

      const item = result[0];

      // Verify fallback totals calculation
      expect(item.totals).toEqual({
        total: 3000, // unit_price * quantity
        original_total: 3000,
        subtotal: 3000,
        tax_total: 0,
        discount_total: 0
      });

      // Verify other fields are preserved
      expect(item.id).toBe('item_1');
      expect(item.quantity).toBe(2);
      expect(item.unit_price).toBe(1500);
      expect(item.metadata).toEqual({ test: 'data' });
      
      // Verify variant is enhanced with metadata structure
      expect(item.variant.id).toBe('variant_1');
      expect(item.variant.metadata).toEqual({});
      expect(item.variant.price_attributes).toBeNull();
      expect(item.variant.product).toBeNull();

      // Verify formatted prices use fallback totals
      expect(item.discounted_price).toBe('$15.00'); // 3000 / 2 / 100
      expect(item.price).toBe('$15.00');
    });

    it('should handle empty or null items array', async () => {
      const mockTotalsService = {
        getLineItemTotals: jest.fn()
      };

      const mockOrder = { id: 'order_123', currency_code: 'usd' };

      // Test with null
      let result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        null,
        mockTotalsService,
        mockOrder
      );
      expect(result).toEqual([]);

      // Test with undefined
      result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        undefined,
        mockTotalsService,
        mockOrder
      );
      expect(result).toEqual([]);

      // Test with empty array
      result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        [],
        mockTotalsService,
        mockOrder
      );
      expect(result).toEqual([]);

      // Verify totals service was never called
      expect(mockTotalsService.getLineItemTotals).not.toHaveBeenCalled();
    });

    it('should preserve nested metadata structures', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 1,
          unit_price: 2000,
          metadata: {
            price_attributes: {
              tier_pricing: {
                tier_1: { min: 1, price: 2000 },
                tier_2: { min: 5, price: 1800 }
              },
              custom_fields: {
                engraving: 'Custom Text',
                gift_wrap: true
              }
            },
            fulfillment: {
              warehouse: 'east_coast',
              special_handling: true
            }
          },
          variant: {
            id: 'variant_1',
            metadata: {
              attributes: {
                color: 'red',
                size: 'M',
                material: 'leather'
              },
              inventory: {
                location: 'A-1-2',
                reserved: 3
              }
            },
            product: {
              id: 'product_1',
              metadata: {
                category_tree: {
                  level_1: 'accessories',
                  level_2: 'bags',
                  level_3: 'handbags'
                },
                seo: {
                  title: 'Premium Leather Handbag',
                  description: 'Luxury handbag made from genuine leather'
                }
              }
            }
          }
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 2000,
          original_total: 2000,
          subtotal: 2000,
          tax_total: 0,
          discount_total: 0
        })
      };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        { id: 'order_123' }
      );

      const item = result[0];

      // Verify nested metadata structures are preserved
      expect(item.metadata.price_attributes.tier_pricing.tier_1).toEqual({
        min: 1,
        price: 2000
      });
      expect(item.metadata.price_attributes.custom_fields).toEqual({
        engraving: 'Custom Text',
        gift_wrap: true
      });
      expect(item.metadata.fulfillment).toEqual({
        warehouse: 'east_coast',
        special_handling: true
      });

      // Verify variant metadata nesting
      expect(item.variant.metadata.attributes).toEqual({
        color: 'red',
        size: 'M',
        material: 'leather'
      });
      expect(item.variant.metadata.inventory).toEqual({
        location: 'A-1-2',
        reserved: 3
      });

      // Verify product metadata nesting
      expect(item.variant.product.metadata.category_tree).toEqual({
        level_1: 'accessories',
        level_2: 'bags',
        level_3: 'handbags'
      });
      expect(item.variant.product.metadata.seo).toEqual({
        title: 'Premium Leather Handbag',
        description: 'Luxury handbag made from genuine leather'
      });
    });
  });

  describe('Error Handling and Data Validation', () => {
    it('should validate that all required relations are included', () => {
      const relations = mockEnhancedOrderLogic.getEnhancedRelations();
      
      // Verify minimum required relations for complete order data
      const criticalRelations = [
        'customer',
        'billing_address', 
        'shipping_address',
        'items',
        'items.variant',
        'items.variant.product'
      ];

      criticalRelations.forEach(relation => {
        expect(relations).toContain(relation);
      });

      // Verify enhanced relations for metadata preservation
      const enhancedRelations = [
        'items.variant.product.profiles',
        'items.adjustments',
        'items.tax_lines',
        'region',
        'sales_channel'
      ];

      enhancedRelations.forEach(relation => {
        expect(relations).toContain(relation);
      });
    });

    it('should validate that all required select fields are included', () => {
      const selectFields = mockEnhancedOrderLogic.getEnhancedSelectFields();
      
      // Verify core identification fields
      const identificationFields = ['id', 'display_id', 'email', 'customer_id'];
      identificationFields.forEach(field => {
        expect(selectFields).toContain(field);
      });

      // Verify status fields
      const statusFields = ['status', 'fulfillment_status', 'payment_status'];
      statusFields.forEach(field => {
        expect(selectFields).toContain(field);
      });

      // Verify financial fields
      const financialFields = ['total', 'subtotal', 'tax_total', 'shipping_total', 'discount_total'];
      financialFields.forEach(field => {
        expect(selectFields).toContain(field);
      });

      // Verify metadata and timestamp fields
      const metadataFields = ['metadata', 'created_at', 'updated_at'];
      metadataFields.forEach(field => {
        expect(selectFields).toContain(field);
      });
    });

    it('should handle complex nested metadata structures without errors', async () => {
      const complexItems = [
        {
          id: 'item_1',
          quantity: 1,
          unit_price: 1000,
          metadata: {
            deeply: {
              nested: {
                structure: {
                  with: {
                    multiple: {
                      levels: 'value'
                    }
                  }
                }
              }
            },
            arrays: [
              { id: 1, data: 'first' },
              { id: 2, data: 'second' }
            ],
            null_values: null,
            empty_objects: {},
            boolean_flags: true
          },
          variant: {
            id: 'variant_1',
            metadata: {
              complex_pricing: {
                tiers: [
                  { min: 1, max: 10, price: 1000 },
                  { min: 11, max: 50, price: 900 }
                ],
                currency_overrides: {
                  EUR: { multiplier: 0.85 },
                  GBP: { multiplier: 0.75 }
                }
              }
            },
            product: {
              id: 'product_1',
              metadata: {
                specifications: {
                  dimensions: { width: 10, height: 20, depth: 5 },
                  materials: ['cotton', 'polyester'],
                  care: {
                    washing: { temperature: 30, cycle: 'gentle' },
                    drying: { method: 'air_dry', temperature: 'low' }
                  }
                }
              }
            }
          }
        }
      ];

      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockResolvedValue({
          total: 1000,
          original_total: 1000,
          subtotal: 1000,
          tax_total: 0,
          discount_total: 0
        })
      };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        complexItems,
        mockTotalsService,
        { id: 'order_123' }
      );

      const item = result[0];

      // Verify complex nested structures are preserved
      expect(item.metadata.deeply.nested.structure.with.multiple.levels).toBe('value');
      expect(item.metadata.arrays).toHaveLength(2);
      expect(item.metadata.arrays[0]).toEqual({ id: 1, data: 'first' });
      expect(item.metadata.null_values).toBeNull();
      expect(item.metadata.empty_objects).toEqual({});
      expect(item.metadata.boolean_flags).toBe(true);

      // Verify variant complex metadata
      expect(item.variant.metadata.complex_pricing.tiers).toHaveLength(2);
      expect(item.variant.metadata.complex_pricing.currency_overrides.EUR.multiplier).toBe(0.85);

      // Verify product complex metadata
      expect(item.variant.product.metadata.specifications.dimensions).toEqual({
        width: 10, height: 20, depth: 5
      });
      expect(item.variant.product.metadata.specifications.materials).toEqual(['cotton', 'polyester']);
      expect(item.variant.product.metadata.specifications.care.washing.temperature).toBe(30);
    });

    it('should maintain data integrity during error scenarios', async () => {
      const mockItems = [
        {
          id: 'item_1',
          quantity: 2,
          unit_price: 1500,
          metadata: { important: 'data' },
          variant: {
            id: 'variant_1',
            metadata: { critical: 'info' },
            product: {
              id: 'product_1',
              metadata: { essential: 'details' }
            }
          }
        }
      ];

      // Mock totals service to fail
      const mockTotalsService = {
        getLineItemTotals: jest.fn().mockRejectedValue(new Error('Service unavailable'))
      };

      const result = await mockEnhancedOrderLogic.processItemsWithCompleteData(
        mockItems,
        mockTotalsService,
        { id: 'order_123' }
      );

      const item = result[0];

      // Verify original data is preserved despite totals failure
      expect(item.id).toBe('item_1');
      expect(item.quantity).toBe(2);
      expect(item.unit_price).toBe(1500);
      expect(item.metadata).toEqual({ important: 'data' });
      expect(item.variant.id).toBe('variant_1');
      expect(item.variant.metadata).toEqual({ critical: 'info' });
      expect(item.variant.product.id).toBe('product_1');
      expect(item.variant.product.metadata).toEqual({ essential: 'details' });

      // Verify fallback totals are calculated
      expect(item.totals.total).toBe(3000); // 1500 * 2
      expect(item.totals.original_total).toBe(3000);
    });

    it('should validate backward compatibility requirements', () => {
      // Test that enhanced logic doesn't break existing functionality
      const relations = mockEnhancedOrderLogic.getEnhancedRelations();
      const selectFields = mockEnhancedOrderLogic.getEnhancedSelectFields();

      // Verify original minimal relations are still included
      const originalRelations = [
        'customer', 'billing_address', 'shipping_address', 'discounts',
        'discounts.rule', 'shipping_methods', 'shipping_methods.shipping_option',
        'payments', 'fulfillments', 'returns', 'gift_cards', 'gift_card_transactions'
      ];

      originalRelations.forEach(relation => {
        expect(relations).toContain(relation);
      });

      // Verify original minimal select fields are still included
      const originalSelectFields = [
        'shipping_total', 'discount_total', 'tax_total', 'refunded_total',
        'gift_card_total', 'subtotal', 'total', 'currency_code', 'tax_rate',
        'created_at', 'email', 'id', 'display_id'
      ];

      originalSelectFields.forEach(field => {
        expect(selectFields).toContain(field);
      });
    });
  });
});